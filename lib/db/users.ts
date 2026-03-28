import 'server-only'

import { supabase } from './client'
import { DatabaseError } from '@/lib/errors'

export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new DatabaseError('Failed to fetch user', error)
  }

  return data
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    throw new DatabaseError('Failed to fetch user by email', error)
  }

  return data
}
