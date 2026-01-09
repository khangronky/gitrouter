import AuthBackground from '@/components/auth/auth-background';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <div className="w-full p-8 lg:w-1/2">{children}</div>
      <div className="hidden lg:block lg:w-1/2">
        <AuthBackground />
      </div>
    </div>
  );
}
