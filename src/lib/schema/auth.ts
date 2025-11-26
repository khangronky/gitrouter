import { z } from 'zod';

/**
 * Register Schema
 */
export const registerSchema = z
  .object({
    email: z.email({ message: 'Invalid email address' }),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters long')
      .refine(
        (val) =>
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]).+$/.test(
            val
          ),
        {
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }
      ),
    confirmPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters long')
      .refine(
        (val) =>
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?]).+$/.test(
            val
          ),
        {
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        }
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Verify OTP Schema
 */
export const verifyOtpSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Infer Types
 */
export type RegisterSchema = z.infer<typeof registerSchema>;
export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * Response Types
 */
export interface RegisterResponseType {
  status: number;
  message?: string;
}

export interface VerifyOtpResponseType {
  status: number;
  message?: string;
}

export interface LoginResponseType {
  status: number;
  message?: string;
}
