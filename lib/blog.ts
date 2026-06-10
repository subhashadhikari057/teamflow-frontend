export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: { name: string; initials: string; color: string; role: string };
  date: string;
  readTime: string;
  tag: string;
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'introducing-thread-panel',
    title: 'Introducing the new Thread Panel',
    excerpt: 'Threaded conversations just got a major upgrade. Here\'s everything that changed and why we rebuilt it from scratch.',
    author: { name: 'Sarah Chen', initials: 'SC', color: '#10b981', role: 'Frontend Lead' },
    date: 'June 5, 2026',
    readTime: '5 min read',
    tag: 'Product',
    body: `We've completely rebuilt the Thread Panel — the side drawer that opens when you reply to a message. The old implementation was bolted on top of the main message list and shared too much state. It caused subtle scroll bugs, janky animations, and made it hard to extend.

## What changed

The new panel is a fully independent React tree. It manages its own scroll position, its own Composer instance, and its own loading state. Opening a thread no longer causes any re-render in the main channel view.

**Performance:** We measured a 60% reduction in time-to-interactive when opening a thread in a busy channel with 500+ messages.

**Design:** The panel now slides in with a spring animation instead of a linear ease. The header is sticky, the reply count badge uses the correct \`--text-secondary\` token (yes, we fixed that nit), and the close button is keyboard-accessible.

## Keyboard shortcuts

- \`T\` while hovering a message — opens its thread
- \`Escape\` — closes the panel
- \`Tab\` — moves focus into the Composer

## What's next

We're working on nested threads (replies to replies) and cross-channel thread linking. Both are behind a flag internally and will ship in v2.5.`,
  },
  {
    slug: 'search-reindex',
    title: 'How we rebuilt search indexing at scale',
    excerpt: 'Our old search index was a bottleneck at 50k messages/day. We rewrote it — here\'s the architecture.',
    author: { name: 'Marcus Wright', initials: 'MW', color: '#f59e0b', role: 'Backend Engineer' },
    date: 'May 28, 2026',
    readTime: '8 min read',
    tag: 'Engineering',
    body: `Search is the feature users notice when it breaks and forget when it works. For most of last quarter, ours was slow in the wrong ways — typeahead results lagged by 800ms at p95, and full-text queries against large workspaces could time out entirely.

## The old architecture

Every message write triggered a synchronous call to our Postgres full-text index. At low volume this was fine. At 50k messages/day it became a write bottleneck and caused lock contention on the messages table.

\`\`\`bash
# p95 latency before reindex
curl -s https://internal.teamflow.io/metrics | jq '.search_p95_ms'
# 847
\`\`\`

## What we built

We decoupled the index from the write path entirely. Messages are written to Postgres first, then an async worker picks them up via a WAL-based change feed and pushes them to a dedicated search service backed by Typesense.

The result:

- **Write latency:** down from 180ms avg to 12ms avg
- **Search p95:** down from 847ms to 43ms
- **Index lag:** < 500ms end-to-end under normal load

## Lessons

Don't put search in your primary database unless your scale is tiny. The convenience isn't worth the coupling once you cross ~10k documents/day.`,
  },
  {
    slug: 'design-system-v2',
    title: 'Teamflow Design System v2',
    excerpt: 'We\'ve open-sourced our component library. Here\'s what\'s in it, why we built it, and how to use it.',
    author: { name: 'Priya Patel', initials: 'PP', color: '#ec4899', role: 'Design Lead' },
    date: 'May 14, 2026',
    readTime: '6 min read',
    tag: 'Design',
    body: `After 18 months of internal use, we're open-sourcing the Teamflow Design System. It's the set of tokens, components, and guidelines that powers every screen in the product.

## What's included

**Tokens** — colors, typography, spacing, radii, shadows, and motion curves, all defined as CSS custom properties so they work in any framework.

**Components** — Button, Avatar, Badge, Icon, Tooltip, Composer, MessageItem, and more. Each has a documented API and accessibility annotations.

**Patterns** — modal handling, keyboard navigation, presence indicators, and loading states.

## Why we open-sourced it

We built this for ourselves, but we've seen enough teams reinvent the same dark-mode messaging UI primitives that we figured sharing it would save everyone time.

## Getting started

\`\`\`bash
npm install @teamflow/ds
\`\`\`

Import tokens in your global CSS:

\`\`\`css
@import '@teamflow/ds/tokens.css';
\`\`\`

Then use components:

\`\`\`tsx
import { Button, Avatar } from '@teamflow/ds';
\`\`\`

Full docs are at [ds.teamflow.io](https://ds.teamflow.io).`,
  },
  {
    slug: 'async-culture',
    title: 'Building an async-first team culture',
    excerpt: 'Async doesn\'t mean slow. Here\'s how the best remote teams use Teamflow to stay aligned without living in meetings.',
    author: { name: 'Ashim Shrestha', initials: 'AS', color: '#6366f1', role: 'Product Engineer' },
    date: 'April 30, 2026',
    readTime: '4 min read',
    tag: 'Culture',
    body: `The teams that get the most out of Teamflow are the ones that treat async communication as a first-class discipline — not a fallback for when people are in different time zones.

## The core habit: write before you speak

Before scheduling a meeting, write a short channel post. Include context, what you need, and a deadline. Nine times out of ten, the meeting becomes a thread.

## Channel structure matters

Flat channel lists are hard to navigate. The teams we've interviewed with the highest async satisfaction scores all share a pattern:

- **#team-[name]** — for team-specific work, internal to that group
- **#proj-[name]** — for cross-functional projects, open to all
- **#announce** — read-only, leadership updates only
- **#social** — non-work, low-pressure

## Use threads aggressively

Every substantive topic deserves a thread, not a chain of top-level messages. Threads are searchable, linkable, and don't create noise for people who don't need to follow them.

## The "status update" channel anti-pattern

Don't use Teamflow as a standup replacement by posting "what I did today" updates in a channel. Nobody reads them and they crowd out real discussion. Use structured check-ins in threads if you need this — or better yet, let the work speak for itself in commits, PRs, and task updates.`,
  },
  {
    slug: 'v2-4-release',
    title: 'Teamflow v2.4 release notes',
    excerpt: 'Message virtualization, new thread panel, Postgres credential rotation, and 14 bug fixes.',
    author: { name: 'Devon Lee', initials: 'DL', color: '#0ea5e9', role: 'DevOps Engineer' },
    date: 'April 15, 2026',
    readTime: '3 min read',
    tag: 'Release',
    body: `v2.4 is out. Here's everything that shipped.

## New

- **Thread Panel rebuild** — fully independent render tree, 60% faster open time, spring animation, keyboard accessible (see the [full post](/blog/introducing-thread-panel))
- **Message virtualization** — the message list now only renders visible rows. Scroll performance in large channels is dramatically better.
- **Presence indicators** — avatars in the sidebar now show live presence (online / away / offline) with a 30-second poll interval.

## Improved

- Search typeahead latency down from ~800ms p95 to ~43ms (see the [search post](/blog/search-reindex))
- Composer slash-command hint is now shown in the placeholder text
- Reaction picker opens faster and closes on outside click

## Fixed

- Thread reply count badge now uses \`--text-secondary\` token (was full white)
- Message timestamps were off by one hour in IST — fixed
- Sidebar scroll position was lost on channel switch — fixed
- 11 additional minor bug fixes

## Infrastructure

- Postgres credentials rotated — zero downtime, ~30s write blip as warned in #engineering
- Staging deploy pipeline now runs health checks before promoting to prod`,
  },
  {
    slug: 'keyboard-first-design',
    title: 'Why we design keyboard-first',
    excerpt: 'Every feature in Teamflow is designed to be fully operable without a mouse. Here\'s the philosophy behind that.',
    author: { name: 'Priya Patel', initials: 'PP', color: '#ec4899', role: 'Design Lead' },
    date: 'April 2, 2026',
    readTime: '5 min read',
    tag: 'Design',
    body: `Every time you reach for the mouse in a communication tool, you break your flow. You stop typing, move your hand, click, and then find your way back to the keyboard. It's a small friction, but it compounds hundreds of times a day.

## The principle

If it takes more than one keypress to do something you do constantly, we've failed. Cmd+K for search, Cmd+T for compose, Escape to close anything — these aren't power-user features, they're the defaults.

## How we audit keyboard support

Every new component goes through a keyboard audit before it ships:

1. Can you reach it with Tab?
2. Can you activate it with Enter or Space?
3. Can you close or dismiss it with Escape?
4. Does focus return to a sensible place after?
5. Is the focus ring visible at 3x zoom?

If any of these fail, the component doesn't ship.

## Screen reader support

We test every release with VoiceOver on macOS and NVDA on Windows. Roles, labels, and live regions are spec'd in the design file, not added as an afterthought.

## The business case

Keyboard-accessible apps are faster to use, which means users trust them more. They're also more accessible to users with motor impairments. There's no tradeoff here — good keyboard support and good accessibility are the same thing.`,
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
