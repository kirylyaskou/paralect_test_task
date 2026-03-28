import 'server-only'

import { supabase } from './client'
import { DatabaseError } from '@/lib/errors'

export async function getAnonymousUsage(fingerprint: string) {
  const { data, error } = await supabase
    .from('anonymous_usage')
    .select('*')
    .eq('fingerprint', fingerprint)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "not found" -- acceptable for new fingerprints
    throw new DatabaseError('Failed to fetch anonymous usage', error)
  }

  return data
}

export async function incrementAnonymousUsage(fingerprint: string) {
  // Upsert: create if not exists, increment if exists
  const existing = await getAnonymousUsage(fingerprint)

  if (existing) {
    const { data, error } = await supabase
      .from('anonymous_usage')
      .update({
        question_count: existing.question_count + 1,
        last_question_at: new Date().toISOString(),
      })
      .eq('fingerprint', fingerprint)
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to increment anonymous usage', error)
    }

    return data
  } else {
    const { data, error } = await supabase
      .from('anonymous_usage')
      .insert({
        fingerprint,
        question_count: 1,
        last_question_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new DatabaseError('Failed to create anonymous usage', error)
    }

    return data
  }
}
