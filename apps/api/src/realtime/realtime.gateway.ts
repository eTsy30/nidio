import { UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import type { AccessTokenPayload } from '../auth/interfaces/jwt.interfaces';
import { ChatService } from '../chat/chat.service';
import { CreateMessageDto } from '../chat/dto/create-message.dto';
import {
  ChatEditDto,
  ChatPresenceDto,
  ChatReactionDto,
  ChatReadDto,
  ChatRemoveReactionDto,
  MessageIdDto,
} from '../chat/dto/ws-chat.dto';
import { originValidator } from '../config/origin';
import { PushService } from '../push/push.service';
import { RelationshipService } from '../relationship/relationship.service';

import { RealtimeService } from './realtime.service';
@WebSocketGateway({
  cors: {
    origin: originValidator,
    credentials: true,
  },
})
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly eventWindows = new Map<
    string,
    { startedAt: number; count: number }
  >();
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly pushService: PushService,
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

      const payload = this.jwtService.verify<AccessTokenPayload>(token);

      if (
        payload.type !== 'access' ||
        !payload.sub ||
        !payload.exp ||
        payload.exp * 1000 <= Date.now()
      ) {
        client.disconnect();
        return;
      }

      Object.assign(client.data, {
        user: payload,
        accessTokenExpiresAt: payload.exp,
      });

      client.use((_event, next) => {
        if (
          typeof client.data.accessTokenExpiresAt !== 'number' ||
          client.data.accessTokenExpiresAt * 1000 <= Date.now()
        ) {
          client.disconnect();
          next(new Error('Access token expired'));
          return;
        }
        const now = Date.now();
        const window = this.eventWindows.get(client.id);
        const current =
          !window || now - window.startedAt >= 60_000
            ? { startedAt: now, count: 0 }
            : window;
        current.count += 1;
        this.eventWindows.set(client.id, current);
        if (current.count > 60) {
          next(new Error('Too many WebSocket events'));
          return;
        }
        next();
      });

      const disconnectAtExpiry = setTimeout(
        () => client.disconnect(),
        payload.exp * 1000 - Date.now(),
      );
      disconnectAtExpiry.unref();
      client.once('disconnect', () => clearTimeout(disconnectAtExpiry));

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
  @SubscribeMessage('user:status:sync')
  async handleUserStatusSync(@ConnectedSocket() client: Socket) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;

    const partnerSockets = await this.server
      .in(`user:${relationship.partnerId}`)
      .fetchSockets();

    client.emit(partnerSockets.length > 0 ? 'user.online' : 'user.offline', {
      userId: relationship.partnerId,
    });
  }

  @SubscribeMessage('chat:presence')
  async handleChatPresence(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatPresenceDto,
  ) {
    const userId = client.data.user?.sub;
    if (!userId || typeof payload?.active !== 'boolean') return;
    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) return;
    await this.pushService.setPresence(
      client.id,
      userId,
      relationship.workspaceId,
      payload.active,
    );
  }

  @SubscribeMessage('chat:send')
  async handleChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateMessageDto,
    @Ack()
    ack?: (
      result: { ok: true; messageId: string } | { ok: false; error: string },
    ) => void,
  ) {
    const userId = client.data.user?.sub;

    if (!userId) {
      ack?.({ ok: false, error: 'Unauthorized' });
      return;
    }

    const { message, created } = await this.chatService.sendMessageWithResult(
      userId,
      dto,
    );
    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) {
      ack?.({ ok: false, error: 'Relationship not found' });
      return;
    }
    if (created) {
      this.realtimeService.emitToWorkspace(
        relationship.workspaceId,
        'chat.message.created',
        message,
      );
    }
    ack?.({ ok: true, messageId: message.id });
  }

  @SubscribeMessage('chat:edit')
  async handleChatEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatEditDto,
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;
    const message = await this.chatService.editMessage(
      userId,
      payload.messageId,
      payload.dto,
    );

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
  async handleChatDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageIdDto,
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;
    await this.chatService.deleteMessage(userId, payload.messageId);

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
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatReactionDto,
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
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatRemoveReactionDto,
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
      { ...payload, userId },
    );
  }

  @SubscribeMessage('chat:typing:start')
  async handleTypingStart(@ConnectedSocket() client: Socket) {
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
  async handleTypingStop(@ConnectedSocket() client: Socket) {
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
  async handleRead(
    @ConnectedSocket() client: Socket,

    @MessageBody() payload: ChatReadDto,
  ) {
    const userId = client.data.user?.sub;

    if (!userId) return;

    const relationship =
      await this.relationshipService.getCurrentCouple(userId);

    if (!relationship) return;

    const updatedMessages = await this.chatService.markRead(
      payload.messageIds,
      relationship.workspaceId,

      userId,
    );

    for (const messageId of updatedMessages) {
      this.realtimeService.emitToUser(
        relationship.partnerId,

        'chat.message.read',

        {
          userId,

          messageId,
        },
      );
    }
  }

  @SubscribeMessage('chat:delivered')
  async handleDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageIdDto,
  ) {
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
    this.eventWindows.delete(client.id);
    await this.pushService.clearPresence(client.id);
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
