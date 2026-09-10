import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

const requireWeb = createRequire(
  new URL('../../web/package.json', import.meta.url),
);
const { io } = requireWeb('socket.io-client');
const url = process.env.RELEASE_TEST_DATABASE_URL;
assert(
  url && new URL(url).pathname === '/release_test',
  'Use an isolated /release_test database',
);
const apiPort = Number(process.env.RELEASE_API_PORT || 55440);
const api = `http://127.0.0.1:${apiPort}`;
const storage = createServer((_req, res) => {
  res.writeHead(200);
  res.end();
});
await new Promise((resolve) => storage.listen(0, '127.0.0.1', resolve));
const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: String(apiPort),
  DATABASE_URL: url,
  DIRECT_URL: url,
  PRISMA_DATABASE_URL: url,
  JWT_SECRET: 'release-runtime-test-only',
  FRONTEND_URL: 'http://localhost:3000',
  STORAGE_PROVIDER: 'minio',
  STORAGE_ENDPOINT: `http://127.0.0.1:${storage.address().port}`,
  STORAGE_REGION: 'us-east-1',
  STORAGE_ACCESS_KEY: 'test',
  STORAGE_SECRET_KEY: 'test',
  STORAGE_BUCKET: 'release-test',
  API_PUBLIC_URL: api,
  VAPID_PUBLIC_KEY: '',
  VAPID_PRIVATE_KEY: '',
  VAPID_SUBJECT: '',
  GMAIL_USER: 'test@example.test',
  GMAIL_APP_PASSWORD: 'test',
};
const migration = spawnSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
  env,
  stdio: 'inherit',
});
assert.equal(migration.status, 0);
const child = spawn(process.execPath, ['dist/src/main.js'], {
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
child.stdout.on('data', (data) => {
  logs += data;
});
child.stderr.on('data', (data) => {
  logs += data;
});
const sockets = [];
async function request(path, session, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(api + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
      ...(session?.cookie ? { Cookie: session.cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return {
    status: response.status,
    data,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}
async function ok(path, session, body, method) {
  const result = await request(path, session, body, method);
  assert(
    result.status < 400,
    `${path}: ${result.status} ${JSON.stringify(result.data)}`,
  );
  return result;
}
try {
  for (let i = 0; i < 100; i++) {
    assert(child.exitCode === null, `API exited: ${logs}`);
    try {
      if ((await fetch(api + '/users/me')).status === 401) break;
    } catch {}
    if (i === 99) throw new Error(`API startup timeout: ${logs}`);
    await delay(100);
  }
  const users = [];
  for (const name of ['Alice', 'Bob', 'Carol', 'Dave']) {
    const result = await ok('/auth/register', null, {
      firstName: name,
      email: `${randomUUID()}@example.test`,
      password: 'Release123!',
      confirmPassword: 'Release123!',
    });
    const session = { ...result.data, cookie: result.cookie };
    assert(session.cookie, 'refresh cookie');
    assert.equal((await ok('/users/me', session)).data.firstName, name);
    assert.equal((await ok('/relationship/couple', session)).data, '');
    users.push(session);
  }
  await ok('/storage/images/users%2Frelease%2Fimages%2Ftest.png', users[0]);
  for (const [a, b] of [
    [0, 1],
    [2, 3],
  ]) {
    const invite = await ok('/relationship/invite', users[a], {});
    await ok(`/relationship/invite/${invite.data.token}/accept`, users[b], {});
    assert((await ok('/relationship/couple', users[a])).data.partnerId);
  }
  const connect = async (session) => {
    const socket = io(api, {
      auth: { token: session.accessToken },
      transports: ['websocket'],
      reconnection: false,
    });
    sockets.push(socket);
    await Promise.race([
      once(socket, 'connect'),
      delay(5000).then(() => {
        throw new Error('WS connect timeout');
      }),
    ]);
    return socket;
  };
  let socket = await connect(users[0]);
  const payload = {
    clientId: randomUUID(),
    type: 'TEXT',
    content: 'Release runtime message',
  };
  const ack = await socket.timeout(5000).emitWithAck('chat:send', payload);
  assert(ack.messageId, JSON.stringify(ack));
  const duplicate = await ok('/chat/messages', users[0], payload);
  assert.equal(duplicate.data.id, ack.messageId);
  assert.equal(
    (
      await request(
        `/chat/messages/${ack.messageId}`,
        users[2],
        { content: 'forbidden' },
        'PATCH',
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        `/chat/messages/${ack.messageId}`,
        users[1],
        { content: 'forbidden' },
        'PATCH',
      )
    ).status,
    404,
  );
  socket.disconnect();
  await ok('/chat/messages', users[1], {
    ...payload,
    clientId: randomUUID(),
    content: 'While disconnected',
  });
  socket = await connect(users[0]);
  const history = await ok('/chat/messages', users[0]);
  assert(JSON.stringify(history.data).includes('While disconnected'));
  await ok('/boards', users[0]);
  const column = await ok('/boards/columns', users[0], { title: 'Runtime' });
  const columnId = column.data.id;
  const task = await ok('/tasks', users[0], {
    title: 'Runtime task',
    columnId,
    assigneeMode: 'BOTH',
  });
  await Promise.all([
    ok(`/tasks/${task.data.id}/complete`, users[0], {}),
    ok(`/tasks/${task.data.id}/complete`, users[1], {}),
  ]);
  assert.equal(
    (await ok(`/tasks/${task.data.id}`, users[0])).data.completed,
    true,
  );
  await ok(`/tasks/${task.data.id}`, users[0], undefined, 'DELETE');
  const event = await ok('/graphql', users[0], {
    query:
      'mutation($input: CreateEventInput!) { createEvent(input: $input) { id title } }',
    variables: {
      input: {
        title: 'Runtime event',
        startAt: new Date().toISOString(),
        type: 'OTHER',
        scope: 'COUPLE',
        allDay: false,
        repeat: 'NONE',
      },
    },
  });
  assert(!event.data.errors, JSON.stringify(event.data));
  const race = await Promise.all([
    request('/auth/refresh', users[0], {}),
    request('/auth/refresh', users[0], {}),
  ]);
  assert.deepEqual(race.map((r) => r.status).sort(), [200, 401]);
  const next = race.find((r) => r.status === 200);
  const refreshed = { ...next.data, cookie: next.cookie };
  await ok('/auth/logout', refreshed, {});
  assert.equal((await request('/auth/refresh', refreshed, {})).status, 401);
  assert(!logs.includes('Unsupported route path'), 'Named storage wildcard');
  console.info(
    'Runtime PASS: production API start, four users/two pairs, HTTP auth/profile, refresh race/logout, real WS send/dedupe/reconnect, workspace isolation, Todo BOTH, GraphQL calendar. Storage and push transport are not exercised.',
  );
} finally {
  for (const socket of sockets) socket.disconnect();
  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM');
    await once(child, 'exit');
  }
  await new Promise((resolve) => storage.close(resolve));
}
