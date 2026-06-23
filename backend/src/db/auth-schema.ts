// schemas/user.schema.ts

import { password } from "bun";
import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(6, "Username must be atleast 6").max(20, "Max-Length is 20")
  ,
  name: z
    .string()
    .min(3, "Name must be atleast 3 characters").max(50, "Max-Length is 50"),

  email: z.email()
  ,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password cannot exceed 64 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain a special character"),

  avatar: z.url().nullable().optional(),

  timezone: z.string().optional()

});

export const loginSchema = z.object({

  username: z.string().min(6, "Username must be atleast 6").max(20, "Max-Length is 20").optional(),
  email : z.email().optional(),

  password: z.string().min(8)

}).refine(
    (data) => data.email || data.username,
    {
      message: "Either email or username is required",
      path: ["email"],
    }
  );


  export type registerUserInput = z.infer<typeof registerSchema>;
  export type loginUserInput = z.infer<typeof loginSchema>;