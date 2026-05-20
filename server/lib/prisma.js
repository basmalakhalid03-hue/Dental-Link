const { setupRuntime } = require('./runtime');

setupRuntime();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
