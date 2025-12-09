'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  forgotPasswordMutation,
  resetPasswordMutation,
  verifyRecoveryOtpMutation,
} from '@/lib/api/auth';
import {
  type ForgotPasswordSchema,
  forgotPasswordSchema,
  type ResetPasswordSchema,
  resetPasswordSchema,
  type VerifyRecoveryOtpSchema,
  verifyRecoveryOtpSchema,
} from '@/lib/schema/auth';

type Stage = 'email' | 'otp' | 'password';

export default function ForgotPasswordForm() {
  const [stage, setStage] = useState<Stage>('email');
  const [userEmail, setUserEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const { mutate: sendOtp, isPending: isSendingOtp } = forgotPasswordMutation();
  const { mutate: verifyOtp, isPending: isVerifying } =
    verifyRecoveryOtpMutation();
  const { mutate: updatePassword, isPending: isUpdating } =
    resetPasswordMutation();

  const emailForm = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const otpForm = useForm<VerifyRecoveryOtpSchema>({
    resolver: zodResolver(verifyRecoveryOtpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  const passwordForm = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Stage 1: Submit email
  const onSubmitEmail = async (values: ForgotPasswordSchema) => {
    sendOtp(values, {
      onSuccess: () => {
        toast.success('Recovery code sent! Check your email.');
        setUserEmail(values.email);
        setStage('otp');
        setCooldown(60);
        otpForm.setValue('email', values.email);
      },
      onError: (error: any) => {
        console.error('Send OTP error:', error);
        const errorMessage =
          error?.info?.error || 'Failed to send recovery code';
        toast.error(errorMessage);
      },
    });
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    sendOtp(
      { email: userEmail },
      {
        onSuccess: () => {
          toast.success('Recovery code resent!');
          setCooldown(60);
        },
        onError: (error: any) => {
          console.error('Resend OTP error:', error);
          const errorMessage = error?.info?.error || 'Failed to resend code';
          toast.error(errorMessage);
        },
      }
    );
  };

  // Stage 2: Verify OTP
  const onVerifyOtp = async (values: VerifyRecoveryOtpSchema) => {
    verifyOtp(values, {
      onSuccess: () => {
        toast.success('Code verified! Set your new password.');
        setStage('password');
      },
      onError: (error: any) => {
        console.error('Verify OTP error:', error);
        const errorMessage = error?.info?.error || 'Invalid code';
        toast.error(errorMessage);
      },
    });
  };

  // Stage 3: Reset password
  const onResetPassword = async (values: ResetPasswordSchema) => {
    updatePassword(values, {
      onSuccess: () => {
        toast.success('Password updated successfully!');
        router.push('/login');
      },
      onError: (error: any) => {
        console.error('Reset password error:', error);
        const errorMessage =
          error?.info?.error || 'Failed to update password';
        toast.error(errorMessage);
      },
    });
  };

  return (
    <>
      {/* Stage 1: Email Form */}
      {stage === 'email' && (
        <Form key="email-form" {...emailForm}>
          <form
            onSubmit={emailForm.handleSubmit(onSubmitEmail)}
            className="space-y-4"
          >
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-500/90"
                disabled={isSendingOtp}
              >
                {isSendingOtp ? 'Sending...' : 'Send Recovery Code'}
              </Button>
              <p className="text-right text-gray-500 text-sm">
                Remember your password?{' '}
                <Link href="/login" className="text-primary-500 underline">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </Form>
      )}

      {/* Stage 2: OTP Verification */}
      {stage === 'otp' && (
        <Form key="otp-form" {...otpForm}>
          <form
            onSubmit={otpForm.handleSubmit(onVerifyOtp)}
            className="space-y-4"
          >
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-blue-800 text-sm">
                We&apos;ve sent a 6-digit code to{' '}
                <span className="font-semibold">{userEmail}</span>
              </p>
            </div>
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter Code</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} disabled={isVerifying} {...field}>
                      <InputOTPGroup className="w-full gap-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot
                            key={`otp-slot-${index + 1}`}
                            index={index}
                            className="h-12 w-full rounded-lg font-bold"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-500/90"
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </Button>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isSendingOtp}
                  className="text-primary-500"
                >
                  {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStage('email');
                    otpForm.reset();
                    setCooldown(0);
                  }}
                  className="text-gray-500"
                >
                  Change Email
                </Button>
              </div>
            </div>
          </form>
        </Form>
      )}

      {/* Stage 3: New Password Form */}
      {stage === 'password' && (
        <Form key="password-form" {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit(onResetPassword)}
            className="space-y-4"
          >
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-green-800 text-sm">
                Code verified! Create your new password.
              </p>
            </div>
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="-translate-y-1/2 absolute top-1/2 right-3 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="-translate-y-1/2 absolute top-1/2 right-3 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full bg-primary-500 hover:bg-primary-500/90"
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </>
  );
}
