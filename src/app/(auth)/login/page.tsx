import { Suspense } from 'react';
import LoginForm from './form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const { returnUrl = '/dashboard' } = await searchParams;

  return (
    <section className="flex h-screen flex-col justify-center px-32">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="font-bold text-5xl">Welcome to GitRouter</h1>
          <p className="text-base text-gray-500">
            Login to your account to continue to GitRouter
          </p>
        </div>

        <div className="w-full max-w-md space-y-4">
          <Suspense>
            <LoginForm returnUrl={returnUrl} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
