import type { PostgrestError } from '@supabase/supabase-js'

export class DatabaseError extends Error {
  public readonly code: string | null
  public readonly details: string | null

  constructor(message: string, pgError?: PostgrestError) {
    super(message)
    this.name = 'DatabaseError'
    this.code = pgError?.code ?? null
    this.details = pgError?.details ?? null
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}
