import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.email("Invalid email address"),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const verifyOtpSchema = z.object({
  email: z.email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export interface RegisterResponseType {
  status: number;
  message?: string;
}

export interface VerifyOtpResponseType {
  status: number;
  message?: string;
}

export type RegisterSchema = z.infer<typeof registerSchema>;
export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
