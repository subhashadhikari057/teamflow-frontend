import { del, get, patch, post } from './client';
import type {
  ActionResponse,
  AddChannelMemberPayload,
  ChannelMemberSummary,
  ChannelSummary,
  CreateChannelPayload,
  UpdateChannelMemberRolePayload,
  UpdateChannelPayload,
} from './types';

export const channelsApi = {
  create: (workspaceId: string, data: CreateChannelPayload) =>
    post<ChannelSummary>(`/mobile/workspaces/${workspaceId}/channels`, data),

  list: (workspaceId: string) =>
    get<ChannelSummary[]>(`/mobile/workspaces/${workspaceId}/channels`),

  getById: (workspaceId: string, channelId: string) =>
    get<ChannelSummary>(`/mobile/workspaces/${workspaceId}/channels/${channelId}`),

  update: (workspaceId: string, channelId: string, data: UpdateChannelPayload) =>
    patch<ChannelSummary>(`/mobile/workspaces/${workspaceId}/channels/${channelId}`, data),

  delete: (workspaceId: string, channelId: string) =>
    del<ActionResponse>(`/mobile/workspaces/${workspaceId}/channels/${channelId}`),

  toggleArchive: (workspaceId: string, channelId: string) =>
    patch<ChannelSummary>(`/mobile/workspaces/${workspaceId}/channels/${channelId}/archive`),

  join: (workspaceId: string, channelId: string) =>
    post<ChannelMemberSummary>(`/mobile/workspaces/${workspaceId}/channels/${channelId}/join`),

  leave: (workspaceId: string, channelId: string) =>
    post<ActionResponse>(`/mobile/workspaces/${workspaceId}/channels/${channelId}/leave`),

  addMember: (workspaceId: string, channelId: string, data: AddChannelMemberPayload) =>
    post<ChannelMemberSummary>(`/mobile/workspaces/${workspaceId}/channels/${channelId}/members`, data),

  listMembers: (workspaceId: string, channelId: string) =>
    get<ChannelMemberSummary[]>(`/mobile/workspaces/${workspaceId}/channels/${channelId}/members`),

  updateMemberRole: (
    workspaceId: string,
    channelId: string,
    userId: string,
    data: UpdateChannelMemberRolePayload,
  ) => patch<ChannelMemberSummary>(
    `/mobile/workspaces/${workspaceId}/channels/${channelId}/members/${userId}`,
    data,
  ),

  removeMember: (workspaceId: string, channelId: string, userId: string) =>
    del<ActionResponse>(`/mobile/workspaces/${workspaceId}/channels/${channelId}/members/${userId}`),

  toggleArchiveForMe: (workspaceId: string, channelId: string) =>
    patch<ActionResponse>(`/mobile/workspaces/${workspaceId}/channels/${channelId}/members/me/archive`),

  markRead: (workspaceId: string, channelId: string) =>
    patch<ActionResponse>(`/mobile/workspaces/${workspaceId}/channels/${channelId}/read`),
};
