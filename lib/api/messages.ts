import { del, get, patch, post } from './client';
import type {
  ChannelMessage,
  DeleteChannelMessageResponse,
  ListChannelMessagesQuery,
  SendChannelMessagePayload,
  UpdateChannelMessagePayload,
} from './types';

function buildQuery(query: ListChannelMessagesQuery = {}) {
  const searchParams = new URLSearchParams();

  if (query.cursor) {
    searchParams.set('cursor', query.cursor);
  }

  if (query.limit !== undefined) {
    searchParams.set('limit', String(query.limit));
  }

  const search = searchParams.toString();
  return search ? `?${search}` : '';
}

export const messagesApi = {
  list: (workspaceId: string, channelId: string, query?: ListChannelMessagesQuery) =>
    get<ChannelMessage[]>(
      `/mobile/workspaces/${workspaceId}/channels/${channelId}/messages${buildQuery(query)}`,
    ),

  send: (workspaceId: string, channelId: string, data: SendChannelMessagePayload) =>
    post<ChannelMessage>(`/mobile/workspaces/${workspaceId}/channels/${channelId}/messages`, data),

  update: (workspaceId: string, channelId: string, messageId: string, data: UpdateChannelMessagePayload) =>
    patch<ChannelMessage>(
      `/mobile/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}`,
      data,
    ),

  remove: (workspaceId: string, channelId: string, messageId: string) =>
    del<DeleteChannelMessageResponse>(
      `/mobile/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}`,
    ),
};
