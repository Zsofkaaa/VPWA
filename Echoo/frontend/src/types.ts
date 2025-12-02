export interface UserChannel {
  id: number
  name: string
  path: string
  type: 'public' | 'private'
  role: string
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
