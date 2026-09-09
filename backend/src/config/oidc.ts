import * as oidc from "openid-client";
import { env } from "./env.js";

export const oidcConfig = await oidc.discovery(
  new URL("https://accounts.google.com"),
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET
);

