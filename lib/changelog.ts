export interface ChangelogEntry {
  version: string;
  date: string;
  tag: 'major' | 'minor' | 'patch';
  summary: string;
  changes: {
    type: 'new' | 'improved' | 'fixed' | 'infra';
    items: string[];
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2.4.0',
    date: 'April 15, 2026',
    tag: 'minor',
    summary: 'Thread panel rebuild, message virtualization, and live presence indicators.',
    changes: [
      {
        type: 'new',
        items: [
          'Thread Panel fully rebuilt — independent render tree, spring animation, keyboard accessible',
          'Message list virtualization — only visible rows render, massive scroll perf improvement in large channels',
          'Live presence indicators on sidebar avatars (online / away / offline, 30s poll)',
          'Slash command hint shown in Composer placeholder',
        ],
      },
      {
        type: 'improved',
        items: [
          'Search typeahead latency: 847ms p95 → 43ms p95',
          'Reaction picker open time reduced by ~40%',
          'Reaction picker now closes on outside click',
          'Channel header member count is now live',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Thread reply count badge was using full white instead of --text-secondary token',
          'Message timestamps were off by 1 hour for IST users',
          'Sidebar scroll position was lost on channel switch',
          '11 additional minor bug fixes',
        ],
      },
      {
        type: 'infra',
        items: [
          'Postgres credentials rotated — zero downtime migration',
          'Staging deploy pipeline now runs health checks before promoting to prod',
          'Search service migrated to Typesense, decoupled from primary DB write path',
        ],
      },
    ],
  },
  {
    version: '2.3.2',
    date: 'March 28, 2026',
    tag: 'patch',
    summary: 'Hotfix for DM notification badge and emoji picker crash on Firefox.',
    changes: [
      {
        type: 'fixed',
        items: [
          'DM unread badge was not clearing after reading messages',
          'Emoji picker crashed on Firefox 124 due to a missing Intl.Segmenter polyfill',
          'Avatar initials were truncated to 1 char for 3-word names',
        ],
      },
    ],
  },
  {
    version: '2.3.0',
    date: 'March 10, 2026',
    tag: 'minor',
    summary: 'Voice & video calls are now built-in. No third-party integration needed.',
    changes: [
      {
        type: 'new',
        items: [
          'Built-in voice & video calls — start a call from any channel or DM',
          'Screen sharing with annotation support',
          'Call history in the sidebar (last 10 calls)',
          'Mute / camera toggle with keyboard shortcuts (M, V)',
        ],
      },
      {
        type: 'improved',
        items: [
          'File previews now support .fig, .sketch, and .xd files (thumbnail only)',
          'Code blocks in messages now have a one-click copy button',
          'Composer toolbar is now hidden by default and expands on focus',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Long channel names were overflowing the sidebar',
          'Markdown bold inside inline code was being incorrectly parsed',
        ],
      },
    ],
  },
  {
    version: '2.2.0',
    date: 'February 18, 2026',
    tag: 'minor',
    summary: 'Cmd+K search revamp with people, files, and channel results.',
    changes: [
      {
        type: 'new',
        items: [
          'Cmd+K search now returns People, Files, and Channels in addition to Messages',
          'Search supports from: and in: filters (e.g. "from:priya thread panel")',
          'Recent searches are saved per-session',
          'Search result keyboard navigation (↑ ↓ Enter)',
        ],
      },
      {
        type: 'improved',
        items: [
          'Cmd+K opens in < 50ms (was ~200ms)',
          'Search input is focused automatically when modal opens',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Search modal was not closing on Escape when input was focused',
          'File results were not showing file type icon',
        ],
      },
    ],
  },
  {
    version: '2.1.0',
    date: 'January 30, 2026',
    tag: 'minor',
    summary: 'Settings panel, workspace management, and member roles.',
    changes: [
      {
        type: 'new',
        items: [
          'Settings panel with Profile, Notifications, Appearance, and Members tabs',
          'Member roles: Owner, Admin, Member',
          'Admins can invite and remove members',
          'Notification preferences per-channel (all, mentions, none)',
          'Dark / light / system theme toggle (dark is default)',
        ],
      },
      {
        type: 'improved',
        items: [
          'Sidebar channel list is now collapsible',
          'DM list shows presence dots',
        ],
      },
    ],
  },
  {
    version: '2.0.0',
    date: 'January 6, 2026',
    tag: 'major',
    summary: 'Complete rewrite. New design system, App Router migration, and 10× faster cold start.',
    changes: [
      {
        type: 'new',
        items: [
          'New design system — dark-first, token-based, accessible',
          'App Router migration (Next.js 16)',
          'Real-time presence via WebSocket',
          'Markdown rendering in messages (bold, italic, inline code, fenced blocks)',
          'Reaction system with emoji picker',
          'Thread replies with reply count badge and avatar stack',
        ],
      },
      {
        type: 'improved',
        items: [
          'Cold start time: 4.2s → 0.4s',
          'Bundle size reduced by 62%',
          'Accessibility audit pass — WCAG AA on all screens',
        ],
      },
      {
        type: 'infra',
        items: [
          'Moved from Vercel to self-hosted on Fly.io',
          'Postgres → Neon (serverless Postgres)',
          'Redis for presence and pub/sub',
        ],
      },
    ],
  },
];
