import crypto from "crypto";
import { ValueTransformer } from "typeorm";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag

function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, "hex");
  }
  // Fallback key derived from JWT_SECRET or default string for dev/testing safety
  const fallbackSecret = process.env.JWT_SECRET || "medicalsys-default-encryption-secret-key-32bytes";
  return crypto.createHash("sha256").update(fallbackSecret).digest();
}

/**
 * Encrypts a string using AES-256-GCM.
 * Output format: iv_hex:authTag_hex:ciphertext_hex
 */
export function encrypt(text: string | null | undefined): string | null | undefined {
  if (text === null || text === undefined || text === "") return text;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Error during encryption:", error);
    return text;
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string (format: iv_hex:authTag_hex:ciphertext_hex).
 * If the input is not encrypted (e.g., legacy plain text), returns the original input.
 */
export function decrypt(text: string | null | undefined): string | null | undefined {
  if (text === null || text === undefined || text === "") return text;

  const parts = text.split(":");
  if (parts.length !== 3) {
    return text;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  if (ivHex.length !== IV_LENGTH * 2 || authTagHex.length !== AUTH_TAG_LENGTH * 2) {
    return text;
  }

  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    return text;
  }
}

export const encryptionTransformer: ValueTransformer = {
  to: (value: any) => {
    if (value === null || value === undefined) return value;
    return encrypt(String(value));
  },
  from: (value: any) => {
    if (value === null || value === undefined) return value;
    return decrypt(String(value));
  },
};
