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
  ) {}

  afterInit(server: Server) {
    this.realtimeService.setServer(server);
  }

  handleConnection(client: Socket) {
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
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('relationship:sync')
  async handleRelationshipSync(client: Socket) {
    const userId = client.data.user?.sub;

    if (!userId) {
      return;
    }

    const relationship =
      await this.relationshipService.getCurrentCouple(userId);

    if (!relationship) {
      return;
    }

    client.emit('relationship.connected', {
      type: 'relationship.connected',
      relationshipId: relationship.id,
      partnerId: relationship.partnerId,
    });
  }

  handleDisconnect(client: Socket) {
    client.disconnect();
  }
}
