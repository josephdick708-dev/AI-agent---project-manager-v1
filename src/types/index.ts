import { Project, Message, Document, User } from '@prisma/client'

export type { Project, Message, Document, User }

export type ProjectWithMessages = Project & {
  messages: Message[]
  documents: Document[]
}

export type MessageRole = 'user' | 'assistant'