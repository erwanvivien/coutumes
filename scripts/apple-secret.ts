#!/bin/node

import { SignJWT } from "jose";
import { createPrivateKey } from "crypto";
import { assertDefined } from "@/lib";

const main = async () => {
  const teamId = process.env.APPLE_JWT_TEAM_ID;
  const privateKey = process.env.APPLE_JWT_PRIVATE_KEY_P8;
  // AUTH_APPLE_ID must match the `sub` claim — use it as the source of truth
  const clientId = process.env.AUTH_APPLE_ID;
  const keyId = process.env.APPLE_JWT_KEY_ID;
  assertDefined(teamId, "APPLE_JWT_TEAM_ID not defined");
  assertDefined(privateKey, "APPLE_JWT_PRIVATE_KEY_P8 not defined");
  assertDefined(clientId, "AUTH_APPLE_ID not defined");
  assertDefined(keyId, "APPLE_JWT_KEY_ID not defined");

  // Apple allows a max expiry of 6 months from issuance
  const SIX_MONTHS = "180d";
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + 180);

  const JWT = await new SignJWT({})
    .setAudience("https://appleid.apple.com")
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime(SIX_MONTHS)
    .setSubject(clientId)
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .sign(createPrivateKey(privateKey.replace(/\\n/g, "\n")));

  console.info("Apple client secret generated");
  console.info(`Valid until: ${expDate.toISOString()}`);
  console.info(JWT);
};

void main();
