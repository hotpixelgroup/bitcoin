'use strict';
// The landing page: copy the install command, and show a shared request's
// two destinations when a sharing link lands here.
(() => {
const status = document.getElementById('copy-status');
document.getElementById('copy-install').onclick = async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById('install-command').textContent);
    status.textContent = 'Install command copied.';
  } catch {
    status.textContent = 'Select and copy the command above.';
  }
  status.hidden = false;
  setTimeout(() => { status.hidden = true; }, 4000);
};
if (/^#decree=vibe1\.[A-Za-z0-9_-]+$/.test(location.hash)) {
  document.getElementById('shared-request').hidden = false;
  document.getElementById('shared-link').href = 'demo.html' + location.hash;
  document.getElementById('shared-local').href = 'http://127.0.0.1:21212/import' + location.hash;
}
})();
