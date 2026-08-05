export const REALTIME_EVENTS = {
  RELATIONSHIP_CONNECTED: "relationship.connected",
  CHAT_SEND: "chat:send",
  CHAT_MESSAGE_CREATED: "chat.message.created",
  CHAT_EDITED: "chat.message.edited",
  CHAT_DELETED: "chat.message.deleted",
  CHAT_DELIVERED: "chat.message.delivered",
  CHAT_READ: "chat.message.read",
  CHAT_REACTION_ADDED: "chat.reaction.added",
  CHAT_REACTION_REMOVED: "chat.reaction.removed",
  CHAT_TYPING_START: "chat.typing.start",
  CHAT_TYPING_STOP: "chat.typing.stop",
  CALENDAR_UPDATED: "calendar.updated",
  NOTE_UPDATED: "note.updated",
  MEMORY_CREATED: "memory.created",

  USER_ONLINE: "user.online",
  USER_OFFLINE: "user.offline",
} as const;

export type RealtimeEventName = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];
