import { Elysia } from 'elysia';

import type { Dag } from './dag/dag';
import { create, get } from './dag/registry';

const app = new Elysia();

app
  .get('/:id', async ({ params: { id } }) => {
    console.log('GET /:id', id);
    const dagMeta = await get(id);
    return dagMeta ?? 'Error!';
  })
  .post('/', async ({ body }) => {
    console.log('POST /', body);
    const a = await create((body as { data: Dag }).data);
    return a;
  });

export { app };
