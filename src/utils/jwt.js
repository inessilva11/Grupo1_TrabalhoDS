const crypto = require("crypto");

const DEFAULT_SECRET = "saudinob-dev-secret-change-me";
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

function base64UrlEncode(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value));
  return input
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function sign(input) {
  return base64UrlEncode(
    crypto
      .createHmac("sha256", JWT_SECRET)
      .update(input)
      .digest()
  );
}

function createJwt(payload, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = options.expiresInSeconds || 8 * 60 * 60;
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };
  const encodedHeader = base64UrlEncode(header);
  const encodedBody = base64UrlEncode(body);
  const signature = sign(`${encodedHeader}.${encodedBody}`);

  return {
    token: `${encodedHeader}.${encodedBody}.${signature}`,
    payload: body,
    expiresAt: new Date(body.exp * 1000).toISOString()
  };
}

function verifyJwt(token) {
  if (!token || typeof token !== "string") {
    throwJwtError("JWT em falta.");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throwJwtError("Formato JWT invalido.");
  }

  const [encodedHeader, encodedBody, signature] = parts;
  const expectedSignature = sign(`${encodedHeader}.${encodedBody}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  const validSignature =
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!validSignature) {
    throwJwtError("Assinatura JWT inválida.");
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8"));
  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throwJwtError("Cabecalho JWT invalido.");
  }

  const payload = JSON.parse(base64UrlDecode(encodedBody).toString("utf8"));
  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throwJwtError("JWT expirado.");
  }

  return payload;
}

function throwJwtError(message) {
  const error = new Error(message);
  error.statusCode = 401;
  throw error;
}

module.exports = {
  createJwt,
  verifyJwt
};
