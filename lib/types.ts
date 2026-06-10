export interface User {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  presence: 'online' | 'away' | 'offline';
  status: string;
  tz: string;
}

export interface Channel {
  id: string;
  name: string;
  desc: string;
  unread: number;
  members: number;
}

export interface DM {
  id: string;
  userId: string;
  unread: number;
}

export interface Reaction {
  emoji: string;
  count: number;
  by: string[];
}

export interface ThreadReply {
  id: string;
  userId: string;
  time: string;
  body: string;
}

export interface Message {
  id: string;
  userId: string;
  time: string;
  body: string;
  reactions: Reaction[];
  thread?: { replies: ThreadReply[] };
  edited?: boolean;
}

export interface Member {
  userId: string;
  role: 'Owner' | 'Admin' | 'Member';
  joined: string;
}

export interface SearchItem {
  id: string;
  userId?: string;
  text?: string;
  meta?: string;
  name?: string;
}
