import { z } from 'zod';

/**
 * Register Schema
 */
export const registerSchema = z
  .object({
    email: z.email({ message: 'Invalid email address' }),
    password: z
      .string()
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
 * Resend OTP Schema
 */
export const resendOtpSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
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
 * Forgot Password Schema (Stage 1: Email)
 */
export const forgotPasswordSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
});

/**
 * Verify Recovery OTP Schema (Stage 2: OTP Verification)
 */
export const verifyRecoveryOtpSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

/**
 * Reset Password Schema (Stage 3: New Password)
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
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
 * Update User Schema
 */
export const updateUserSchema = z.object({
  full_name: z.string().max(100).optional(),
  username: z.string().max(50).optional(),
  github_username: z.string().max(39).nullable().optional(),
  slack_user_id: z.string().nullable().optional(),
  slack_username: z.string().max(100).nullable().optional(),
});

/**
 * Infer Types
 */
export type RegisterSchema = z.infer<typeof registerSchema>;
export type ResendOtpSchema = z.infer<typeof resendOtpSchema>;
export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type VerifyRecoveryOtpSchema = z.infer<typeof verifyRecoveryOtpSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;

/**
 * Response Types
 */
export interface RegisterResponseType {
  status: number;
  data: any;
}

export interface ResendOtpResponseType {
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
  user: {
    id: string;
    email: string;
  };
}

export interface ForgotPasswordResponseType {
  status: number;
  message?: string;
}

export interface VerifyRecoveryOtpResponseType {
  status: number;
  message?: string;
}

export interface ResetPasswordResponseType {
  status: number;
  message?: string;
}

/**
 * Current User Type
 */
export interface CurrentUserType {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  github_user_id: number | null;
  github_username: string | null;
  slack_user_id: string | null;
  slack_username: string | null;
  created_at: string;
}

/**
 * Common Response Type
 */
export interface MessageResponseType {
  message: string;
}
