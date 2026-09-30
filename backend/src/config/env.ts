import { config } from "dotenv";
import { CookieOptions } from "express";
import { z } from "zod";
import { resolveDatabaseUrl } from "./databaseUrl";

config();


const envSchema = z.object({
  NODE_ENV: z.enum([
    "development",
    "production",
    "test",
  ]),

  LOG_LEVEL: z.enum([
    "info",
    "warn",
    "fatal",
  ]),

  PORT: z.coerce.number().int().positive(),

  DATABASE_URL: z.url().optional(),

  DATABASE_URL_PROD: z.url().optional(),

  JWT_SECRET: z.string().min(32),

  JWT_EXPIRES_IN: z.string().min(2),

  REFRESH_TOKEN_SECRET: z.string().min(32),

  REFRESH_TOKEN_EXPIRES_IN: z.string().min(2),

  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "CLOUDINARY_CLOUD_NAME is required"),

  CLOUDINARY_API_KEY: z
    .string()
    .regex(/^\d+$/, "CLOUDINARY_API_KEY must contain only digits"),

  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "CLOUDINARY_API_SECRET is required"),

  GOOGLE_CLIENT_ID: z.string().min(1),

  GOOGLE_CLIENT_SECRET: z.string().min(1),

  GOOGLE_REDIRECT_URI: z.url(),

  GITHUB_CLIENT_ID: z.string().min(1),

  GITHUB_CLIENT_SECRET: z.string().min(1),

  GITHUB_REDIRECT_URI: z.url(),

  CLIENT_URL: z.url().transform(v=>v.replace(/\/+$/,"")),

  COOKIE_SECRET: z.string().min(32),

  REDIS_URL: z.url(),
  REALTIME_RELAY_ENABLED: z.enum(["true", "false"]),
  VITE_API_BASE_URL: z.url()

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Environment validation failed:",
    parsed.error.flatten().fieldErrors
  );

  process.exit(1);
}

const resolvedDatabase = (() => {
  try {
    return resolveDatabaseUrl();
  } catch (err) {
    console.error("Environment validation failed:", {
      DATABASE_URL: [(err as Error).message],
    });

    process.exit(1);
  }
})();

if (!z.url().safeParse(resolvedDatabase.url).success) {
  console.error("Environment validation failed:", {
    DATABASE_URL: [`resolved from ${resolvedDatabase.source} is not a valid URL`],
  });

  process.exit(1);
}

export const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production"
}

export const env = { ...parsed.data, DATABASE_URL: resolvedDatabase.url };



const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

export const accessCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: Number(parsed.data.JWT_EXPIRES_IN.replace(/[a-zA-Z]/g, "")) * 60 * 1000,
};

export const refreshCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: Number(parsed.data.REFRESH_TOKEN_EXPIRES_IN.replace(/[a-zA-Z]/g, "")) * 24 * 60 * 60 * 1000,
};