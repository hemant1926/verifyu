import { AES, enc, HmacSHA256 } from "crypto-js";

/**
 * Encrypts the given data using AES encryption.
 *
 * @param {string} data - The data to be encrypted.
 * @return {string} The encrypted data as a string.
 */
export const encrypt = (data) => {
    // Encrypt the data using AES encryption.
    // The encryption key is taken from the environment variable AES_TOKEN.
    // If AES_TOKEN is not set, an empty string is used as the encryption key.
    return AES.encrypt(data, process.env.AES_TOKEN || "").toString();
};

/**
 * Decrypts the given data using AES encryption.
 *
 * @param {string} data - The data to be decrypted.
 * @return {string} The decrypted data as a string.
 */
export const decrypt = (data) => {
    // Decrypt the data using AES encryption.
    // The encryption key is taken from the environment variable AES_TOKEN.
    // If AES_TOKEN is not set, an empty string is used as the encryption key.
    return AES.decrypt(data, process.env.AES_TOKEN || "").toString(enc.Utf8);
};
/**
 * Generates a hash of the given data using HMAC-SHA256 algorithm.
 *
 * @param {string} data - The data to be hashed.
 * @return {string} The hash of the data as a string.
 */
export const generateHash = (data) => {
    // Generate a hash of the given data using HMAC-SHA256 algorithm.
    // The hash key is taken from the environment variable HMAC_TOKEN.
    // If HMAC_TOKEN is not set, an empty string is used as the hash key.
    return HmacSHA256(data, process.env.HMAC_TOKEN || "").toString();
};

