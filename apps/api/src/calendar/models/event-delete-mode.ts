import { registerEnumType } from '@nestjs/graphql';

export enum EventDeleteMode {
  THIS = 'THIS',
  FOLLOWING = 'FOLLOWING',
  ALL = 'ALL',
}

registerEnumType(EventDeleteMode, {
  name: 'EventDeleteMode',
  description: 'Режим удаления события',
});
