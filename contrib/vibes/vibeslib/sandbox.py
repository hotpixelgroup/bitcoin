# Copyright (c) 2026-present The Bitcoin Vibes developers
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.
"""Operating-system confinement for code the console did not write.

A proposal is AI-written source. Compiling it runs build scripts the agent may
have edited; testing it and starting it run the result. None of that should be
able to read the operator's files, write outside the lab, or reach the network.

This module wraps a command so the operating system enforces that:

  macOS   sandbox-exec (Seatbelt) with a generated profile
  Linux   bubblewrap (bwrap) with a private view of the filesystem
  Docker  the container is the enclosure (VIBES_SANDBOX=container)

It is confinement, not a virtual machine: it narrows what a process can read,
write and connect to, and relies on the operating system to hold that line.
When no mechanism is available the console says so and falls back to review
before anything is compiled.
"""

import glob
import os
import shutil
import subprocess
import sys
from pathlib import Path

# Environment a confined process may inherit. Everything else is dropped, so
# API keys and tokens in the operator's shell never reach AI-written code.
ENV_KEEP = ("PATH", "HOME", "USER", "LOGNAME", "SHELL", "LANG", "TZ", "TERM",
            "CC", "CXX", "CFLAGS", "CXXFLAGS", "CPPFLAGS", "LDFLAGS",
            "SDKROOT", "DEVELOPER_DIR", "MACOSX_DEPLOYMENT_TARGET",
            "PKG_CONFIG_PATH", "BOOST_ROOT", "HOMEBREW_PREFIX", "LD_LIBRARY_PATH")
ENV_KEEP_PREFIXES = ("LC_", "CMAKE_", "CCACHE_", "NIX_")

# Device files a normal build or node needs to write to.
MAC_DEVICE_WRITES = ('(literal "/dev/null") (literal "/dev/zero") (literal "/dev/tty") '
                     '(literal "/dev/dtracehelper") (regex #"^/dev/fd/[0-9]+$") '
                     '(regex #"^/dev/ttys[0-9]+$")')


def _real(path):
    return os.path.realpath(str(path))


def _quote(path):
    """A path as a Seatbelt string literal."""
    return '"' + str(path).replace("\\", "\\\\").replace('"', '\\"') + '"'


def _ancestors(path, stop):
    """Folders between `stop` (inclusive) and `path` (exclusive)."""
    out, current = [], os.path.dirname(path)
    while current.startswith(stop) and current not in out:
        out.append(current)
        if current == stop:
            break
        current = os.path.dirname(current)
    return out


class Sandbox:
    """Decides how commands are confined on this machine and wraps them."""

    def __init__(self, repo, state_dir, mode=None):
        self.repo = _real(repo)
        self.state_dir = _real(state_dir)
        self.home = _real(Path.home())
        mode = (mode or os.environ.get("VIBES_SANDBOX") or "auto").lower()
        self.kind, self.reason = self._detect(mode)

    # ----- detection ------------------------------------------------------

    def _detect(self, mode):
        if mode == "off":
            return "off", "switched off with VIBES_SANDBOX=off"
        if mode == "container":
            return "container", ""
        if sys.platform == "darwin":
            tool = "/usr/bin/sandbox-exec"
            if not os.access(tool, os.X_OK):
                return "off", "sandbox-exec is not present on this Mac"
            probe = subprocess.run([tool, "-p", "(version 1)(allow default)", "/usr/bin/true"],
                                   capture_output=True, timeout=20)
            if probe.returncode != 0:
                return "off", "sandbox-exec could not start (the console may itself be sandboxed)"
            return "seatbelt", ""
        if sys.platform.startswith("linux"):
            tool = shutil.which("bwrap")
            if not tool:
                return "off", "bubblewrap is not installed (install the bubblewrap package)"
            probe = subprocess.run([tool, "--ro-bind", "/", "/", "--unshare-net", "--die-with-parent",
                                    "true"], capture_output=True, timeout=20)
            if probe.returncode != 0:
                return "off", "bubblewrap could not create a sandbox on this system"
            return "bwrap", ""
        return "off", "no supported sandbox on this operating system"

    @property
    def contained(self):
        return self.kind != "off"

    def summary(self):
        """What the console tells the operator about confinement."""
        labels = {
            "seatbelt": "macOS sandbox",
            "bwrap": "Linux sandbox (bubblewrap)",
            "container": "Container",
            "off": "Not confined",
        }
        details = {
            "seatbelt": "Builds, tests and lab nodes run inside the macOS sandbox: no network "
                        "beyond the lab's own loopback ports, no writes outside the lab folders, "
                        "and no access to your home folder beyond this source tree.",
            "bwrap": "Builds, tests and lab nodes run inside bubblewrap: a private network, no "
                     "writes outside the lab folders, and no view of your home folder beyond "
                     "this source tree.",
            "container": "The console is running in a container, which is the enclosure. Builds, "
                         "tests and nodes can reach whatever the container can reach.",
            "off": "No operating-system sandbox is available here (" + self.reason + "). "
                   "Proposals are not compiled until you have reviewed them, and automatic "
                   "mode is switched off.",
        }
        return {"kind": self.kind, "contained": self.contained, "label": labels[self.kind],
                "detail": details[self.kind]}

    # ----- environment ----------------------------------------------------

    @staticmethod
    def clean_env(tmpdir=None, extra=None):
        """The operator's environment with secrets and noise removed."""
        env = {key: value for key, value in os.environ.items()
               if key in ENV_KEEP or key.startswith(ENV_KEEP_PREFIXES)}
        env.setdefault("PATH", "/usr/local/bin:/usr/bin:/bin")
        if tmpdir:
            env["TMPDIR"] = str(tmpdir)
        env["GIT_OPTIONAL_LOCKS"] = "0"
        env.update(extra or {})
        return env

    # ----- wrapping -------------------------------------------------------

    def _readable(self, write, read=()):
        """Paths under the home folder that a confined process may read."""
        paths = [self.repo, *[_real(p) for p in write], *[_real(p) for p in read]]
        for name in (".gitconfig", ".config/git"):
            candidate = os.path.join(self.home, name)
            if os.path.exists(candidate):
                paths.append(_real(candidate))
        # Toolchains installed under the home folder (pyenv, ~/.local, a
        # personal Homebrew): expose the tool's own folders, nothing wider.
        tools = [sys.executable, *(shutil.which(t) or "" for t in
                                   ("cmake", "ninja", "make", "cc", "c++", "git", "ccache"))]
        for tool in filter(None, tools):
            real = _real(tool)
            if not real.startswith(self.home + os.sep):
                continue
            prefix = os.path.dirname(os.path.dirname(real))
            paths.append(os.path.dirname(real))
            for sub in ("lib", "libexec", "include", "Frameworks"):
                if os.path.isdir(os.path.join(prefix, sub)):
                    paths.append(os.path.join(prefix, sub))
            paths.extend(glob.glob(os.path.join(prefix, "share", "cmake*")))
        for extra in filter(None, os.environ.get("VIBES_SANDBOX_READ", "").split(os.pathsep)):
            paths.append(_real(extra))
        seen = []
        for path in paths:
            if path not in seen:
                seen.append(path)
        return seen

    def _secrets(self, write):
        """Paths inside the source tree that confined code must never read:
        the console's access key and the operator's own node data."""
        hidden = [os.path.join(self.state_dir, "key"), os.path.join(self.state_dir, "data")]
        allowed = [_real(p) for p in write]
        return [h for h in hidden if not any(h == a or h.startswith(a + os.sep) for a in allowed)]

    def seatbelt_profile(self, write=(), network="none", ports=(), read=()):
        readable = self._readable(write, read)
        lines = ["(version 1)", "(allow default)"]
        lines.append(f"(deny file-read* (subpath {_quote(self.home)}))")
        lines.append("(allow file-read* " + " ".join(f"(subpath {_quote(p)})" for p in readable) + ")")
        parents = []
        for path in readable:
            for parent in _ancestors(path, self.home):
                if parent not in parents:
                    parents.append(parent)
        if parents:
            lines.append("(allow file-read-metadata " +
                         " ".join(f"(literal {_quote(p)})" for p in parents) + ")")
        for secret in self._secrets(write):
            lines.append(f"(deny file-read* (literal {_quote(secret)}) (subpath {_quote(secret)}))")
        lines.append("(deny file-write*)")
        lines.append("(allow file-write* " +
                     " ".join(f"(subpath {_quote(_real(p))})" for p in write) +
                     " " + MAC_DEVICE_WRITES + ")")
        if network != "full":
            lines.append("(deny network*)")
        if network == "local":
            lines.append('(allow network* (local ip "localhost:*") (remote ip "localhost:*"))')
        if network == "loopback":
            for port in ports:
                lines.append(f'(allow network-bind (local ip "localhost:{int(port)}"))')
                lines.append(f'(allow network-inbound (local ip "localhost:{int(port)}"))')
                lines.append(f'(allow network-outbound (remote ip "localhost:{int(port)}"))')
        return "\n".join(lines) + "\n"

    def bwrap_args(self, write=(), network="none", read=()):
        args = ["bwrap", "--die-with-parent", "--unshare-pid", "--unshare-ipc", "--unshare-uts",
                "--ro-bind", "/", "/", "--dev", "/dev", "--proc", "/proc",
                "--tmpfs", self.home]
        if network in ("none", "loopback"):
            # A private network namespace with its own loopback: processes
            # started together can talk to each other and to nobody else.
            # "local" cannot be expressed this way, because the console must
            # reach the node over the host's loopback, so it is left open.
            args.append("--unshare-net")
        for path in self._readable(write, read):
            if path.startswith(self.home + os.sep) and os.path.exists(path):
                args += ["--ro-bind", path, path]
        for path in write:
            real = _real(path)
            os.makedirs(real, exist_ok=True)
            args += ["--bind", real, real]
        for secret in self._secrets(write):
            if os.path.isdir(secret):
                args += ["--tmpfs", secret]
            elif os.path.exists(secret):
                args += ["--ro-bind", "/dev/null", secret]
        return args + ["--"]

    def wrap(self, argv, write=(), network="none", ports=(), read=()):
        """Return argv confined by whatever mechanism this machine has.

        write    folders the command may write to (everything else is read-only)
        read     extra folders under the home folder the command may read
        network  "none"; "loopback" (only the given ports, for lab nodes);
                 "local" (this machine only, for the operator's regtest node;
                 not enforceable with bubblewrap); or "full"
        """
        argv = [str(a) for a in argv]
        if self.kind == "seatbelt":
            return ["/usr/bin/sandbox-exec", "-p", self.seatbelt_profile(write, network, ports, read), *argv]
        if self.kind == "bwrap":
            return [*self.bwrap_args(write, network, read), *argv]
        return argv
