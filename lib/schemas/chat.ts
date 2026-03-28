import { z } from 'zod'

export const createChatSchema = z.object({
  title: z.string().max(200, 'Title too long').optional(),
})

export const updateChatTitleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
})

export type CreateChatInput = z.infer<typeof createChatSchema>
export type UpdateChatTitleInput = z.infer<typeof updateChatTitleSchema>
