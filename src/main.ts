import process from 'node:process';

import { redisClient } from './redis';
import { app } from './router';

app.listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

process.on('exit', () => {
  redisClient.disconnect();
});
