'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { OnboardingProgress } from './onboarding-progress';
import { WelcomeStep } from './steps/welcome-step';
import { GitHubStep } from './steps/github-step';
import { SlackStep } from './steps/slack-step';
import { JiraStep } from './steps/jira-step';
import { FirstRuleStep } from './steps/first-rule-step';
import { TeamStep } from './steps/team-step';
import { CompletionStep } from './steps/completion-step';
import { useUserStore } from '@/stores/user-store';
import { useCompleteOnboarding } from '@/lib/api/onboarding';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

const TOTAL_STEPS = 7;

export type OnboardingStep =
  | 'welcome'
  | 'github'
  | 'slack'
  | 'jira'
  | 'first-rule'
  | 'team'
  | 'completion';

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'github',
  'slack',
  'jira',
  'first-rule',
  'team',
  'completion',
];

export function OnboardingDialog() {
  const { user, isLoading } = useUserStore();
  const { currentOrgId } = useCurrentOrganization();
  const searchParams = useSearchParams();
  const completeOnboarding = useCompleteOnboarding();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  // Check if we should show the onboarding dialog
  useEffect(() => {
    if (isLoading) return;

    // Check for onboarding_step query param (returning from OAuth)
    const onboardingStep = searchParams.get('onboarding_step');
    if (
      onboardingStep &&
      STEP_ORDER.includes(onboardingStep as OnboardingStep)
    ) {
      setCurrentStep(onboardingStep as OnboardingStep);
      setIsOpen(true);
      return;
    }

    // Show dialog if user hasn't completed onboarding
    if (user && !user.onboarding_completed) {
      setIsOpen(true);
    }
  }, [user, isLoading, searchParams]);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[nextIndex]);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEP_ORDER[prevIndex]);
    }
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding.mutateAsync();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still close the dialog even if the API call fails
      setIsOpen(false);
    }
  };

  const handleSkipAll = async () => {
    try {
      await completeOnboarding.mutateAsync();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      setIsOpen(false);
    }
  };

  // Don't render if loading or no user
  if (isLoading || !user || !currentOrgId) {
    return null;
  }

  const stepProps = {
    onNext: goToNextStep,
    onBack: goToPreviousStep,
    onSkipAll: handleSkipAll,
    orgId: currentOrgId,
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[600px] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="p-6 pb-0">
          <OnboardingProgress
            currentStep={currentStepIndex}
            totalSteps={TOTAL_STEPS}
            className="mb-6"
          />
        </div>

        <div className="p-6 pt-2">
          {currentStep === 'welcome' && <WelcomeStep {...stepProps} />}
          {currentStep === 'github' && <GitHubStep {...stepProps} />}
          {currentStep === 'slack' && <SlackStep {...stepProps} />}
          {currentStep === 'jira' && <JiraStep {...stepProps} />}
          {currentStep === 'first-rule' && <FirstRuleStep {...stepProps} />}
          {currentStep === 'team' && <TeamStep {...stepProps} />}
          {currentStep === 'completion' && (
            <CompletionStep
              onComplete={handleComplete}
              onBack={goToPreviousStep}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
