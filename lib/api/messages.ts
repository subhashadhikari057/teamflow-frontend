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

function unwrapMessageResponse(
  response: ChannelMessage | { success?: boolean; data?: ChannelMessage },
): ChannelMessage {
  if ('id' in response) {
    return response;
  }

  return response.data as ChannelMessage;
}

function unwrapMessagesResponse(
  response: ChannelMessage[] | { success?: boolean; data?: ChannelMessage[] },
): ChannelMessage[] {
  if (Array.isArray(response)) {
    return response;
  }

  return response.data ?? [];
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

  pin: async (workspaceId: string, channelId: string, messageId: string) =>
    unwrapMessageResponse(await post<ChannelMessage | { success?: boolean; data?: ChannelMessage }>(
      `/mobile/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/pin`,
    )),

  unpin: async (workspaceId: string, channelId: string, messageId: string) =>
    unwrapMessageResponse(await del<ChannelMessage | { success?: boolean; data?: ChannelMessage }>(
      `/mobile/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}/pin`,
    )),

  listPins: async (workspaceId: string, channelId: string) =>
    unwrapMessagesResponse(await get<ChannelMessage[] | { success?: boolean; data?: ChannelMessage[] }>(
      `/mobile/workspaces/${workspaceId}/channels/${channelId}/pins`,
    )),

  remove: (workspaceId: string, channelId: string, messageId: string) =>
    del<DeleteChannelMessageResponse>(
      `/mobile/workspaces/${workspaceId}/channels/${channelId}/messages/${messageId}`,
    ),
};
