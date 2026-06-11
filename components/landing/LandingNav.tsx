'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/primitives/Logo';
import { useMe } from '@/hooks/auth/useMe';
import { getWorkspacePath } from '@/lib/workspace-routing';

const NAV_LINKS = [
  { label: 'Features',  href: '/#features' },
  { label: 'Pricing',   href: '/#pricing' },
  { label: 'Blog',      href: '/blog' },
  { label: 'Changelog', href: '/changelog' },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: user, isLoading: isAuthLoading } = useMe();
  const isLoggedIn = Boolean(user);
  const workspaceHref = getWorkspacePath(user?.currentWorkspace?.slug);

  useEffect(() => {
    setMounted(true);
  }, []);

  function renderDesktopActions() {
    if (isLoggedIn) {
      return (
        <Link
          href={workspaceHref}
          className="bg-white text-black px-4 py-2 rounded-full text-[13.5px] font-medium hover:bg-[#e8e8e8] transition duration-300"
          style={{ boxShadow: '0 0 28px 6px rgba(255,255,255,0.45)' }}
        >
          Go to workspace
        </Link>
      );
    }

    if (mounted && isAuthLoading) {
      return (
        <div className="h-[38px] w-[232px] rounded-full border border-line bg-elevated/40" aria-hidden="true" />
      );
    }

    return (
      <>
        <Link
          href="/login"
          className="border border-line hover:bg-elevated px-4 py-2 rounded-full text-[13.5px] font-medium transition text-sub hover:text-ink"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="bg-white text-black px-4 py-2 rounded-full text-[13.5px] font-medium hover:bg-[#e8e8e8] transition duration-300"
          style={{ boxShadow: '0 0 28px 6px rgba(255,255,255,0.45)' }}
        >
          Get Started
        </Link>
      </>
    );
  }

  function renderMobileActions() {
    if (isLoggedIn) {
      return (
        <Link
          href={workspaceHref}
          onClick={() => setOpen(false)}
          className="w-full text-center bg-white text-black px-4 py-2.5 rounded-full text-[14px] font-medium hover:bg-[#e8e8e8] transition"
          style={{ boxShadow: '0 0 22px 5px rgba(255,255,255,0.4)' }}
        >
          Go to workspace
        </Link>
      );
    }

    if (mounted && isAuthLoading) {
      return <div className="h-[42px] w-full rounded-full border border-line bg-elevated/40" aria-hidden="true" />;
    }

    return (
      <>
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="w-full text-center border border-line hover:bg-elevated px-4 py-2.5 rounded-full text-[14px] font-medium transition text-sub hover:text-ink"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          onClick={() => setOpen(false)}
          className="w-full text-center bg-white text-black px-4 py-2.5 rounded-full text-[14px] font-medium hover:bg-[#e8e8e8] transition"
          style={{ boxShadow: '0 0 22px 5px rgba(255,255,255,0.4)' }}
        >
          Get Started
        </Link>
      </>
    );
  }

  return (
    <div className="sticky top-0 z-50 px-4 pt-3 flex justify-center">
      <nav
        className="relative flex items-center border border-line justify-between px-6 py-3.5 rounded-full text-sm max-w-[860px] w-full"
        style={{ background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(14px)' }}
      >
        {/* Logo */}
        <Link href="/" aria-label="Teamflow home">
          <Logo />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="relative overflow-hidden h-[22px] group text-sub hover:text-ink transition-colors"
            >
              <span className="block group-hover:-translate-y-full transition-transform duration-300 leading-[22px]">
                {label}
              </span>
              <span className="block absolute top-full left-0 group-hover:-translate-y-full transition-transform duration-300 leading-[22px]">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {renderDesktopActions()}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-sub hover:text-ink transition"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            {open
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <path d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>

        {/* Mobile dropdown */}
        {open && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-2xl border border-line flex flex-col items-center gap-4 py-6 md:hidden anim-scale"
            style={{ background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(14px)' }}
          >
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="text-[15px] text-sub hover:text-ink transition"
              >
                {label}
              </Link>
            ))}
            <div className="flex flex-col items-center gap-3 pt-2 w-full px-6">
              {renderMobileActions()}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
