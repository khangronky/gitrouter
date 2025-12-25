import { NavBar } from '@/components/landing/nav-bar';
import { Footer } from '@/components/landing/footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-landing-bg text-foreground">
      <NavBar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
