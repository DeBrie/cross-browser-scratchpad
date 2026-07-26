const text = new TextEncoder();
const decoder = new TextDecoder();
const ITERATIONS = 600000;

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function sha256(value) {
  return bytesToBase64(
    new Uint8Array(await crypto.subtle.digest("SHA-256", text.encode(value))),
  );
}

async function derive(email, password, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    text.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: base64ToBytes(salt),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    material,
    512,
  );
  const output = new Uint8Array(bits);
  return {
    vaultKey: await crypto.subtle.importKey(
      "raw",
      output.slice(0, 32),
      "AES-GCM",
      true,
      ["encrypt", "decrypt"],
    ),
    authProof: bytesToBase64(output.slice(32)),
    accountId: await sha256(email.trim().toLowerCase()),
  };
}

export async function createVault(email, password) {
  const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, ...(await derive(email, password, salt)) };
}

export function restoreVault(email, password, salt) {
  return derive(email, password, salt);
}

export async function exportVaultKey(vaultKey) {
  return bytesToBase64(
    new Uint8Array(await crypto.subtle.exportKey("raw", vaultKey)),
  );
}

export function importVaultKey(serializedKey) {
  return crypto.subtle.importKey(
    "raw",
    base64ToBytes(serializedKey),
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );
}

export async function encryptRecord(
  vaultKey,
  key,
  note,
  updatedAt = Date.now(),
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: text.encode(key) },
    vaultKey,
    text.encode(note),
  );
  return {
    key,
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
    updatedAt,
  };
}

export async function decryptRecord(vaultKey, record) {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64ToBytes(record.iv),
      additionalData: text.encode(record.key),
    },
    vaultKey,
    base64ToBytes(record.ciphertext),
  );
  return decoder.decode(decrypted);
}
