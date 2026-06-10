import type { User, Channel, DM, Message, Member, SearchItem } from './types';

export const USERS: Record<string, User> = {
  ashim:  { id: 'ashim',  name: 'Ashim Shrestha', initials: 'AS', color: '#6366f1', role: 'Product Engineer', presence: 'online',  status: '🚀 Shipping', tz: 'NPT' },
  sarah:  { id: 'sarah',  name: 'Sarah Chen',     initials: 'SC', color: '#10b981', role: 'Frontend Lead',    presence: 'online',  status: 'In flow',     tz: 'PST' },
  marcus: { id: 'marcus', name: 'Marcus Wright',  initials: 'MW', color: '#f59e0b', role: 'Backend Engineer', presence: 'away',    status: 'Lunch',       tz: 'EST' },
  priya:  { id: 'priya',  name: 'Priya Patel',    initials: 'PP', color: '#ec4899', role: 'Design Lead',      presence: 'online',  status: 'Reviewing',   tz: 'IST' },
  devon:  { id: 'devon',  name: 'Devon Lee',      initials: 'DL', color: '#0ea5e9', role: 'DevOps Engineer',  presence: 'offline', status: '',            tz: 'GMT' },
};

export const CURRENT_USER = USERS.ashim;

export const CHANNELS: Channel[] = [
  { id: 'general',       name: 'general',       desc: 'Company-wide announcements and watercooler chat',  unread: 3, members: 42 },
  { id: 'engineering',   name: 'engineering',   desc: 'Eng discussion, deploys, incidents and reviews',    unread: 0, members: 18 },
  { id: 'marketing',     name: 'marketing',     desc: 'Campaigns, launches and growth experiments',        unread: 0, members: 11 },
  { id: 'design',        name: 'design',        desc: 'Design crits, specs and Figma links',               unread: 0, members: 9  },
  { id: 'random',        name: 'random',        desc: 'Non-work banter, memes and good vibes',             unread: 0, members: 38 },
  { id: 'announcements', name: 'announcements', desc: 'Read-only — leadership updates',                    unread: 0, members: 42 },
];

export const DMS: DM[] = [
  { id: 'sarah',  userId: 'sarah',  unread: 0 },
  { id: 'marcus', userId: 'marcus', unread: 2 },
  { id: 'priya',  userId: 'priya',  unread: 0 },
  { id: 'devon',  userId: 'devon',  unread: 0 },
];

export const ENG_MESSAGES: Message[] = [
  {
    id: 'm1', userId: 'sarah', time: '9:02 AM',
    body: "Morning all ☕ — kicking off the **v2.4 release** today. I just merged the message virtualization PR, scroll perf is *way* better now.",
    reactions: [{ emoji: '🎉', count: 5, by: ['marcus','priya','devon','ashim'] }, { emoji: '🚀', count: 3, by: ['ashim','priya'] }],
  },
  {
    id: 'm2', userId: 'marcus', time: '9:14 AM',
    body: "Nice. I'm seeing the staging deploy green. Here's the health check if anyone wants to poke at it:\n```bash\ncurl -s https://staging.teamflow.io/healthz | jq .\n# { \"status\": \"ok\", \"latency_ms\": 23, \"db\": \"connected\" }\n```",
    reactions: [],
  },
  {
    id: 'm3', userId: 'priya', time: '9:21 AM',
    body: "The new thread panel looks 🔥 — one nit: the reply count badge should use `--text-secondary` not full white. I'll drop the spec in the thread.",
    reactions: [{ emoji: '👀', count: 2, by: ['sarah','ashim'] }],
    thread: {
      replies: [
        { id: 't1', userId: 'sarah',  time: '9:24 AM', body: "Good catch — pushing a fix now." },
        { id: 't2', userId: 'priya',  time: '9:26 AM', body: "Here's the token:\n```css\ncolor: var(--text-secondary); /* #888888 */\n```" },
        { id: 't3', userId: 'ashim',  time: '9:31 AM', body: "Merged ✅ — shipping with the release." },
      ],
    },
  },
  {
    id: 'm4', userId: 'devon', time: '9:38 AM',
    body: "Heads up: I'm rotating the prod **Postgres credentials** at 11:00 NPT. Expect a ~30s blip on writes. Will post here when done.",
    reactions: [{ emoji: '🙏', count: 4, by: ['sarah', 'marcus', 'priya', 'ashim'] }],
  },
  {
    id: 'm5', userId: 'ashim', time: '9:45 AM',
    body: "Thanks Devon. I'll pause the migration job until you give the all-clear. Also — anyone free for a quick **15min sync** on the search indexing? Want to land it before the freeze.",
    reactions: [],
  },
  {
    id: 'm6', userId: 'sarah', time: '9:47 AM',
    body: "I'm in. Let's hop on a call.",
    reactions: [],
  },
];

export const RECENT_SEARCHES = ['release v2.4', 'postgres rotation', 'from:priya thread panel', 'search indexing'];

export const SEARCH_RESULTS: Record<string, SearchItem[]> = {
  Messages: [
    { id: 's1', userId: 'sarah',  text: 'kicking off the v2.4 release today', meta: '#engineering · 9:02 AM' },
    { id: 's2', userId: 'devon',  text: 'rotating the prod Postgres credentials at 11:00', meta: '#engineering · 9:38 AM' },
  ],
  Files: [
    { id: 'f1', name: 'release-notes-v2.4.md', meta: 'Markdown · 12 KB · shared by Sarah' },
    { id: 'f2', name: 'thread-panel-spec.fig',  meta: 'Figma · shared by Priya' },
  ],
  Channels: [
    { id: 'c1', name: 'engineering',   meta: '18 members' },
    { id: 'c2', name: 'announcements', meta: '42 members' },
  ],
  People: [
    { id: 'p1', userId: 'sarah' },
    { id: 'p2', userId: 'priya' },
  ],
};

export const MEMBERS: Member[] = [
  { userId: 'ashim',  role: 'Owner',  joined: 'Jan 2024' },
  { userId: 'sarah',  role: 'Admin',  joined: 'Feb 2024' },
  { userId: 'marcus', role: 'Member', joined: 'Mar 2024' },
  { userId: 'priya',  role: 'Admin',  joined: 'Mar 2024' },
  { userId: 'devon',  role: 'Member', joined: 'May 2024' },
];
