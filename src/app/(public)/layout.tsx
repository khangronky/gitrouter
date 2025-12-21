import { NavBar } from '@/components/landing/nav-bar';
import { Footer } from '@/components/landing/footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-landing-bg text-white">
      <NavBar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

