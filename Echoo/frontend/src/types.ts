export interface TypingData {
  user: string
}

export interface UserChannel {
  id: number
  name: string
  type: 'private' | 'public'
  path: string
  role: 'admin' | 'member'
  notificationSettings?: string
}

export interface AppUser {
  id: number
  nickName: string
}

export interface KickResponse {
  message: string
}

export interface ChannelResponse {
  id: number
  name: string
  type: 'private' | 'public'
}

export interface Message {
  id: number
  userId: number
  user: string
  text: string
  channelId: number
  isPing?: boolean
  mentionedUserIds?: number[]
}

export interface Channel {
  id: number
  name: string
  type: 'private' | 'public'
  createdBy: number
  lastActiveAt: string
}

// Rozhrania pre typy
export interface Invite {
  id: number
  channel_id: number
  channel: {
    id: number
    name: string
  }
}

export interface ChannelData {
  name: string
  type: 'private' | 'public'
  invitedMembers: number[]
  notificationSettings: string
}

export interface AxiosErrorLike {
  isAxiosError: boolean
  response?: { status: number }
}
