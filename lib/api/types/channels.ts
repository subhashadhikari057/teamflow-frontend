export type ChannelType = 'PUBLIC' | 'PRIVATE';
export type ChannelMemberRole = 'ADMIN' | 'MEMBER';

export interface ChannelSummary {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  topic?: string | null;
  type: ChannelType;
  isReadOnly: boolean;
  isArchived: boolean;
  isGeneral: boolean;
  memberCount: number;
  isMember: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ChannelMemberSummary {
  id: string;
  channelId: string;
  userId: string;
  name?: string | null;
  username: string;
  avatarUrl?: string | null;
  role: ChannelMemberRole;
  isArchived: boolean;
  joinedAt: string;
}

export interface ChannelCreatorSummary {
  id: string;
  name?: string | null;
  username: string;
  avatarUrl?: string | null;
}

export interface ChannelDetail extends ChannelSummary {
  creator?: ChannelCreatorSummary | null;
  members?: ChannelMemberSummary[];
}

export interface CreateChannelPayload {
  name: string;
  description?: string;
  topic?: string;
  type: ChannelType;
  isReadOnly?: boolean;
}

export interface UpdateChannelPayload {
  name?: string;
  description?: string;
  topic?: string;
  isReadOnly?: boolean;
}

export interface AddChannelMemberPayload {
  userId: string;
}

export interface UpdateChannelMemberRolePayload {
  role: ChannelMemberRole;
}
