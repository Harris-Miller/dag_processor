import { Elysia } from 'elysia';

import type { Dag } from './dag/dag';
import { getDag, registerDag } from './dag/registry';

const app = new Elysia();

app
  .get('/:id', ({ params: { id } }) => {
    console.log('GET /:id', id);
    return getDag(id) ?? 'Error!';
  })
  .post('/', ({ body }) => {
    console.log('POST /', body);
    return registerDag((body as { data: Dag }).data);
  });

export { app };
