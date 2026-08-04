export type ChatMessageItem = {
  id: string;
  content: string | null;
  sender: {
    id: string;
    firstName: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  clientId?: string;
  status?: "sending" | "sent" | "delivered" | "read" | "error";
};
