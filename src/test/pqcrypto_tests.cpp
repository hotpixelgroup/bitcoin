// Copyright (c) 2024-present The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#include <addresstype.h>
#include <key.h>
#include <key_io.h>
#include <pqcrypto.h>
#include <pubkey.h>
#include <script/interpreter.h>
#include <script/script.h>
#include <script/solver.h>
#include <test/util/setup_common.h>
#include <util/strencodings.h>

#include <boost/test/unit_test.hpp>

#include <vector>

BOOST_FIXTURE_TEST_SUITE(pqcrypto_tests, BasicTestingSetup)

// ============================================================================
// Algorithm parameter tests
// ============================================================================

BOOST_AUTO_TEST_CASE(pq_algorithm_params)
{
    // ML-DSA-44
    const auto* p44 = GetPQAlgorithmParams(PQAlgorithm::ML_DSA_44);
    BOOST_REQUIRE(p44 != nullptr);
    BOOST_CHECK_EQUAL(p44->pubkey_size, 1312U);
    BOOST_CHECK_EQUAL(p44->signature_size, 2420U);
    BOOST_CHECK_EQUAL(p44->seckey_size, 2560U);
    BOOST_CHECK_EQUAL(std::string(p44->name), "ML-DSA-44");

    // ML-DSA-65
    const auto* p65 = GetPQAlgorithmParams(PQAlgorithm::ML_DSA_65);
    BOOST_REQUIRE(p65 != nullptr);
    BOOST_CHECK_EQUAL(p65->pubkey_size, 1952U);
    BOOST_CHECK_EQUAL(p65->signature_size, 3309U);

    // SLH-DSA-128s
    const auto* pslh = GetPQAlgorithmParams(PQAlgorithm::SLH_DSA_128s);
    BOOST_REQUIRE(pslh != nullptr);
    BOOST_CHECK_EQUAL(pslh->pubkey_size, 32U);
    BOOST_CHECK_EQUAL(pslh->signature_size, 7856U);

    // Unknown algorithm
    const auto* punknown = GetPQAlgorithmParams(static_cast<PQAlgorithm>(0xFF));
    BOOST_CHECK(punknown == nullptr);
}

// ============================================================================
// PQ public key validation tests
// ============================================================================

BOOST_AUTO_TEST_CASE(pq_pubkey_blob_validation)
{
    // Valid ML-DSA-44 blob: algo_id(0x00) + 1312 bytes of key material
    std::vector<unsigned char> valid_44(1 + MLDSA44_PUBKEY_SIZE, 0xAB);
    valid_44[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_44);
    auto result = ValidatePQPubKeyBlob(valid_44);
    BOOST_REQUIRE(result.has_value());
    BOOST_CHECK(*result == PQAlgorithm::ML_DSA_44);

    // Valid ML-DSA-65 blob
    std::vector<unsigned char> valid_65(1 + MLDSA65_PUBKEY_SIZE, 0xCD);
    valid_65[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_65);
    result = ValidatePQPubKeyBlob(valid_65);
    BOOST_REQUIRE(result.has_value());
    BOOST_CHECK(*result == PQAlgorithm::ML_DSA_65);

    // Valid SLH-DSA-128s blob
    std::vector<unsigned char> valid_slh(1 + SLHDSA128S_PUBKEY_SIZE, 0xEF);
    valid_slh[0] = static_cast<unsigned char>(PQAlgorithm::SLH_DSA_128s);
    result = ValidatePQPubKeyBlob(valid_slh);
    BOOST_REQUIRE(result.has_value());
    BOOST_CHECK(*result == PQAlgorithm::SLH_DSA_128s);

    // Wrong size for ML-DSA-44 (too short)
    std::vector<unsigned char> short_44(100, 0xAB);
    short_44[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_44);
    BOOST_CHECK(!ValidatePQPubKeyBlob(short_44).has_value());

    // Wrong size for ML-DSA-44 (too long)
    std::vector<unsigned char> long_44(1 + MLDSA44_PUBKEY_SIZE + 1, 0xAB);
    long_44[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_44);
    BOOST_CHECK(!ValidatePQPubKeyBlob(long_44).has_value());

    // Unknown algorithm prefix
    std::vector<unsigned char> unknown(1 + MLDSA44_PUBKEY_SIZE, 0xAB);
    unknown[0] = 0xFF;
    BOOST_CHECK(!ValidatePQPubKeyBlob(unknown).has_value());

    // Empty blob
    BOOST_CHECK(!ValidatePQPubKeyBlob({}).has_value());
}

BOOST_AUTO_TEST_CASE(pq_signature_size_validation)
{
    BOOST_CHECK(ValidatePQSignatureSize(PQAlgorithm::ML_DSA_44, MLDSA44_SIGNATURE_SIZE));
    BOOST_CHECK(!ValidatePQSignatureSize(PQAlgorithm::ML_DSA_44, MLDSA44_SIGNATURE_SIZE + 1));
    BOOST_CHECK(!ValidatePQSignatureSize(PQAlgorithm::ML_DSA_44, 0));

    BOOST_CHECK(ValidatePQSignatureSize(PQAlgorithm::ML_DSA_65, MLDSA65_SIGNATURE_SIZE));
    BOOST_CHECK(!ValidatePQSignatureSize(PQAlgorithm::ML_DSA_65, MLDSA44_SIGNATURE_SIZE));

    BOOST_CHECK(ValidatePQSignatureSize(PQAlgorithm::SLH_DSA_128s, SLHDSA128S_SIGNATURE_SIZE));
}

// ============================================================================
// PQPubKey class tests
// ============================================================================

BOOST_AUTO_TEST_CASE(pq_pubkey_class)
{
    // Default construction is invalid
    PQPubKey empty_key;
    BOOST_CHECK(!empty_key.IsValid());

    // Construct valid ML-DSA-44 key
    std::vector<unsigned char> key_data(1 + MLDSA44_PUBKEY_SIZE, 0x42);
    key_data[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_44);
    PQPubKey key44{key_data};
    BOOST_CHECK(key44.IsValid());
    BOOST_CHECK(key44.GetAlgorithm() == PQAlgorithm::ML_DSA_44);
    BOOST_CHECK_EQUAL(key44.size(), 1 + MLDSA44_PUBKEY_SIZE);
    BOOST_CHECK_EQUAL(key44.GetKeyBytes().size(), MLDSA44_PUBKEY_SIZE);

    // Verify with correct signature size (stub returns true)
    uint256 hash;
    hash.SetNull();
    std::vector<unsigned char> sig(MLDSA44_SIGNATURE_SIZE, 0x01);
    BOOST_CHECK(key44.Verify(hash, sig));

    // Verify with wrong signature size returns false
    std::vector<unsigned char> bad_sig(100, 0x01);
    BOOST_CHECK(!key44.Verify(hash, bad_sig));

    // Construct with wrong size fails
    std::vector<unsigned char> bad_key(100, 0x42);
    bad_key[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_44);
    PQPubKey bad_key_obj{bad_key};
    BOOST_CHECK(!bad_key_obj.IsValid());

    // Comparison operators
    PQPubKey key44_copy{key_data};
    BOOST_CHECK(key44 == key44_copy);

    std::vector<unsigned char> key_data2(1 + MLDSA44_PUBKEY_SIZE, 0x43);
    key_data2[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_44);
    PQPubKey key44_diff{key_data2};
    BOOST_CHECK(!(key44 == key44_diff));
}

// ============================================================================
// P2QRH commitment tests
// ============================================================================

BOOST_AUTO_TEST_CASE(p2qrh_commitment)
{
    // Create a classical x-only pubkey (32 bytes)
    std::vector<unsigned char> classical_pk(32, 0xAA);

    // Create a PQ pubkey blob (algo_id + key)
    std::vector<unsigned char> pq_blob(1 + MLDSA44_PUBKEY_SIZE, 0xBB);
    pq_blob[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_44);

    // Compute commitment
    uint256 commitment1 = ComputeP2QRHCommitment(classical_pk, pq_blob);
    BOOST_CHECK(!commitment1.IsNull());

    // Same inputs produce same commitment (deterministic)
    uint256 commitment2 = ComputeP2QRHCommitment(classical_pk, pq_blob);
    BOOST_CHECK(commitment1 == commitment2);

    // Different classical key produces different commitment
    std::vector<unsigned char> classical_pk2(32, 0xCC);
    uint256 commitment3 = ComputeP2QRHCommitment(classical_pk2, pq_blob);
    BOOST_CHECK(commitment1 != commitment3);

    // Different PQ key produces different commitment
    std::vector<unsigned char> pq_blob2(1 + MLDSA44_PUBKEY_SIZE, 0xDD);
    pq_blob2[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_44);
    uint256 commitment4 = ComputeP2QRHCommitment(classical_pk, pq_blob2);
    BOOST_CHECK(commitment1 != commitment4);

    // Different algorithm produces different commitment (even if key bytes are same length match)
    std::vector<unsigned char> pq_blob_65(1 + MLDSA65_PUBKEY_SIZE, 0xBB);
    pq_blob_65[0] = static_cast<unsigned char>(PQAlgorithm::ML_DSA_65);
    uint256 commitment5 = ComputeP2QRHCommitment(classical_pk, pq_blob_65);
    BOOST_CHECK(commitment1 != commitment5);

    // Tagged hash: commitment should differ from a naive SHA256
    HashWriter naive{};
    naive.write(MakeByteSpan(std::span{classical_pk}));
    naive.write(MakeByteSpan(std::span{pq_blob}));
    uint256 naive_hash = naive.GetSHA256();
    BOOST_CHECK(commitment1 != naive_hash);
}

// ============================================================================
// P2QRH address type tests
// ============================================================================

BOOST_AUTO_TEST_CASE(p2qrh_address_type)
{
    // Create a P2QRH witness program (32 bytes)
    std::vector<unsigned char> program(32, 0x42);

    // Build OP_2 <32-byte-program> scriptPubKey
    CScript script;
    script << OP_2 << program;

    // Solver should identify it as WITNESS_V2_QRH
    std::vector<std::vector<unsigned char>> solutions;
    TxoutType type = Solver(script, solutions);
    BOOST_CHECK_EQUAL(type, TxoutType::WITNESS_V2_QRH);
    BOOST_CHECK_EQUAL(solutions.size(), 1U);
    BOOST_CHECK(solutions[0] == program);

    // GetTxnOutputType
    BOOST_CHECK_EQUAL(GetTxnOutputType(TxoutType::WITNESS_V2_QRH), "witness_v2_qrh");

    // ExtractDestination should produce WitnessV2QRH
    CTxDestination dest;
    BOOST_CHECK(ExtractDestination(script, dest));
    BOOST_CHECK(std::holds_alternative<WitnessV2QRH>(dest));

    // GetScriptForDestination roundtrip
    CScript reconstructed = GetScriptForDestination(dest);
    BOOST_CHECK(reconstructed == script);

    // IsValidDestination
    BOOST_CHECK(IsValidDestination(dest));
}

BOOST_AUTO_TEST_CASE(p2qrh_address_encoding)
{
    // Create a WitnessV2QRH destination
    uint256 program;
    program.SetNull();
    // Set some non-zero bytes so the address is interesting
    *program.begin() = 0x42;
    *(program.begin() + 31) = 0xFF;
    WitnessV2QRH dest(program);

    // Encode to bech32m address
    std::string address = EncodeDestination(dest);
    BOOST_CHECK(!address.empty());

    // Bech32m addresses for witness v2 should be valid
    // Decode back
    CTxDestination decoded = DecodeDestination(address);
    BOOST_CHECK(IsValidDestination(decoded));
    BOOST_CHECK(std::holds_alternative<WitnessV2QRH>(decoded));

    // Roundtrip should match
    auto decoded_qrh = std::get<WitnessV2QRH>(decoded);
    BOOST_CHECK(uint256{decoded_qrh} == program);
}

// ============================================================================
// P2QRH witness stack validation tests
// ============================================================================

BOOST_AUTO_TEST_CASE(p2qrh_witness_stack_validation)
{
    // Test ValidatePQPubKeyBlob with all supported algorithms
    for (auto algo : {PQAlgorithm::ML_DSA_44, PQAlgorithm::ML_DSA_65, PQAlgorithm::SLH_DSA_128s}) {
        const auto* params = GetPQAlgorithmParams(algo);
        BOOST_REQUIRE(params != nullptr);

        // Create valid blob
        std::vector<unsigned char> blob(1 + params->pubkey_size, 0x42);
        blob[0] = static_cast<unsigned char>(algo);
        auto result = ValidatePQPubKeyBlob(blob);
        BOOST_CHECK(result.has_value());
        BOOST_CHECK(*result == algo);

        // Validate signature size
        BOOST_CHECK(ValidatePQSignatureSize(algo, params->signature_size));
        BOOST_CHECK(!ValidatePQSignatureSize(algo, params->signature_size + 1));
        BOOST_CHECK(!ValidatePQSignatureSize(algo, params->signature_size - 1));
    }
}

// ============================================================================
// Script error string tests
// ============================================================================

BOOST_AUTO_TEST_CASE(p2qrh_error_strings)
{
    // Verify all P2QRH error codes have meaningful error strings
    BOOST_CHECK(ScriptErrorString(SCRIPT_ERR_P2QRH_WRONG_WITNESS_SIZE).find("P2QRH") != std::string::npos);
    BOOST_CHECK(ScriptErrorString(SCRIPT_ERR_P2QRH_INVALID_CLASSICAL_PUBKEY).find("P2QRH") != std::string::npos);
    BOOST_CHECK(ScriptErrorString(SCRIPT_ERR_P2QRH_INVALID_PQ_PUBKEY).find("P2QRH") != std::string::npos);
    BOOST_CHECK(ScriptErrorString(SCRIPT_ERR_P2QRH_INVALID_PQ_SIG_SIZE).find("P2QRH") != std::string::npos);
    BOOST_CHECK(ScriptErrorString(SCRIPT_ERR_P2QRH_COMMITMENT_MISMATCH).find("P2QRH") != std::string::npos);
    BOOST_CHECK(ScriptErrorString(SCRIPT_ERR_P2QRH_CLASSICAL_SIG).find("P2QRH") != std::string::npos);
    BOOST_CHECK(ScriptErrorString(SCRIPT_ERR_P2QRH_PQ_SIG).find("P2QRH") != std::string::npos);
    BOOST_CHECK(ScriptErrorString(SCRIPT_ERR_P2QRH_UNKNOWN_ALGORITHM).find("P2QRH") != std::string::npos);
}

BOOST_AUTO_TEST_SUITE_END()
