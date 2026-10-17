import { UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import type { AccessTokenPayload } from '../auth/interfaces/jwt.interfaces';
import { originValidator } from '../config/origin';
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
    private readonly jwtService: JwtService,

    private readonly realtimeService: RealtimeService,
    private readonly relationshipService: RelationshipService,
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

  async handleDisconnect(client: Socket) {
    this.eventWindows.delete(client.id);
    const userId = client.data.user?.sub;
    if (!userId) {
      return;
    }
    const relationship =
      await this.relationshipService.getCurrentCouple(userId);
    if (!relationship) {
      return;
    }

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
