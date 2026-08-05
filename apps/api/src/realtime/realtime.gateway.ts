import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { ChatService } from '../chat/chat.service';
import { AddReactionDto } from '../chat/dto/add-reaction.dto';
import { CreateMessageDto } from '../chat/dto/create-message.dto';
import { EditMessageDto } from '../chat/dto/edit-message.dto';
import { RelationshipService } from '../relationship/relationship.service';

import { RealtimeService } from './realtime.service';
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,

    private readonly realtimeService: RealtimeService,
    private readonly relationshipService: RelationshipService,
    private readonly chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);

      Object.assign(client.data, {
        user: payload,
      });

      client.join(`user:${payload.sub}`);

      const relationship = await this.relationshipService.getCurrentCouple(
        payload.sub,
      );

      if (relationship) {
        client.join(`workspace:${relationship.workspaceId}`);
      }
      if (relationship) {
        const partnerSockets = await this.server

          .in(`user:${relationship.partnerId}`)

          .fetchSockets();

        if (partnerSockets.length > 0) {
          client.emit('user.online', {
            userId: relationship.partnerId,
          });
        } else {
          client.emit('user.offline', {
            userId: relationship.partnerId,
          });
        }

        this.realtimeService.emitToUser(
          relationship.partnerId,

          'user.online',

          {
            userId: payload.sub,
          },
        );
      }
    } catch {
      client.disconnect();
    }
  }

  // @SubscribeMessage("relationship:sync")
  // async handleRelationshipSync(client: Socket) {
  //   const userId = client.data.user?.sub;

  //   if (!userId) {
  //     return;
  //   }

  //   const relationship = await this.relationshipService.getCurrentCouple(userId);

  //   if (!relationship) {
  //     return;
  //   }

  //   client.emit("relationship.connected", {
  //     userId: relationship.partnerId,

  //     online: true,
  //   });
  // }

  @SubscribeMessage('chat:send')
  async handleChatSend(client: Socket, dto: CreateMessageDto) {
    const userId = client.data.user?.sub;

    if (!userId) {
      return;
    }

    const message = await this.chatService.sendMessage(userId, dto);
    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;
    this.realtimeService.emitToWorkspace(
      relationship.workspaceId,
      'chat.message.created',
      message,
    );
  }

  @SubscribeMessage('chat:edit')
  async handleChatEdit(
    client: Socket,
    payload: { messageId: string; dto: EditMessageDto },
  ) {
    const message = await this.chatService.editMessage(
      payload.messageId,
      payload.dto,
    );
    const userId = client.data.user?.sub;
    if (!userId) return;

    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;

    this.realtimeService.emitToWorkspace(
      relationship.workspaceId,
      'chat.message.edited',
      message,
    );
  }

  @SubscribeMessage('chat:delete')
  async handleChatDelete(client: Socket, payload: { messageId: string }) {
    await this.chatService.deleteMessage(payload.messageId);
    const userId = client.data.user?.sub;
    if (!userId) return;

    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;

    this.realtimeService.emitToWorkspace(
      relationship.workspaceId,
      'chat.message.deleted',
      payload,
    );
  }

  @SubscribeMessage('chat:reaction:add')
  async handleReactionAdd(
    client: Socket,
    payload: { messageId: string; dto: AddReactionDto },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const reaction = await this.chatService.addReaction(
      userId,
      payload.messageId,
      payload.dto,
    );
    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;

    this.realtimeService.emitToWorkspace(
      relationship.workspaceId,
      'chat.reaction.added',
      reaction,
    );
  }

  @SubscribeMessage('chat:reaction:remove')
  async handleReactionRemove(
    client: Socket,
    payload: { messageId: string; emoji: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    await this.chatService.removeReaction(
      userId,
      payload.messageId,
      payload.emoji,
    );
    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;

    this.realtimeService.emitToWorkspace(
      relationship.workspaceId,
      'chat.reaction.removed',
      payload,
    );
  }

  @SubscribeMessage('chat:typing:start')
  async handleTypingStart(client: Socket) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;

    this.realtimeService.emitToWorkspace(
      relationship.workspaceId,
      'chat.typing.start',
      {
        userId,
      },
    );
  }

  @SubscribeMessage('chat:typing:stop')
  async handleTypingStop(client: Socket) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;

    this.realtimeService.emitToWorkspace(
      relationship.workspaceId,
      'chat.typing.stop',
      {
        userId,
      },
    );
  }

  @SubscribeMessage('chat:read')
  async handleRead(client: Socket, payload: { messageId: string }) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;

    const updatedMessage = await this.chatService.markRead(
      payload.messageId,
      relationship.workspaceId,
      userId,
    );

    if (!updatedMessage) return;

    this.realtimeService.emitToUser(
      relationship.partnerId,
      'chat.message.read',
      {
        userId,
        messageId: payload.messageId,
      },
    );
  }

  @SubscribeMessage('chat:delivered')
  async handleDelivered(client: Socket, payload: { messageId: string }) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;

    const updatedMessage = await this.chatService.markDelivered(
      payload.messageId,
      relationship.workspaceId,
      userId,
    );

    if (!updatedMessage) return;

    this.realtimeService.emitToUser(
      relationship.partnerId,
      'chat.message.delivered',
      {
        userId,
        messageId: payload.messageId,
      },
    );
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;
    if (!userId) {
      return;
    }
    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) {
      return;
    }
    this.realtimeService.emitToWorkspace(
      relationship.workspaceId,
      'chat.typing.stop',
      {
        userId,
      },
    );

    const sockets = await this.server.in(`user:${userId}`).fetchSockets();
    if (sockets.length === 0) {
      this.realtimeService.emitToUser(
        relationship.partnerId,

        'user.offline',

        {
          userId,
        },
      );
    }
  }
}
