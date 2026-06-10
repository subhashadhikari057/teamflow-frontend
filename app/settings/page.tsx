'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import SettingsOverlay from '@/components/app/SettingsOverlay';
import { AppearanceContext } from '@/lib/appearance-context';
import type { Density, FontSize } from '@/lib/appearance-context';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? 'nomor';

  const [density,  setDensityRaw]  = useState<Density>(
    () => (typeof localStorage !== 'undefined' ? (localStorage.getItem('tf-density')  as Density  | null) : null) ?? 'comfortable'
  );
  const [fontSize, setFontSizeRaw] = useState<FontSize>(
    () => (typeof localStorage !== 'undefined' ? (localStorage.getItem('tf-fontsize') as FontSize | null) : null) ?? 'default'
  );

  const setDensity  = (d: Density)  => { setDensityRaw(d);  localStorage.setItem('tf-density',  d); };
  const setFontSize = (f: FontSize) => { setFontSizeRaw(f); localStorage.setItem('tf-fontsize', f); };

  return (
    <AppearanceContext.Provider value={{ density, fontSize, setDensity, setFontSize }}>
      <SettingsOverlay onClose={() => router.push(`/${from}`)} />
    </AppearanceContext.Provider>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
