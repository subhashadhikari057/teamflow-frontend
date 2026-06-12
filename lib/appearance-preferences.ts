'use client';

import { useSyncExternalStore } from 'react';
import type { Density, FontSize } from './appearance-context';

const DENSITY_KEY = 'tf-density';
const FONT_SIZE_KEY = 'tf-fontsize';

const listeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', listener);
  }

  return () => {
    listeners.delete(listener);

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', listener);
    }
  };
}

function readDensitySnapshot(): Density {
  if (!canUseStorage()) {
    return 'comfortable';
  }

  const value = window.localStorage.getItem(DENSITY_KEY);
  return value === 'comfortable' || value === 'compact' || value === 'cozy'
    ? value
    : 'comfortable';
}

function readFontSizeSnapshot(): FontSize {
  if (!canUseStorage()) {
    return 'default';
  }

  const value = window.localStorage.getItem(FONT_SIZE_KEY);
  return value === 'small' || value === 'default' || value === 'large'
    ? value
    : 'default';
}

export function useDensityPreference() {
  return useSyncExternalStore(subscribe, readDensitySnapshot, () => 'comfortable');
}

export function useFontSizePreference() {
  return useSyncExternalStore(subscribe, readFontSizeSnapshot, () => 'default');
}

export function setDensityPreference(density: Density) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(DENSITY_KEY, density);
  notifyListeners();
}

export function setFontSizePreference(fontSize: FontSize) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(FONT_SIZE_KEY, fontSize);
  notifyListeners();
}
