const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
require('dotenv').config();

const globalForPrisma = global;

if (!globalForPrisma.prisma) {
    const adapter = new PrismaNeon({
        connectionString: process.env.DATABASE_URL
    });
    globalForPrisma.prisma = new PrismaClient({
        adapter,
        log: ['error', 'warn']
    });
}

module.exports = globalForPrisma.prisma;