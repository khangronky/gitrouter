"use client";

import { Form, FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export default function RegisterPage() {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
   <section className="flex flex-col px-16 justify-center h-screen">
    <div className="flex flex-col gap-4">
      <div className=" space-y-1">
        <h1 className="text-5xl font-bold ">Welcome to GitRouter</h1>
        <p className="text-base text-gray-500">Create an account to continue to GitRouter</p>
      </div>
      <div className="w-full space-y-4 max-w-md">
        <Form {...form}>
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="Fill in your email"/>
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Fill in your password"/>
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="Confirm your password"/>
            </FormControl>
            <FormMessage />
          </FormItem>
          <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full">Register</Button>
            <p className="text-sm text-right text-gray-500">Already have an account? <Link href="/login" className="text-primary-500">Login</Link></p>
          </div>
        </Form>
      </div>
      </div>
  </section>
  );
}