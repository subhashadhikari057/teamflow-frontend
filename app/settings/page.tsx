'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import SettingsOverlay from '@/components/app/SettingsOverlay';
import { AppearanceContext } from '@/lib/appearance-context';
import type { Density, FontSize } from '@/lib/appearance-context';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const tab  = searchParams.get('tab')  ?? 'Profile';

  const [density,  setDensityRaw]  = useState<Density>('comfortable');
  const [fontSize, setFontSizeRaw] = useState<FontSize>('default');

  useEffect(() => {
    const d = localStorage.getItem('tf-density')  as Density  | null;
    const f = localStorage.getItem('tf-fontsize') as FontSize | null;
    if (d) setDensityRaw(d);
    if (f) setFontSizeRaw(f);
  }, []);

  const setDensity  = (d: Density)  => { setDensityRaw(d);  localStorage.setItem('tf-density',  d); };
  const setFontSize = (f: FontSize) => { setFontSizeRaw(f); localStorage.setItem('tf-fontsize', f); };

  return (
    <AppearanceContext.Provider value={{ density, fontSize, setDensity, setFontSize }}>
      <SettingsOverlay
        onClose={() => router.push(from ? `/${from}` : '/workspace')}
        initialTab={tab}
        onTabChange={(t) => router.replace(from ? `/settings?from=${from}&tab=${t}` : `/settings?tab=${t}`)}
      />
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
