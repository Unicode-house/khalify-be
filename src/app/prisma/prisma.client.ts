// prisma.client.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString:
    process.env.DIRECT_URL 
});

console.log(process.env.DIRECT_URL);

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});
