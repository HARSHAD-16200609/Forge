import { IncomingMessage } from "http";

export interface ConnectionMetadata {
  userId: string;
  sessionId: string;
  connectedAt: Date;
  username?: string;
}



export interface AuthenticatedUser {
  userId: string;
  username: string;
  sessionId: string;
}

export interface AuthenticatedUpgradeRequest extends IncomingMessage {
  user: AuthenticatedUser;
}
