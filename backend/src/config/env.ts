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

  CLOUDINARY_CLOUD_NAME: z
    .string()
    .min(1, "CLOUDINARY_CLOUD_NAME is required"),

  CLOUDINARY_API_KEY: z
    .string()
    .regex(/^\d+$/, "CLOUDINARY_API_KEY must contain only digits"),

  CLOUDINARY_API_SECRET: z
    .string()
    .min(1, "CLOUDINARY_API_SECRET is required"),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Environment validation failed:",
    parsed.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const clearCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production"
}

export const env = parsed.data;



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