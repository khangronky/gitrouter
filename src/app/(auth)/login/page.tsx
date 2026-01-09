import LoginForm from './form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string }>;
}) {
  const { returnUrl = '/dashboard' } = await searchParams;

  return (
    <div className="flex h-full flex-col items-center justify-center px-16">
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="font-bold text-5xl">Welcome to GitRouter</h1>
          <p className="text-base text-gray-500">
            Login to your account to continue to GitRouter
          </p>
        </div>

        <div className="max-w-md space-y-4">
          <LoginForm returnUrl={returnUrl} />
        </div>
      </div>
    </div>
  );
}
