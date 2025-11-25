import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.email("Invalid email address"),
    password: z  
      .string()  
      .min(12, "Password must be at least 12 characters long")  
      .regex(  
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).+$/,  
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"  
      ),  
    confirmPassword: z.string().min(12, "Password must be at least 12 characters long").regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).+$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
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
