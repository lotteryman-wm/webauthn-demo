import type { RequestHandler } from "express";

import {
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type VerifiedAuthenticationResponse,
  type WebAuthnCredential,
} from "@simplewebauthn/server";

import {
  expectedOrigin,
  getUserByCredentialId,
  getUserByUsername,
  rpID,
} from "../../libs/auth";
import { LoggedInUser } from "../../libs/auth.types";
import { wait } from "../../libs/wait";

const handler: RequestHandler = async (req, res) => {
  const body: {
    username: string | undefined;
    authentication: AuthenticationResponseJSON;
  } = req.body;
  await wait(500);

  const { username, authentication } = body;

  let user: LoggedInUser | null;
  const expectedChallenge = req.session.currentChallenge;

  if (username) {
    user = getUserByUsername(username);
  } else {
    user = getUserByCredentialId(authentication.id);
  }

  if (!user) {
    return res.status(400).send({ error: "User does not exist" });
  }
  if (!expectedChallenge) {
    return res.status(400).send({ error: "Challenge does not exist" });
  }

  let targetCredential: WebAuthnCredential | undefined;
  // "Query the DB" here for a credential matching `cred.id`
  for (const cred of user.credentials) {
    if (cred.id === authentication.id) {
      targetCredential = cred;
      break;
    }
  }

  if (!targetCredential) {
    return res.status(400).send({
      error: "Authenticator is not registered with this site",
    });
  }

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response: authentication,
      expectedChallenge: expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: targetCredential,
      requireUserVerification: false,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).send({ error: error.message });
    }

    return res.status(500).send({ error: "Unexpected Server Error" });
  }

  const { verified, authenticationInfo } = verification;

  if (verified) {
    // Update the credential's counter in the DB to the newest count in the authentication
    targetCredential.counter = authenticationInfo.newCounter;
  }

  res.send({ verified, username: user.username });
};

export default handler;
