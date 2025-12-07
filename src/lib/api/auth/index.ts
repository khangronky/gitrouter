import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  CurrentUserType,
  LoginResponseType,
  LoginSchema,
  RegisterResponseType,
  RegisterSchema,
  ResendOtpResponseType,
  ResendOtpSchema,
  UpdateUserSchema,
  VerifyOtpResponseType,
  VerifyOtpSchema,
} from '@/lib/schema/auth';

/**
 * Query Keys
 */
export const authKeys = {
  me: ['auth', 'me'] as const,
};

/**
 * Get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => fetcher<{ user: CurrentUserType }>('/auth/me'),
  });
}

/**
 * Update current user
 */
export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserSchema) =>
      fetcher<{ user: CurrentUserType }>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
    },
  });
}

/**
 * Login Mutation
 */
export const loginMutation = () => {
  return useMutation({
    mutationFn: async (payload: LoginSchema): Promise<LoginResponseType> => {
      return fetcher<LoginResponseType>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  });
};

/**
 * Register Mutation
 */
export const registerMutation = () => {
  return useMutation({
    mutationFn: async (
      payload: RegisterSchema
    ): Promise<RegisterResponseType> => {
      return fetcher<RegisterResponseType>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  });
};

/**
 * Resend OTP Mutation
 */
export const resendOtpMutation = () => {
  return useMutation({
    mutationFn: async (
      payload: ResendOtpSchema
    ): Promise<ResendOtpResponseType> => {
      return fetcher<ResendOtpResponseType>('/auth/otp/resend', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  });
};

/**
 * Verify OTP Mutation
 */
export const verifyOtpMutation = () => {
  return useMutation({
    mutationFn: async (
      payload: VerifyOtpSchema
    ): Promise<VerifyOtpResponseType> => {
      return fetcher<VerifyOtpResponseType>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  });
};
