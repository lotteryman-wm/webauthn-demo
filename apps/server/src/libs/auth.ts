import type { WebAuthnCredential } from "@simplewebauthn/server";
import type { LoggedInUser } from "./auth.types";

export const loggedInUserId = "internalUserId"; // 로그인된 가상 사용자 ID

/**
 * Relying Party의 ID:
 *
 * Relying Party는 인증을 제공받는 웹사이트 또는 애플리케이션 서버로
 * 사용자에게 로그인 서비스를 제공하는 주체를 의미합니다.
 *
 * @see {@link https://simplewebauthn.dev/docs/packages/server#identifying-your-rp}
 */
export const rpID = process.env.RP_ID || "localhost";

/**
 * 서비스 URL:
 *
 * 사용자가 Registration (신규 인증수단 추가), Authentication (로그인)하는 서비스의 도메인 Origin입니다.
 * 후행 Slash를 넣지 마세요...
 *
 * @see {@link https://simplewebauthn.dev/docs/packages/server#identifying-your-rp}
 */
export const expectedOrigin = `https://${rpID}:3000`;

// DB를 대체하는 휘발성 인메모리 DB
export const inMemoryUserDB = new Map<string, LoggedInUser>();

export function getUserById(id: string) {
  return inMemoryUserDB.get(id) ?? null;
}

let count = 0;
export function createId() {
  count = (count + 1) % 1_000_000;
  return `${Date.now()}__${count}`;
}

export function createUser(id: string, username: string) {
  const user: LoggedInUser = {
    id,
    username,
    credentials: [],
  };

  inMemoryUserDB.set(id, user);
  return user;
}

export function getUserByUsername(username: string) {
  for (const user of inMemoryUserDB.values()) {
    if (user.username === username) {
      return user;
    }
  }

  return null;
}

export function getUserByCredentialId(credentialId: string) {
  for (const user of inMemoryUserDB.values()) {
    if (
      user.credentials &&
      user.credentials.some((credential) => credential.id === credentialId)
    ) {
      return user;
    }
  }

  return null;
}

export function addUserCredential(id: string, credential: WebAuthnCredential) {
  const user = getUserById(id);
  if (!user) {
    return;
  }

  user.credentials.push(credential);
}
