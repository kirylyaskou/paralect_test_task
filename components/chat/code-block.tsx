'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'

function extractTextFromChildren(element: React.ReactNode): string {
  if (typeof element === 'string') return element
  if (Array.isArray(element)) return element.map(extractTextFromChildren).join('')
  if (element && typeof element === 'object' && 'props' in element) {
    const el = element as React.ReactElement<{ children?: React.ReactNode }>
    return extractTextFromChildren(el.props.children)
  }
  return ''
}

export function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const text = extractTextFromChildren(children)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <pre
      className="relative group rounded-md bg-muted p-4 overflow-x-auto my-3"
      {...props}
    >
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-background/50"
        aria-label="Copy code"
        type="button"
      >
        {copied ? (
          <Check size={14} className="text-primary" />
        ) : (
          <Copy size={14} className="text-muted-foreground" />
        )}
      </button>
      {children}
    </pre>
  )
}
