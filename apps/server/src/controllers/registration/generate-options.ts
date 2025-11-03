import type { RequestHandler } from "express";

import {
  generateRegistrationOptions,
  GenerateRegistrationOptionsOpts,
} from "@simplewebauthn/server";
import { createId, createUser, getUserByUsername, rpID } from "../../libs/auth";

const handler: RequestHandler = async (req, res) => {
  const username = req.query.username;
  if (typeof username !== "string" || !username) {
    return res.status(400).json({ error: "Username is invalid" });
  }

  let user = getUserByUsername(username);
  if (!user) {
    const id = createId();
    user = createUser(id, username);
  }

  const {
    /**
     * The username can be a human-readable name, email, etc... as it is intended only for display.
     */
    // username,
    credentials,
  } = user;

  const opts: GenerateRegistrationOptionsOpts = {
    rpName: "My relaying party name",
    rpID,
    userName: username,
    timeout: 60000,
    attestationType: "none",
    /**
     * Passing in a user's list of already-registered credential IDs here prevents users from
     * registering the same authenticator multiple times. The authenticator will simply throw an
     * error in the browser if it's asked to perform registration when it recognizes one of the
     * credential ID's.
     */
    excludeCredentials: credentials.map((cred) => ({
      id: cred.id,
      type: "public-key",
      transports: cred.transports,
    })),
    authenticatorSelection: {
      /**
       * 키 쌍을 인증기 내에 저장할지(상주 키) 또는 서버의 Credential ID를 참조하는 방식(비상주 키)을 사용할지 지정합니다:
       * - required: 반드시 PassKey를 생성해야 함
       * - preferred: 상주 키를 선호하나, 지원하지 않을 경우 비상주 키도 지원함
       * - discouraged: 비상주 키를 선호
       */
      residentKey: "preferred",
      /**
       * 인증기 접근 전 사용자 본인 확인이 필요한지 여부를 결정합니다:
       * - required: 인증기 접근 전 사용자의 지문, 얼굴, PIN 등의 인증 필요
       * - preferred: 사용하도록 권장되나, 지원되지 않더라도 등록 및 인증 가능
       * - discouraged: 사용자 인증 절차를 사용하지 않도록 권장
       */
      userVerification: "preferred",
      /**
       * 사용자가 인증기로 내장된 장치, 외부 장치 중 어떤 것을 사용해야 하는지 결정합니다:
       * - platform: 인증기가 내장되어 있어야 함 (Mac Touch ID 등)
       * - cross-platform: 인증기가 분리되어 있어야 함 (USB 등)
       */
      authenticatorAttachment: undefined,
    },
    /**
     * Support the two most common algorithms: ES256, and RS256
     */
    supportedAlgorithmIDs: [-7, -257],
  };

  const options = await generateRegistrationOptions(opts);

  /**
   * The server needs to temporarily remember this value for verification, so don't lose it until
   * after you verify the registration response.
   */
  req.session.currentChallenge = options.challenge;
  console.log("req.session.currentChallenge", req.session.currentChallenge);
  res.send(options);
};

export default handler;
