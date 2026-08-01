export const REALTIME_EVENTS = {
  RELATIONSHIP_CONNECTED: "relationship.connected",

  CHAT_MESSAGE_CREATED: "chat.message.created",
  CHAT_TYPING: "chat.typing",

  CALENDAR_UPDATED: "calendar.updated",

  NOTE_UPDATED: "note.updated",

  MEMORY_CREATED: "memory.created",
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
