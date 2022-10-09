import { PrismaClient, Prisma, Source, Consumer, Search, Meme } from '@prisma/client';
declare const prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
export { prisma, Prisma, Source, Consumer, Search, Meme };
