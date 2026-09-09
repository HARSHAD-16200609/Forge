import type { jwtPayload } from "./jwt";
import "express-session";

declare global {
  namespace Express {
    interface Request {
      user?: jwtPayload
    }
  }
}

declare module "express-session" {
  interface SessionData {
    state?: string;
    codeVerifier?: string;
  }
}
export { };