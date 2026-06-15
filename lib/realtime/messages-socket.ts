'use client';

import { io, type Socket } from 'socket.io-client';
import type { ChannelMessage } from '@/lib/api/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
const MESSAGES_SOCKET_URL = process.env.NEXT_PUBLIC_MESSAGES_SOCKET_URL ?? `${API_ORIGIN}/messages`;

export interface ChannelRoomPayload {
  workspaceId: string;
  channelId: string;
}

export interface MessageCreatedPayload extends ChannelRoomPayload {
  message: ChannelMessage;
}

export interface MessageUpdatedPayload extends ChannelRoomPayload {
  message: ChannelMessage;
}

export interface MessageDeletedPayload extends ChannelRoomPayload {
  messageId: string;
}

export interface ChannelMetaUpdatedPayload extends ChannelRoomPayload {
  unreadCount: number;
  lastReadAt?: string | null;
  lastMessageAt?: string | null;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
}

export function createMessagesSocket(token: string): Socket {
  return io(MESSAGES_SOCKET_URL, {
    auth: {
      token,
    },
  });
}
