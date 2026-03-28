import type { Database } from './supabase'

// Table row types
export type User = Database['public']['Tables']['users']['Row']
export type Chat = Database['public']['Tables']['chats']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Document = Database['public']['Tables']['documents']['Row']
export type AnonymousUsage = Database['public']['Tables']['anonymous_usage']['Row']

// Insert types (for creating new records)
export type ChatInsert = Database['public']['Tables']['chats']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']

// Enum types
export type MessageRole = Database['public']['Enums']['message_role']
