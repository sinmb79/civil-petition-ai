import { createApp } from './app';
import { createPrismaClient } from './db/client';
import { PetitionService } from './petition/petitionService';
import { PrismaPetitionRepository } from './repository/prismaPetitionRepository';

const prisma = createPrismaClient();
const repository = new PrismaPetitionRepository(prisma);
const service = new PetitionService(repository);

const app = createApp(service);
const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
