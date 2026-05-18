// Hardcoded hashes for Vatsalya@0203 and the password
// Generated using SHA-256
export const ADMIN_USER_HASH = '5899a0c5ee31d8715a612c8155412902f33e23a99eeffc73e21d298e2bda37e0';
export const ADMIN_PASS_HASH = '6f2e41e5d5a85661f6baf66d9675a922803fb92b79eae328a44fd738ba3a73a0';

export async function hashSHA256(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyAdminCredentials(user: string, pass: string): Promise<boolean> {
  const userHash = await hashSHA256(user);
  const passHash = await hashSHA256(pass);
  return userHash === ADMIN_USER_HASH && passHash === ADMIN_PASS_HASH;
}
