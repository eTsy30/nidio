export interface ServerToClientEvents {
  "finance.updated": (data: { coupleId: string }) => void;
  "relationship.updated": (data: { coupleId: string }) => void;
  "user.online": (data: { userId: string }) => void;
  "user.offline": (data: { userId: string }) => void;
  "relationship.connected": (data: { userId: string; online: boolean }) => void;
}

export interface ClientToServerEvents {
  "user:status:sync": () => void;
}
