import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env";
import { s3, s3Bucket } from "../../config/S3";
import { loggers } from "../../utility/logger/serviceLoggers";
import type {
  CompleteUploadInput,
  ConfirmedUpload,
  StorageProvider,
  UploadIntent,
  UploadIntentInput,
} from "../types";

const sanitizeFilename = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";

type S3ServiceError = Error & {
  $metadata?: { httpStatusCode?: number; requestId?: string };
};

class S3StorageProvider implements StorageProvider {
  readonly name = "S3" as const;

  private healthCheckedAt = 0;
  private healthy = false;

  async isAvailable(): Promise<boolean> {
    if (!s3 || !s3Bucket) {
      loggers.audit.warn("STORAGE_S3_NOT_CONFIGURED");
      return false;
    }
    const now = Date.now();
    if (now - this.healthCheckedAt < 30_000) return this.healthy;

    try {
      await Promise.race([
        s3.send(new HeadBucketCommand({ Bucket: s3Bucket })),
        new Promise((_res, rej) =>
          setTimeout(() => rej(new Error("HeadBucket timed out")), 10_000),
        ),
      ]);
      this.healthy = true;
    } catch (err) {
      const e = err as S3ServiceError;
      this.healthy = false;
      loggers.audit.warn("STORAGE_S3_UNAVAILABLE", {
        error: e.message,
        code: e.name,
        httpStatus: e.$metadata?.httpStatusCode,
        requestId: e.$metadata?.requestId,
      });
    } finally {
      this.healthCheckedAt = now;
    }
    return this.healthy;
  }

  async createUploadIntent(input: UploadIntentInput): Promise<UploadIntent> {
    if (!s3 || !s3Bucket) throw new Error("S3 is not configured");

    const key = [
      "uploads",
      input.scope.type,
      input.scope.id,
      input.userId,
      `${crypto.randomUUID()}-${sanitizeFilename(input.filename)}`,
    ].join("/");

    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      ContentType: input.mimeType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: env.SIGNED_URL_TTL_SECONDS,
    });

    return {
      provider: "S3",
      key,
      uploadUrl,
      method: "PUT",
      headers: { "Content-Type": input.mimeType },
      expiresAt: new Date(Date.now() + env.SIGNED_URL_TTL_SECONDS * 1000),
    };
  }

  async confirmUpload(input: CompleteUploadInput): Promise<ConfirmedUpload> {
    if (!s3 || !s3Bucket) return { verified: false, storageKey: input.key };
    try {
      await s3.send(
        new HeadObjectCommand({ Bucket: s3Bucket, Key: input.key }),
      );
      return { verified: true, storageKey: input.key, url: null };
    } catch {
      return { verified: false, storageKey: input.key };
    }
  }

  async getReadUrl(key: string): Promise<string> {
    if (!s3 || !s3Bucket) throw new Error("S3 is not configured");

    if (env.CLOUDFRONT_DOMAIN) {
      const base = env.CLOUDFRONT_DOMAIN.replace(/\/+$/, "");
      return `${base}/${key}`;
    }

    const command = new GetObjectCommand({ Bucket: s3Bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn: env.SIGNED_URL_TTL_SECONDS });
  }

  async delete(key: string): Promise<void> {
    if (!s3 || !s3Bucket) throw new Error("S3 is not configured");
    await s3.send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: key }));
  }
}

export const s3StorageProvider = new S3StorageProvider();