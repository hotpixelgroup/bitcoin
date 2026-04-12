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
#include <optional>
#include <vector>

/**
 * Post-quantum cryptography support for BIP-360 (P2QRH).
 *
 * This header defines the cryptographic types and constants for the P2QRH
 * (Pay-to-Quantum-Resistant-Hash) witness program, which uses SegWit v2
 * to implement a hybrid classical + post-quantum signature scheme.
 *
 * ALGORITHM AGILITY:
 * The PQ public key is prefixed with a 1-byte algorithm identifier, enabling
 * future algorithm upgrades without a new witness version:
 *
 *   0x00 - ML-DSA-44  (FIPS 204, NIST Level 2) — default
 *   0x01 - ML-DSA-65  (FIPS 204, NIST Level 3) — higher security
 *   0x02 - SLH-DSA-128s (FIPS 205, NIST Level 1) — hash-based, conservative
 *
 * COMMITMENT SCHEME:
 * The witness program is the tagged hash:
 *   SHA256(tag("QRHCommitment") || classical_xonly_pubkey || algorithm_id || pq_pubkey)
 *
 * HYBRID VERIFICATION:
 * Spending requires BOTH a valid classical Schnorr (BIP340) signature AND a
 * valid post-quantum signature. This ensures security even if one scheme is
 * broken ("defense in depth").
 */

// ============================================================================
// Algorithm identifiers and parameters
// ============================================================================

/** Post-quantum algorithm identifier (1-byte prefix on PQ public keys in witness) */
enum class PQAlgorithm : uint8_t {
    ML_DSA_44  = 0x00,  //!< CRYSTALS-Dilithium, FIPS 204, NIST Level 2
    ML_DSA_65  = 0x01,  //!< CRYSTALS-Dilithium, FIPS 204, NIST Level 3
    SLH_DSA_128s = 0x02, //!< SPHINCS+, FIPS 205, NIST Level 1 (hash-based, conservative)
};

/** Per-algorithm parameter table */
struct PQAlgorithmParams {
    PQAlgorithm id;
    size_t pubkey_size;    //!< Public key size in bytes (excluding algorithm prefix)
    size_t signature_size; //!< Signature size in bytes
    size_t seckey_size;    //!< Secret key size in bytes
    const char* name;      //!< Human-readable name
};

// FIPS 204: ML-DSA (CRYSTALS-Dilithium) parameters
static constexpr size_t MLDSA44_PUBKEY_SIZE    = 1312;
static constexpr size_t MLDSA44_SIGNATURE_SIZE = 2420;
static constexpr size_t MLDSA44_SECKEY_SIZE    = 2560;

static constexpr size_t MLDSA65_PUBKEY_SIZE    = 1952;
static constexpr size_t MLDSA65_SIGNATURE_SIZE = 3309;
static constexpr size_t MLDSA65_SECKEY_SIZE    = 4032;

// FIPS 205: SLH-DSA (SPHINCS+) parameters
static constexpr size_t SLHDSA128S_PUBKEY_SIZE    = 32;
static constexpr size_t SLHDSA128S_SIGNATURE_SIZE = 7856;
static constexpr size_t SLHDSA128S_SECKEY_SIZE    = 64;

/** Lookup algorithm parameters by ID. Returns nullptr for unknown algorithms. */
inline const PQAlgorithmParams* GetPQAlgorithmParams(PQAlgorithm algo) {
    static constexpr PQAlgorithmParams PARAMS[] = {
        {PQAlgorithm::ML_DSA_44,   MLDSA44_PUBKEY_SIZE,   MLDSA44_SIGNATURE_SIZE,   MLDSA44_SECKEY_SIZE,   "ML-DSA-44"},
        {PQAlgorithm::ML_DSA_65,   MLDSA65_PUBKEY_SIZE,   MLDSA65_SIGNATURE_SIZE,   MLDSA65_SECKEY_SIZE,   "ML-DSA-65"},
        {PQAlgorithm::SLH_DSA_128s, SLHDSA128S_PUBKEY_SIZE, SLHDSA128S_SIGNATURE_SIZE, SLHDSA128S_SECKEY_SIZE, "SLH-DSA-128s"},
    };
    for (const auto& p : PARAMS) {
        if (p.id == algo) return &p;
    }
    return nullptr;
}

/** Validate that a raw PQ pubkey blob has correct size for its algorithm prefix.
 *  The first byte is the algorithm ID; remaining bytes are the key material. */
inline std::optional<PQAlgorithm> ValidatePQPubKeyBlob(std::span<const unsigned char> blob) {
    if (blob.empty()) return std::nullopt;
    auto algo = static_cast<PQAlgorithm>(blob[0]);
    const auto* params = GetPQAlgorithmParams(algo);
    if (!params) return std::nullopt;
    // blob = [algo_byte | pubkey_bytes]
    if (blob.size() != 1 + params->pubkey_size) return std::nullopt;
    return algo;
}

/** Validate that a PQ signature has correct size for the given algorithm. */
inline bool ValidatePQSignatureSize(PQAlgorithm algo, size_t sig_size) {
    const auto* params = GetPQAlgorithmParams(algo);
    if (!params) return false;
    return sig_size == params->signature_size;
}

// ============================================================================
// Size of the P2QRH witness program
// ============================================================================

/** Size of the P2QRH witness program (tagged SHA256 hash of hybrid key commitment) */
static constexpr size_t WITNESS_V2_QRH_SIZE = 32;

// ============================================================================
// Tagged hash for P2QRH commitment
// ============================================================================

/** Tagged hash prefix for P2QRH key commitment (BIP-340 style tagged hashing).
 *  Computed as SHA256(SHA256("QRHCommitment") || SHA256("QRHCommitment") || data).
 *  Using tagged hashing prevents cross-protocol attacks. */
inline HashWriter HasherQRHCommitment() {
    return HashWriter{TaggedHash("QRHCommitment")};
}

/** Tagged hash prefix for P2QRH signature hashing.
 *  Separates the QRH sighash domain from Taproot's TapSighash. */
inline HashWriter HasherQRHSighash() {
    return HashWriter{TaggedHash("QRHSighash")};
}

// ============================================================================
// PQ public key (algorithm-agile)
// ============================================================================

/** An encapsulated post-quantum public key with algorithm agility.
 *
 *  Internally stores [algorithm_id (1 byte) || raw_pubkey_bytes].
 *  The algorithm ID determines the expected key and signature sizes.
 */
class PQPubKey
{
private:
    std::vector<unsigned char> m_keydata; //!< [algo_id | raw_key]

    void Invalidate() { m_keydata.clear(); }

public:
    PQPubKey() = default;

    /** Construct from a raw blob (first byte = algorithm ID, rest = key material). */
    explicit PQPubKey(std::span<const unsigned char> data)
    {
        auto algo = ValidatePQPubKeyBlob(data);
        if (algo) {
            m_keydata.assign(data.begin(), data.end());
        }
    }

    /** Algorithm identifier for this key. */
    PQAlgorithm GetAlgorithm() const {
        assert(IsValid());
        return static_cast<PQAlgorithm>(m_keydata[0]);
    }

    /** Get algorithm parameters. Only valid if IsValid(). */
    const PQAlgorithmParams* GetParams() const {
        if (!IsValid()) return nullptr;
        return GetPQAlgorithmParams(GetAlgorithm());
    }

    /** Raw public key bytes (without algorithm prefix). */
    std::span<const unsigned char> GetKeyBytes() const {
        assert(IsValid());
        return std::span{m_keydata}.subspan(1);
    }

    bool IsValid() const {
        return ValidatePQPubKeyBlob(m_keydata).has_value();
    }

    size_t size() const { return m_keydata.size(); }
    const unsigned char* data() const { return m_keydata.data(); }
    const unsigned char* begin() const { return m_keydata.data(); }
    const unsigned char* end() const { return m_keydata.data() + m_keydata.size(); }

    /** Get the SHA256 hash of this public key (including algorithm prefix). */
    uint256 GetHash() const
    {
        return Hash(m_keydata);
    }

    /**
     * Verify a post-quantum signature against this public key.
     *
     * Dispatches to the correct verification routine based on the algorithm ID.
     *
     * @param[in] hash    The 32-byte message hash to verify against.
     * @param[in] sig     The PQ signature bytes.
     * @return true if the signature is valid for this key and algorithm.
     */
    bool Verify(const uint256& hash, std::span<const unsigned char> sig) const
    {
        if (!IsValid()) return false;
        const auto* params = GetParams();
        if (!params) return false;
        if (sig.size() != params->signature_size) return false;

        switch (GetAlgorithm()) {
        case PQAlgorithm::ML_DSA_44:
            return VerifyMLDSA44(hash, sig);
        case PQAlgorithm::ML_DSA_65:
            return VerifyMLDSA65(hash, sig);
        case PQAlgorithm::SLH_DSA_128s:
            return VerifySLHDSA128s(hash, sig);
        }
        return false; // Unknown algorithm
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
        m_keydata.resize(len);
        s >> std::span{m_keydata};
        if (!IsValid()) {
            Invalidate();
        }
    }

private:
    // ========================================================================
    // Per-algorithm verification stubs
    //
    // Each of these MUST be replaced with a call to a FIPS-compliant library
    // (e.g., liboqs, pqcrypto, or a dedicated audited implementation) before
    // deployment. The stubs accept all well-formed signatures.
    // ========================================================================

    bool VerifyMLDSA44(const uint256& hash, std::span<const unsigned char> sig) const
    {
        // TODO: FIPS 204 ML-DSA-44 verification
        // Example (liboqs):
        //   OQS_SIG *signer = OQS_SIG_new(OQS_SIG_alg_ml_dsa_44);
        //   int rc = OQS_SIG_verify(signer, hash.begin(), 32, sig.data(), sig.size(),
        //                           GetKeyBytes().data());
        //   OQS_SIG_free(signer);
        //   return rc == OQS_SUCCESS;
        return true; // STUB
    }

    bool VerifyMLDSA65(const uint256& hash, std::span<const unsigned char> sig) const
    {
        // TODO: FIPS 204 ML-DSA-65 verification
        return true; // STUB
    }

    bool VerifySLHDSA128s(const uint256& hash, std::span<const unsigned char> sig) const
    {
        // TODO: FIPS 205 SLH-DSA-128s verification (stateless hash-based)
        // This is the most conservative choice — security relies only on SHA-256
        // hash function properties, not lattice assumptions.
        return true; // STUB
    }
};

// ============================================================================
// P2QRH commitment computation
// ============================================================================

/**
 * Compute the hybrid key commitment for P2QRH.
 *
 * Uses tagged hashing (BIP-340 style) to produce the 32-byte witness program:
 *   SHA256(SHA256("QRHCommitment") || SHA256("QRHCommitment") ||
 *          classical_xonly_pubkey || pq_pubkey_with_algo_prefix)
 *
 * The commitment binds:
 *   - The classical x-only Schnorr public key (32 bytes)
 *   - The PQ algorithm identifier (1 byte, embedded in pq_pubkey)
 *   - The PQ public key material (variable length)
 *
 * @param[in] classical_pubkey  The 32-byte x-only Schnorr public key.
 * @param[in] pq_pubkey_blob    The PQ public key blob [algo_id | raw_key].
 * @return The 32-byte witness program hash.
 */
inline uint256 ComputeP2QRHCommitment(std::span<const unsigned char> classical_pubkey,
                                       std::span<const unsigned char> pq_pubkey_blob)
{
    HashWriter ss = HasherQRHCommitment();
    ss.write(MakeByteSpan(classical_pubkey));
    ss.write(MakeByteSpan(pq_pubkey_blob));
    return ss.GetSHA256();
}

// ============================================================================
// P2QRH witness stack layout
// ============================================================================

/**
 * P2QRH key-path witness stack layout:
 *
 *   [0] classical_signature  (64-65 bytes, Schnorr BIP340)
 *   [1] pq_signature         (variable, depends on algorithm)
 *   [2] classical_pubkey     (32 bytes, x-only)
 *   [3] pq_pubkey            (1 + N bytes, [algo_id | raw_key])
 *
 * Verification order:
 *   1. Decode algorithm from pq_pubkey[0], validate key and sig sizes
 *   2. Compute tagged commitment, verify it matches witness program
 *   3. Compute QRH sighash (domain-separated from Taproot)
 *   4. Verify classical Schnorr signature
 *   5. Verify post-quantum signature
 *
 * Both signatures must be valid. This hybrid approach ensures security
 * even if one cryptographic scheme is completely broken.
 */

/** Number of witness stack items required for a P2QRH key-path spend */
static constexpr size_t P2QRH_WITNESS_ITEMS = 4;

/** Index of each item in the P2QRH witness stack */
static constexpr size_t P2QRH_WITNESS_CLASSICAL_SIG = 0;
static constexpr size_t P2QRH_WITNESS_PQ_SIG = 1;
static constexpr size_t P2QRH_WITNESS_CLASSICAL_PUBKEY = 2;
static constexpr size_t P2QRH_WITNESS_PQ_PUBKEY = 3;

/** Expected size for classical witness items */
static constexpr size_t P2QRH_CLASSICAL_PUBKEY_SIZE = 32;  //!< x-only (BIP340)

#endif // BITCOIN_PQCRYPTO_H
