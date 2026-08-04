// import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "";

import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/shared/ui/avatar-pair/Avatar";

import { Bubble, BubbleContent, BubbleReactions } from "./bubble";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "./message";

type ChatMessageData = {
  id: string;
  content: string | null;
  sender: {
    id: string;
    firstName: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  status?: "sending" | "sent" | "delivered" | "read" | "error";
};

export function ChatMessage({
  message,
  currentUserId,
  showAvatar = true,
  showName = true,
}: {
  message: ChatMessageData;
  currentUserId: string;
  showAvatar?: boolean;
  showName?: boolean;
}) {
  const isMine = message.sender.id === currentUserId;

  return (
    <Message align={isMine ? "end" : "start"}>
      {!isMine && (
        <MessageAvatar className={!showAvatar ? "opacity-0" : ""}>
          {showAvatar && (
            <Avatar>
              {message.sender.avatarUrl && <AvatarImage src={message.sender.avatarUrl} />}
              <AvatarFallback>{message.sender.firstName.slice(0, 1)}</AvatarFallback>
              <AvatarBadge />
            </Avatar>
          )}
        </MessageAvatar>
      )}

      <MessageContent>
        {!isMine && showName && <MessageHeader>{message.sender.firstName}</MessageHeader>}

        <Bubble variant={isMine ? "default" : "secondary"} align={isMine ? "end" : "start"}>
          <BubbleContent>{message.content}</BubbleContent>

          {/* <BubbleReactions align={isMine ? "end" : "start"}>
            ❤️
            <span>👍</span>
          </BubbleReactions> */}
        </Bubble>

        <MessageFooter>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {isMine && (
            <span className="ml-1">
              {message.status === "sending" && "⏳"}
              {message.status === "sent" && "✓"}
              {message.status === "delivered" && "✓✓"}
              {message.status === "read" && "✓✓"}
              {message.status === "error" && "!"}
            </span>
          )}
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}
