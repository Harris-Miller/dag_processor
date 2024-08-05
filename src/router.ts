import { Elysia } from 'elysia';

const app = new Elysia();

app.get('/id/:id', ({ params: { id } }) => id);

app.get('/', () => 'Hello Elysia');

export { app };
