import { z } from 'zod'

export const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long'),
  imageUrls: z.array(z.string().url()).optional(),
})

export type CreateMessageInput = z.infer<typeof createMessageSchema>
