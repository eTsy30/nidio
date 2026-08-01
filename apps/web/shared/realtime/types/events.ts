export interface RelationshipConnectedEvent {
  type: "relationship.connected";
  relationshipId: string;
  partnerId: string;
}

export interface ChatMessageCreatedEvent {
  type: "chat.message.created";
  chatId: string;
  messageId: string;
}

export interface ChatTypingEvent {
  type: "chat.typing";
  userId: string;
  chatId: string;
  isTyping: boolean;
}

export interface CalendarUpdatedEvent {
  type: "calendar.updated";
  calendarId: string;
}

export interface NoteUpdatedEvent {
  type: "note.updated";
  noteId: string;
}

export interface MemoryCreatedEvent {
  type: "memory.created";
  memoryId: string;
}

export type RealtimeEvent =
  | RelationshipConnectedEvent
  | ChatMessageCreatedEvent
  | ChatTypingEvent
  | CalendarUpdatedEvent
  | NoteUpdatedEvent
  | MemoryCreatedEvent;
