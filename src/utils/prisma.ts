//make sure there is only one prisma instance going around
import { PrismaClient, Prisma, Source } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma, Prisma, Source };