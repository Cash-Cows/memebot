//make sure there is only one prisma instance going around
import { 
  PrismaClient, 
  Prisma, 
  Source, 
  Consumer,
  Search,
  Meme
} from '@prisma/client';

const prisma = new PrismaClient();

export { prisma, Prisma, Source, Consumer, Search, Meme };