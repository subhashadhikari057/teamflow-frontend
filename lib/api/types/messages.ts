import type { ActionResponse } from './common';

export interface ChannelMessageAttachment {
  fileName: string;
  originalName: string;
  relativePath: string;
  contentType: string;
  mimeType: string;
  size: number;
  optimized: boolean;
}

export interface ChannelMessageSender {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  content: string;
  senderId: string;
  sender: ChannelMessageSender;
  attachments?: ChannelMessageAttachment[];
  createdAt: string;
  editedAt?: string | null;
  isEdited: boolean;
}

export interface ListChannelMessagesQuery {
  cursor?: string;
  limit?: number;
}

export interface SendChannelMessagePayload {
  content: string;
  attachments?: ChannelMessageAttachment[];
}

export interface UpdateChannelMessagePayload {
  content: string;
}

export type DeleteChannelMessageResponse = ActionResponse;
