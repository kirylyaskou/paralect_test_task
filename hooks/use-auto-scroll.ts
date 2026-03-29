'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useAutoScroll(dependencies: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const isUserScrolledUp = useRef(false)
  const THRESHOLD = 100

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
    isUserScrolledUp.current = false
    setShowScrollButton(false)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleScroll = () => {
      const atBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - THRESHOLD
      isUserScrolledUp.current = !atBottom
      setShowScrollButton(!atBottom)
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isUserScrolledUp.current) {
      scrollToBottom()
    }
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps

  return { containerRef, showScrollButton, scrollToBottom }
}
