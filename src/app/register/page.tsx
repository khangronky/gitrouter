"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/lib/api/auth";

// Zod Schema
import { registerSchema, type RegisterSchema } from "@/lib/schema/auth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";



export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const registerMutation = useRegister();

  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterSchema) => {
    registerMutation.mutate(
      {
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      },
      {
        onSuccess: () => {
          toast.success("Registration successful!");
          router.push("/");
        },
        onError: (error: any) => {
          console.error("Registration error:", error);
          const errorMessage = error?.info?.error || "Registration failed";
          toast.error(errorMessage);
        },
      }
    );
  };

  return (
    <section className='flex h-screen flex-col justify-center px-16'>
      <div className='flex flex-col gap-4'>
        <div className='space-y-1'>
          <h1 className='font-bold text-5xl'>Welcome to GitRouter</h1>
          <p className='text-base text-gray-500'>
            Create an account to continue to GitRouter
          </p>
        </div>
        <div className='w-full max-w-md space-y-4'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Fill in your email'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className='flex flex-col gap-2'>
                        <div className='relative'>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder='Fill in your password'
                            {...field}
                          />
                          <button
                            type='button'
                            onClick={() => setShowPassword(!showPassword)}
                            className='-translate-y-1/2 absolute top-1/2 right-3 text-gray-500 hover:text-gray-700'
                          >
                            {showPassword ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                        <p className='text-xs text-gray-500'>
                          <ul>
                            <li>At least 12 characters</li>
                            <li>Contains at least one uppercase letter</li>
                            <li>Contains at least one lowercase letter</li>
                            <li>Contains at least one number</li>
                            <li>Contains at least one special character</li>
                          </ul>
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder='Confirm your password'
                          {...field}
                        />
                        <button
                          type='button'
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className='-translate-y-1/2 absolute top-1/2 right-3 text-gray-500 hover:text-gray-700'
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
              <div className='flex flex-col gap-2'>
                <Button
                  type='submit'
                  className='w-full'
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Registering..." : "Register"}
                </Button>
                <p className='text-right text-gray-500 text-sm'>
                  Already have an account?{" "}
                  <Link href='/login' className='text-primary-500 underline'>
                    Login
                  </Link>
                </p>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
