import { env } from "../../config/env";
import { cloudinaryInstance } from "../../config/cloudinary";
import { getResourceType } from "../../db/message.schema";
import { loggers } from "../../utility/logger/serviceLoggers";
import type {
  CompleteUploadInput,
  ConfirmedUpload,
  StorageProvider,
  UploadIntent,
  UploadIntentInput,
} from "../types";

class CloudinaryStorageProvider implements StorageProvider {
  readonly name = "CLOUDINARY" as const;

  async isAvailable(): Promise<boolean> {
    return Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
        env.CLOUDINARY_API_KEY &&
        env.CLOUDINARY_API_SECRET,
    );
  }

  async createUploadIntent(input: UploadIntentInput): Promise<UploadIntent> {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = [
      "uploads",
      input.scope.type,
      input.scope.id,
      input.userId,
      crypto.randomUUID(),
    ].join("/");

    const paramsToSign = {
      timestamp: String(timestamp),
      public_id: publicId,
    };

    const signature = cloudinaryInstance.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET,
    );

    return {
      provider: "CLOUDINARY",
      key: publicId,
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      method: "POST",
      fields: {
        api_key: env.CLOUDINARY_API_KEY,
        timestamp: String(timestamp),
        signature,
        public_id: publicId,
      },
      expiresAt: new Date(Date.now() + env.SIGNED_URL_TTL_SECONDS * 1000),
    };
  }

  async confirmUpload(input: CompleteUploadInput): Promise<ConfirmedUpload> {
    const publicId = input.publicId ?? input.key;
    const resourceType = getResourceType(input.mimeType);
    try {
      const result = await cloudinaryInstance.api.resource(publicId, {
        resource_type: resourceType,
      });
      return {
        verified: true,
        storageKey: publicId,
        publicId,
        url: input.secureUrl ?? result.secure_url ?? null,
      };
    } catch (err) {
      loggers.audit.warn("STORAGE_CLOUDINARY_CONFIRM_FAILED", {
        error: err instanceof Error ? err.message : String(err),
      });
      return { verified: false, storageKey: publicId };
    }
  }

  async getReadUrl(key: string, opts?: { mimeType?: string }): Promise<string> {
    const resourceType = opts?.mimeType
      ? getResourceType(opts.mimeType)
      : "auto";
    return cloudinaryInstance.url(key, {
      secure: true,
      resource_type: resourceType,
    });
  }

  async delete(key: string, opts?: { mimeType?: string }): Promise<void> {
    const resourceType = opts?.mimeType
      ? getResourceType(opts.mimeType)
      : "auto";
    await cloudinaryInstance.uploader.destroy(key, { resource_type: resourceType });
  }
}

export const cloudinaryStorageProvider = new CloudinaryStorageProvider();