'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { loginMutation } from '@/lib/api/auth';
import { type LoginSchema, loginSchema } from '@/lib/schema/auth';

export default function LoginForm({ returnUrl }: { returnUrl: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { mutate, isPending } = loginMutation();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    mutate(
      {
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: async () => {
          toast.success('Login successful!');
          router.push(returnUrl);
        },
        onError: (error: any) => {
          console.error('Login error:', error);
          const errorMessage = error?.info?.error || 'Login failed';
          toast.error(errorMessage);
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Fill out your email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Fill out your password"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="-translate-y-1/2 absolute top-1/2 right-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-primary-500 text-sm underline"
          >
            Forgot Password?
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            className="bg-primary-500 hover:bg-primary-500/90"
            disabled={isPending}
          >
            {isPending ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-right text-gray-500 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-500 underline">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-gray-500 text-xs">
          By logging in, you agree to our{' '}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>
          , and acknowledge our{' '}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/cookies" className="underline">
            Cookie Policy
          </Link>
          .
        </p>
      </form>
    </Form>
  );
}
