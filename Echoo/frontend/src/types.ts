export interface TypingData {
  user: string
  channelId: number
}

export interface UserChannel {
  id: number
  name: string
  type: 'private' | 'public'
  path: string
  role: 'admin' | 'member'
  notificationSettings?: string
}

export interface KickResponse {
  message: string
}

export interface Command {
  id: number
  name: string
  description: string
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
  path: string
  role?: 'admin' | 'member'
  type: 'private' | 'public'
  members?: { userId: number; username: string }[]
}

export interface Invite {
  id: number
  channel_id: number
  channel: { id: number; name: string }
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

export interface AxiosErrorLike2 {
  response?: {
    data?: {
      error?: string
    }
  }
}

export interface TypingContentData {
  user: string
  channelId: number
  content: string
}

export interface MeResponse {
  id: number
  name: string | null
  nickName: string | null
}

export interface AppUser {
  id: number
  nickName: string
}

export interface User {
  id: number
  nickName: string
  role: 'admin' | 'member'
}

export interface Member {
  userId: number
  username: string
}
