import { useMutation } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  LoginResponseType,
  LoginSchema,
  RegisterResponseType,
  RegisterSchema,
} from '@/lib/schema/auth';

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
