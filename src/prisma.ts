import { PrismaClient, Prisma, Source } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma, Prisma, Source };