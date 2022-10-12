import { PrismaClient, Prisma, Source as SourceType, Consumer as ConsumerType, Search as SearchType, Meme as MemeType } from '@prisma/client';
declare const prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
export { prisma, Prisma, SourceType, ConsumerType, SearchType, MemeType };
