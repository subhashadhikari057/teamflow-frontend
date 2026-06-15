import type { UserStatus } from '@/lib/api/types';

export const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: 'ONLINE',         label: 'Online',         color: '#22c55e' },
  { value: 'AWAY',           label: 'Away',           color: '#eab308' },
  { value: 'BUSY',           label: 'Busy',           color: '#ef4444' },
  { value: 'DO_NOT_DISTURB', label: 'Do Not Disturb', color: '#ef4444' },
  { value: 'FOCUSING',       label: 'Focusing',       color: '#a855f7' },
  { value: 'IN_A_MEETING',   label: 'In a Meeting',   color: '#3b82f6' },
  { value: 'ON_VACATION',    label: 'On Vacation',    color: '#14b8a6' },
  { value: 'OUT_OF_OFFICE',  label: 'Out of Office',  color: '#f97316' },
  { value: 'OFFLINE',        label: 'Offline',        color: '#6b7280' },
];

export const STATUS_COLOR = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.color]),
) as Record<UserStatus, string>;

export const STATUS_LABEL = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<UserStatus, string>;
