export enum EventScope {
  PERSONAL = "PERSONAL",
  COUPLE = "COUPLE",
}

export enum EventType {
  DATE = "DATE",
  BIRTHDAY = "BIRTHDAY",
  ANNIVERSARY = "ANNIVERSARY",
  OTHER = "OTHER",
}

export enum EventRepeat {
  NONE = "NONE",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export interface CalendarEventCreator {
  id: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;

  startAt: string;
  endAt?: string | null;

  type: EventType;
  scope: EventScope;

  allDay: boolean;
  repeat: EventRepeat;

  reminderAt?: string | null;

  createdById: string;

  creator?: CalendarEventCreator | null;
}

export interface CalendarEventFormValues {
  title: string;
  description: string;

  type: EventType;

  startAt: Date;
  endAt: Date | null;

  allDay: boolean;
  reminderAt: Date | null;

  repeat: EventRepeat;
}

export type ViewMode = "month" | "week" | "year";
