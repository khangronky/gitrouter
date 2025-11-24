import { useMutation } from '@tanstack/react-query';
import { fetcher } from './api';

// ===== Register Mutation =====
interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterResponse {
  status: number;
  message?: string;
}

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: async (payload: RegisterPayload): Promise<RegisterResponse> => {
      return fetcher<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  });
};

