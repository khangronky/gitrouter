import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';
import type {
  LoginResponseType,
  LoginSchema,
  RegisterResponseType,
  RegisterSchema,
  CurrentUserType,
  UpdateUserSchema,
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
