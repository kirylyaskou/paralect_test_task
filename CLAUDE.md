@AGENTS.md
## CRITICAL: Context Management

You MUST monitor your context usage. When the context monitor hook
warns you about high context usage:

1. `git add -A && git commit -m "WIP: <current task>"`
2. Run /clear
3. After clear, re-read ./plans/<active-plan>.md
4. Re-read CLAUDE.md
5. Run `git log --oneline -5` to see where you left off
6. Continue from the first incomplete task

NEVER attempt to "push through" with high context. /clear is free.
Your state is in the filesystem, not in the conversation.