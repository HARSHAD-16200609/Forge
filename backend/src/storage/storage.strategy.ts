import { env } from "../config/env";
import { loggers } from "../utility/logger/serviceLoggers";
import { ServiceUnavailableError } from "../utility/errorHandling/customErrors";
import { cloudinaryStorageProvider } from "./providers/cloudinary.provider";
import { s3StorageProvider } from "./providers/s3.provider";
import type {
  CompleteUploadInput,
  ConfirmedUpload,
  ReadUrlOptions,
  StorageProvider,
  StorageProviderName,
  UploadIntent,
  UploadIntentInput,
} from "./types";

/**
 * Chooses the storage provider at intent-creation time. Tries the primary
 * (env.STORAGE_PRIMARY, default S3) for the whole batch and transparently
 * falls back to the other provider if the primary is unavailable or throws.
 * Confirmation, reads and deletes are dispatched per-object based on the
 * provider stored on the upload row, so objects are never re-routed to the
 * wrong vendor even after the primary is changed.
 */
class StorageStrategy {
  readonly providers: Record<StorageProviderName, StorageProvider>;

  constructor() {
    this.providers = {
      S3: s3StorageProvider,
      CLOUDINARY: cloudinaryStorageProvider,
    };
  }

  get providerOrder(): StorageProviderName[] {
    if (env.STORAGE_FALLBACK_ENABLED !== "true") return [env.STORAGE_PRIMARY];
    const primary: StorageProviderName = env.STORAGE_PRIMARY;
    const fallback: StorageProviderName = primary === "S3" ? "CLOUDINARY" : "S3";
    return [primary, fallback];
  }

  getProvider(name: StorageProviderName): StorageProvider {
    return this.providers[name];
  }

  async createUploadIntents(
    inputs: UploadIntentInput[],
  ): Promise<UploadIntent[]> {
    for (const name of this.providerOrder) {
      const provider = this.providers[name];
      try {
        if (!(await provider.isAvailable())) {
          loggers.audit.warn("STORAGE_PROVIDER_UNAVAILABLE", { provider: name });
          continue;
        }
        const intents: UploadIntent[] = [];
        for (const input of inputs) {
          intents.push(await provider.createUploadIntent(input));
        }
        return intents;
      } catch (err) {
        loggers.audit.warn("STORAGE_PROVIDER_INIT_FAILED", {
          provider: name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    throw new ServiceUnavailableError(
      "No storage provider is available right now",
    );
  }

  async confirmUpload(
    providerName: StorageProviderName,
    input: CompleteUploadInput,
  ): Promise<ConfirmedUpload> {
    return this.providers[providerName].confirmUpload(input);
  }

  async getReadUrl(
    providerName: StorageProviderName,
    key: string,
    opts?: ReadUrlOptions,
  ): Promise<string> {
    return this.providers[providerName].getReadUrl(key, opts);
  }

  async delete(
    providerName: StorageProviderName,
    key: string,
    opts?: ReadUrlOptions,
  ): Promise<void> {
    await this.providers[providerName].delete(key, opts);
  }
}

export const storageStrategy = new StorageStrategy();
export type { StorageProviderName };