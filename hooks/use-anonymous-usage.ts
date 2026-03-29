'use client'

import { useEffect, useState, useCallback } from 'react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const ANONYMOUS_LIMIT = 3

export function useAnonymousUsage() {
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(0)
  const [limitReached, setLimitReached] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Generate fingerprint on mount (client-only, inside useEffect)
  useEffect(() => {
    ;(async () => {
      try {
        const fp = await FingerprintJS.load()
        const result = await fp.get()
        setFingerprint(result.visitorId)
      } catch {
        // Fallback: random UUID per session
        setFingerprint(crypto.randomUUID())
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const incrementCount = useCallback(() => {
    setQuestionCount((prev) => {
      const next = prev + 1
      if (next >= ANONYMOUS_LIMIT) {
        setLimitReached(true)
      }
      return next
    })
  }, [])

  const checkLimit = useCallback(() => {
    return questionCount >= ANONYMOUS_LIMIT
  }, [questionCount])

  return {
    fingerprint,
    questionCount,
    limitReached,
    isLoading,
    incrementCount,
    checkLimit,
    ANONYMOUS_LIMIT,
  }
}
