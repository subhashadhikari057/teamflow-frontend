'use client';

import { createContext, useContext } from 'react';

export type Density  = 'comfortable' | 'compact' | 'cozy';
export type FontSize = 'small' | 'default' | 'large';

export interface AppearanceCtx {
  density:     Density;
  fontSize:    FontSize;
  setDensity:  (d: Density)  => void;
  setFontSize: (f: FontSize) => void;
}

export const AppearanceContext = createContext<AppearanceCtx>({
  density:     'comfortable',
  fontSize:    'default',
  setDensity:  () => {},
  setFontSize: () => {},
});

export const useAppearance = () => useContext(AppearanceContext);
