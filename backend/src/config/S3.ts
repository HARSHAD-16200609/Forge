import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

export const s3Bucket = env.AWS_S3_BUCKET ?? null;

export const s3Configured = Boolean(
  env.AWS_S3_BUCKET &&
    env.AWS_ACCESS_KEY &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.AWS_REGION
);

export const s3 = s3Configured
  ? new S3Client({
      region: env.AWS_REGION!,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
      ...(env.AWS_ENDPOINT
        ? {
            endpoint: env.AWS_ENDPOINT,
            forcePathStyle: env.AWS_FORCE_PATH_STYLE === "true",
          }
        : {}),
    })
  : null;

export default s3;