import { useMutation } from '@tanstack/react-query';
import { fetcher } from './api';
import { type RegisterSchema, type RegisterResponseType } from '../schema/auth';

// ===== Register Mutation =====
export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: async (payload: RegisterSchema): Promise<RegisterResponseType> => {
      return fetcher<RegisterResponseType>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  });
};

