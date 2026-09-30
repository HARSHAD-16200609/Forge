import { config } from "dotenv";

config({ quiet: true });

export type ResolvedDatabaseUrl = {
  url: string;
  source: string;
  isProduction: boolean;
};

export function resolveDatabaseUrl(): ResolvedDatabaseUrl {
  const isProduction = process.env.NODE_ENV === "production";
  const prod = process.env.DATABASE_URL_PROD?.trim();
  const fallback = process.env.DATABASE_URL?.trim();

  if (isProduction) {
    if (prod) {
      return { url: prod, source: "DATABASE_URL_PROD", isProduction };
    }

    if (!fallback) {
      throw new Error(
        "Database configuration error: NODE_ENV=production requires DATABASE_URL_PROD to be set."
      );
    }

    console.warn(
      "[config] DATABASE_URL_PROD is not set; falling back to DATABASE_URL. Set DATABASE_URL_PROD in production to silence this warning."
    );

    return { url: fallback, source: "DATABASE_URL", isProduction };
  }

  if (!fallback) {
    throw new Error(
      "Database configuration error: DATABASE_URL is required when NODE_ENV is not 'production'."
    );
  }

  return { url: fallback, source: "DATABASE_URL", isProduction };
}

export function describeDatabase(url: string): { host: string; database: string } {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.port ? `${parsed.hostname}:${parsed.port}` : parsed.hostname,
      database: parsed.pathname.replace(/^\//, "") || "(default)",
    };
  } catch {
    return { host: "(unparseable)", database: "(unparseable)" };
  }
}
