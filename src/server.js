import { createServer } from 'node:http';
import { createApp } from './app.js';

const port = process.env.PORT || 3000;
createServer(createApp()).listen(port, () => {
  console.log(`server listening on ${port}`);
});
