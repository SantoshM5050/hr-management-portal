/**
 * Web Crypto API compliant HS256 JWT signature verification for Next.js Middleware (Edge Runtime).
 * Zero Node.js runtime dependencies.
 */

export interface EdgeJwtPayload {
  userId: string;
  email: string;
  fullName: string;
  isPlatformStaff: boolean;
  tenantId?: string;
  membershipId?: string;
  roleCodes?: string[];
  iat?: number;
  exp?: number;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return atob(base64);
}

export async function verifyJwtEdge(token: string, secretString: string): Promise<EdgeJwtPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secretString);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    const signatureStr = base64UrlDecode(signatureB64);
    const signatureUint8 = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signatureUint8[i] = signatureStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', cryptoKey, signatureUint8, dataToVerify);
    if (!isValid) return null;

    const payloadJson = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadJson) as EdgeJwtPayload;

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}
