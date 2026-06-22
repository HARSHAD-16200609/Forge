import { config } from "dotenv";
import { z } from "zod";

config();


const envSchema = z.object({
  NODE_ENV: z.enum([
    "development",
    "production",
    "test",
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




export const env = parsed.data;