const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Prisma v7 with prisma-client-js requires a driver adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Prevent multiple instances in development (hot-reload safe)
const globalForPrisma = global;

const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
    log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

module.exports = prisma;
