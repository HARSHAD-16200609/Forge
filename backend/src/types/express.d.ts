import type { jwtPayload } from "./jwt";

declare global {
  namespace Express {
    interface Request {
      user?: jwtPayload
    }
  }
}

export {};