import { config } from "dotenv";
import { CookieOptions } from "express";
import { z } from "zod";

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

  DATABASE_URL: z.url(),

  JWT_SECRET: z.string().min(32),

  JWT_EXPIRES_IN: z.string().min(2),

  REFRESH_TOKEN_SECRET: z.string().min(32),

  REFRESH_TOKEN_EXPIRES_IN: z.string().min(2),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Environment validation failed:",
    parsed.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const setCookieOptions : CookieOptions = {
    httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
}

export const clearCookieOptions : CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
}

export const env = parsed.data;



