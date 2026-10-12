import type { fType } from "../../generated/prisma/enums";

export type StorageProviderName = "S3" | "CLOUDINARY";

export type UploadScope =
  | { type: "channel"; id: string }
  | { type: "conversation"; id: string };

export interface UploadIntentInput {
  filename: string;
  mimeType: string;
  fileSize: number;
  fileType: fType;
  scope: UploadScope;
  userId: string;
}

export interface UploadIntent {
  provider: StorageProviderName;
  key: string;
  uploadUrl: string;
  method: "PUT" | "POST";
  headers?: Record<string, string>;
  fields?: Record<string, string>;
  expiresAt: Date;
}

export interface CompleteUploadInput {
  key: string;
  mimeType: string;
  fileType: fType;
  publicId?: string | undefined;
  secureUrl?: string | undefined;
}

export interface ConfirmedUpload {
  verified: boolean;
  storageKey: string | null;
  publicId?: string | null;
  url?: string | null;
}

export interface ReadUrlOptions {
  mimeType?: string;
}

/**
 * Provider-agnostic storage contract. Uploads are created, confirmed, read and
 * deleted through this interface so the rest of the app never depends on a
 * specific vendor (no lock-in). Phase 2 (CloudFront) changes only the S3
 * provider's `getReadUrl` — nothing else.
 */
export interface StorageProvider {
  readonly name: StorageProviderName;
  createUploadIntent(input: UploadIntentInput): Promise<UploadIntent>;
  confirmUpload(input: CompleteUploadInput): Promise<ConfirmedUpload>;
  getReadUrl(key: string, opts?: ReadUrlOptions): Promise<string>;
  delete(key: string, opts?: ReadUrlOptions): Promise<void>;
  isAvailable(): Promise<boolean>;
}