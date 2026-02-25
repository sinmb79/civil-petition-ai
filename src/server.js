import { createApp } from './app.js';

const server = createApp();
const port = Number(process.env.PORT || 3000);

server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
