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
import { fetcher } from '@/lib/api';

// Zod Schema
import {
  type RegisterResponseType,
  type RegisterSchema,
  registerSchema,
  type VerifyOtpResponseType,
  type VerifyOtpSchema,
  verifyOtpSchema,
} from '@/lib/schema/auth';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [userEmail, _setUserEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  const registerForm = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const otpForm = useForm<VerifyOtpSchema>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const onSubmit = async (values: RegisterSchema) => {
    setIsPending(true);
    try {
      await fetcher<RegisterResponseType>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      // toast.success('OTP sent successfully! Check your email.');
      // setUserEmail(values.email);
      // setOtpSent(true);
      // setCooldown(60);
      // otpForm.setValue('email', values.email);

      // Temporarily bypass OTP verification
      toast.success('Registration successful!');
      router.push('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.info?.error || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;

    setIsPending(true);
    try {
      const values = registerForm.getValues();
      await fetcher<RegisterResponseType>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('OTP resent successfully!');
      setCooldown(60);
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      const errorMessage = error?.info?.error || 'Failed to resend OTP';
      toast.error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  const onVerifyOtp = async (values: VerifyOtpSchema) => {
    setIsVerifying(true);
    try {
      await fetcher<VerifyOtpResponseType>('/auth/verify', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Registration successful! Redirecting to login...');
      router.push('/login');
    } catch (error: any) {
      console.error('Verification error:', error);
      const errorMessage = error?.info?.error || 'Invalid OTP';
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="flex h-screen flex-col justify-center px-16">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="font-bold text-5xl">Welcome to GitRouter</h1>
          <p className="text-base text-gray-500">
            {otpSent
              ? 'Verify your email to complete registration'
              : 'Create an account to continue to GitRouter'}
          </p>
        </div>
        <div className="w-full max-w-md space-y-4">
          {!otpSent ? (
            <Form key="register-form" {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Fill in your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Fill in your password"
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
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
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
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? 'Registering...' : 'Register'}
                  </Button>
                  <p className="text-right text-gray-500 text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary-500">
                      Login
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          ) : (
            <Form key="otp-form" {...otpForm}>
              <form
                onSubmit={otpForm.handleSubmit(onVerifyOtp)}
                className="space-y-4"
              >
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-blue-800 text-sm">
                    We&apos;ve sent a 6-digit OTP to{' '}
                    <span className="font-semibold">{userEmail}</span>
                  </p>
                </div>
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter OTP</FormLabel>
                      <FormControl>
                        <InputOTP
                          maxLength={6}
                          disabled={isVerifying}
                          {...field}
                        >
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
                    className="w-full"
                    disabled={isVerifying}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendOtp}
                      disabled={cooldown > 0 || isPending}
                      className="text-primary-500"
                    >
                      {cooldown > 0
                        ? `Resend OTP (${cooldown}s)`
                        : 'Resend OTP'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setOtpSent(false);
                        otpForm.reset();
                        setCooldown(0);
                      }}
                      className="text-gray-500"
                    >
                      Change Email
                    </Button>
                  </div>
                  <p className="text-right text-gray-500 text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary-500">
                      Login
                    </Link>
                  </p>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </section>
  );
}
