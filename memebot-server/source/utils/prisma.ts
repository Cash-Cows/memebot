//make sure there is only one prisma instance going around
import { 
  PrismaClient, 
  Prisma, 
  Source as SourceType, 
  Consumer as ConsumerType,
  Search as SearchType,
  Meme as MemeType
} from '@prisma/client';

const prisma = new PrismaClient();

export { prisma, Prisma, SourceType, ConsumerType, SearchType, MemeType };