import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.email('Invalid email address'),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export interface RegisterResponseType {
  status: number;
  message?: string;
}

export type RegisterSchema = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export interface LoginResponseType {
  status: number;
  message?: string;
}

export type LoginSchema = z.infer<typeof loginSchema>;
