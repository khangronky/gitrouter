import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from '@/lib/api';

// =============================================
// Query Keys
// =============================================

export const onboardingKeys = {
  all: ['onboarding'] as const,
  status: () => [...onboardingKeys.all, 'status'] as const,
};

// =============================================
// Types
// =============================================

interface CompleteOnboardingResponse {
  success: boolean;
  user: {
    id: string;
    onboarding_completed: boolean;
    onboarding_completed_at: string;
  };
}

// =============================================
// Mutations
// =============================================

/**
 * Complete onboarding for current user
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetcher<CompleteOnboardingResponse>('/auth/onboarding/complete', {
        method: 'POST',
      }),
    onSuccess: () => {
      // Invalidate user query to refresh onboarding status
      queryClient.invalidateQueries({
        queryKey: ['currentUser'],
      });
    },
  });
}
