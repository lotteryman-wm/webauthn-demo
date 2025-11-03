import type { RequestHandler } from "express";

import {
  RegistrationResponseJSON,
  VerifiedRegistrationResponse,
  verifyRegistrationResponse,
  VerifyRegistrationResponseOpts,
  WebAuthnCredential,
} from "@simplewebauthn/server";
import {
  addUserCredential,
  expectedOrigin,
  getUserByUsername,
  rpID,
} from "../../libs/auth";
import { wait } from "../../libs/wait";

const handler: RequestHandler = async (req, res) => {
  const body: {
    username: string;
    registration: RegistrationResponseJSON;
  } = req.body;
  await wait(500);

  const { username, registration } = body;

  const user = getUserByUsername(username);
  const expectedChallenge = req.session.currentChallenge;

  if (!user) {
    return res.status(400).send({ error: "User does not exist" });
  }
  if (!expectedChallenge) {
    return res.status(400).send({ error: "Challenge does not exist" });
  }

  let verification: VerifiedRegistrationResponse;
  try {
    const opts: VerifyRegistrationResponseOpts = {
      response: registration,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    };
    verification = await verifyRegistrationResponse(opts);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({ error: error.message });
    }

    return res.status(500).send({ error: "Unexpected Server Error" });
  }

  const { verified, registrationInfo } = verification;
  if (verified && registrationInfo) {
    const { credential } = registrationInfo;

    const existingCredential = user.credentials.find(
      (cred) => cred.id === credential.id
    );

    if (!existingCredential) {
      /**
       * Add the returned credential to the user's list of credentials
       */
      const newCredential: WebAuthnCredential = {
        id: credential.id,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: registration.response.transports,
      };

      addUserCredential(user.id, newCredential);
    }
  }

  req.session.currentChallenge = undefined;
  res.send({
    verified,
  });
};

export default handler;
