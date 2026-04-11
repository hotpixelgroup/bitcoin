// Copyright (c) 2024-present The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef BITCOIN_PQCRYPTO_H
#define BITCOIN_PQCRYPTO_H

#include <hash.h>
#include <serialize.h>
#include <span.h>
#include <uint256.h>

#include <array>
#include <cstring>
#include <vector>

/**
 * Post-quantum cryptography support for BIP-360 (P2QRH).
 *
 * This implements the key and signature types for ML-DSA-44 (CRYSTALS-Dilithium),
 * the NIST FIPS 204 standardized lattice-based digital signature scheme.
 *
 * ML-DSA-44 parameters (NIST Security Level 2):
 *   - Public key size: 1312 bytes
 *   - Signature size:  2420 bytes
 *   - Secret key size: 2560 bytes
 *
 * The witness program for P2QRH (SegWit v2) commits to:
 *   SHA256(classical_pubkey || pq_pubkey)
 * This enables a hybrid scheme where spending requires both a classical
 * Schnorr signature and a post-quantum ML-DSA signature.
 */

/** ML-DSA-44 (Dilithium) parameter sizes per FIPS 204 */
static constexpr size_t MLDSA44_PUBKEY_SIZE = 1312;
static constexpr size_t MLDSA44_SIGNATURE_SIZE = 2420;
static constexpr size_t MLDSA44_SECKEY_SIZE = 2560;

/** Size of the P2QRH witness program (SHA256 hash of hybrid key commitment) */
static constexpr size_t WITNESS_V2_QRH_SIZE = 32;

/** An encapsulated ML-DSA-44 public key. */
class PQPubKey
{
public:
    static constexpr size_t SIZE = MLDSA44_PUBKEY_SIZE;

private:
    std::vector<unsigned char> m_keydata;

    void Invalidate() { m_keydata.clear(); }

public:
    PQPubKey() = default;

    explicit PQPubKey(std::span<const unsigned char> data)
    {
        if (data.size() == SIZE) {
            m_keydata.assign(data.begin(), data.end());
        }
    }

    bool IsValid() const { return m_keydata.size() == SIZE; }
    size_t size() const { return m_keydata.size(); }
    const unsigned char* data() const { return m_keydata.data(); }
    const unsigned char* begin() const { return m_keydata.data(); }
    const unsigned char* end() const { return m_keydata.data() + m_keydata.size(); }

    /** Get the SHA256 hash of this public key. */
    uint256 GetHash() const
    {
        return Hash(m_keydata);
    }

    /**
     * Verify an ML-DSA-44 signature against this public key.
     *
     * NOTE: This is a stub. A real implementation would call the ML-DSA-44
     * verification routine from a FIPS 204 compliant library (e.g., liboqs,
     * pqcrypto, or a dedicated implementation).
     *
     * @param[in] hash    The message hash to verify against.
     * @param[in] sig     The ML-DSA-44 signature (2420 bytes).
     * @return true if the signature is valid.
     */
    bool Verify(const uint256& hash, std::span<const unsigned char> sig) const
    {
        if (!IsValid()) return false;
        if (sig.size() != MLDSA44_SIGNATURE_SIZE) return false;

        // TODO: Replace with actual ML-DSA-44 verification call.
        // Example with liboqs:
        //   OQS_SIG *signer = OQS_SIG_new(OQS_SIG_alg_ml_dsa_44);
        //   int rc = OQS_SIG_verify(signer, hash.begin(), 32, sig.data(), sig.size(), m_keydata.data());
        //   OQS_SIG_free(signer);
        //   return rc == OQS_SUCCESS;

        // STUB: Accept all well-formed signatures for prototype purposes.
        // This MUST be replaced before any deployment.
        return true;
    }

    friend bool operator==(const PQPubKey& a, const PQPubKey& b) { return a.m_keydata == b.m_keydata; }
    friend bool operator<(const PQPubKey& a, const PQPubKey& b) { return a.m_keydata < b.m_keydata; }

    template <typename Stream>
    void Serialize(Stream& s) const
    {
        ::WriteCompactSize(s, m_keydata.size());
        s << std::span{m_keydata};
    }

    template <typename Stream>
    void Unserialize(Stream& s)
    {
        const size_t len = ::ReadCompactSize(s);
        if (len == SIZE) {
            m_keydata.resize(len);
            s >> std::span{m_keydata};
        } else {
            s.ignore(len);
            Invalidate();
        }
    }
};

/**
 * Compute the hybrid key commitment for P2QRH.
 *
 * The witness program is SHA256(classical_xonly_pubkey || pq_pubkey),
 * binding both key types into a single 32-byte program.
 *
 * @param[in] classical_pubkey  The 32-byte x-only Schnorr public key.
 * @param[in] pq_pubkey         The ML-DSA-44 public key.
 * @return The 32-byte witness program hash.
 */
inline uint256 ComputeP2QRHCommitment(std::span<const unsigned char> classical_pubkey,
                                       const PQPubKey& pq_pubkey)
{
    HashWriter ss{};
    ss << classical_pubkey;
    ss.write(std::span<const unsigned char>{pq_pubkey.data(), pq_pubkey.size()}.template first<1>());
    // Write full PQ key
    ss.write(MakeByteSpan(std::span{pq_pubkey.data(), pq_pubkey.size()}));
    return ss.GetSHA256();
}

/**
 * Verify a P2QRH hybrid witness.
 *
 * The witness stack for a P2QRH spend must contain:
 *   [0] classical_signature  (64 bytes, Schnorr BIP340)
 *   [1] pq_signature         (2420 bytes, ML-DSA-44)
 *   [2] classical_pubkey     (32 bytes, x-only)
 *   [3] pq_pubkey            (1312 bytes, ML-DSA-44)
 *
 * Verification:
 *   1. Verify SHA256(classical_pubkey || pq_pubkey) == witness_program
 *   2. Verify classical Schnorr signature against classical_pubkey
 *   3. Verify ML-DSA-44 signature against pq_pubkey
 *
 * Both signatures must be valid for the spend to succeed. This hybrid
 * approach ensures security even if one scheme is broken.
 */

/** Number of witness stack items required for a P2QRH key-path spend */
static constexpr size_t P2QRH_WITNESS_ITEMS = 4;

/** Index of each item in the P2QRH witness stack */
static constexpr size_t P2QRH_WITNESS_CLASSICAL_SIG = 0;
static constexpr size_t P2QRH_WITNESS_PQ_SIG = 1;
static constexpr size_t P2QRH_WITNESS_CLASSICAL_PUBKEY = 2;
static constexpr size_t P2QRH_WITNESS_PQ_PUBKEY = 3;

/** Expected sizes for P2QRH witness items */
static constexpr size_t P2QRH_CLASSICAL_SIG_SIZE = 64;    // BIP340 Schnorr
static constexpr size_t P2QRH_CLASSICAL_PUBKEY_SIZE = 32;  // x-only

#endif // BITCOIN_PQCRYPTO_H
