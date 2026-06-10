import LandingNav from '@/components/landing/LandingNav';

interface AuthShellProps {
  children: React.ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg overflow-y-auto">
      <LandingNav />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] anim-scale">
          {children}
        </div>
      </div>
    </div>
  );
}
