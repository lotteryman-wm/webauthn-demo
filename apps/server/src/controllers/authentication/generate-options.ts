import type { RequestHandler } from "express";

import { generateAuthenticationOptions } from "@simplewebauthn/server";

import { getUserByUsername, rpID } from "../../libs/auth";
import type { LoggedInUser } from "../../libs/auth.types";

/**
 * Registration의 1단계: {@link https://simplewebauthn.dev/docs/packages/server#registration}
 */
const controller: RequestHandler = async (req, res) => {
  const username = req.query.username;
  let user: LoggedInUser | null = null;

  /**
   * 사용자를 특정하여 allowCredentials를 지정할 수 있는 경우
   */
  if (username) {
    if (typeof username !== "string") {
      return res.status(400).json({ error: "Username is invalid" });
    }

    user = getUserByUsername(username);
    if (username && !user) {
      return res.status(400).send({ error: "User not exists" });
    }
  }

  const options = await generateAuthenticationOptions({
    timeout: 60000,
    /**
     * 계정 정보를 전달하지 않는 경우 allowCredentials를 빈 배열로 전달하여 인증 절차 진행
     */
    allowCredentials: user
      ? user.credentials.map((cred) => ({
          id: cred.id,
          type: "public-key",
          transports: cred.transports,
        }))
      : [],
    /**
     * Wondering why user verification isn't required? See here:
     * https://passkeys.dev/docs/use-cases/bootstrapping/#a-note-about-user-verification
     */
    userVerification: "preferred",
    rpID,
  });

  /**
   * Challenge:
   * Registration, Authentication 과정에서 RP(Relying Party)가 생성하여
   * Authenticator(사용자의 인증 장치)로 전송하는 암호학적 난수입니다.
   *
   * 검증 과정에서 재전송 공격을 방지하기 위해 요청이 있을 때마다 새로운 Challenge를 생성하여 세션에 저장하게 됩니다.
   */
  /**
   * The server needs to temporarily remember this value for verification, so don't lose it until
   * after you verify the authentication response.
   */
  req.session.currentChallenge = options.challenge;
  res.send(options);
};

export default controller;
