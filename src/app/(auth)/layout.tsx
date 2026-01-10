import AuthBackground from '@/components/auth/auth-background';
import AuthNavbar from '@/components/auth/auth-navbar';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-screen">
      <div className="relative w-full p-8 pt-20 lg:w-1/2">
        <AuthNavbar />
        {children}
      </div>
      <div className="hidden lg:block lg:w-1/2">
        <AuthBackground />
      </div>
    </div>
  );
}
