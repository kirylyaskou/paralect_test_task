'use client'

import { Lightbulb, Code, Brain, BookOpen } from 'lucide-react'

const SUGGESTED_PROMPTS = [
  { icon: Lightbulb, title: 'Explain quantum computing', body: 'in simple terms anyone can understand' },
  { icon: Code, title: 'Write a Python script', body: 'that sorts a list using quicksort' },
  { icon: Brain, title: 'Help me brainstorm', body: 'creative startup ideas for 2026' },
  { icon: BookOpen, title: 'Summarize a complex topic', body: 'like blockchain in 3 paragraphs' },
]

interface WelcomeScreenProps {
  onPromptClick: (text: string) => void
}

export function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <h1 className="text-xl font-semibold text-foreground mb-8">
        How can I help you today?
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt.title}
            className="bg-card border border-border rounded-lg p-4 text-left hover:bg-accent hover:border-primary transition-colors cursor-pointer active:scale-[0.98]"
            onClick={() => onPromptClick(prompt.title + ' ' + prompt.body)}
          >
            <prompt.icon className="h-5 w-5 text-muted-foreground mb-2" />
            <div className="text-sm font-semibold text-foreground">{prompt.title}</div>
            <div className="text-sm text-muted-foreground">{prompt.body}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
