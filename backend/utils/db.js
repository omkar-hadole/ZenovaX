const { PrismaClient } = require('@prisma/client');

let basePrisma;

if (process.env.NODE_ENV === 'production') {
  basePrisma = new PrismaClient({
    log: ['warn', 'error'],
  });
} else {
  // Use global to share the same instance in development (across hot reloads)
  if (!global.basePrisma) {
    global.basePrisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  basePrisma = global.basePrisma;
}

// $use middleware was removed in Prisma 6; soft-delete filtering is now done
// via a query extension (add any other soft-deleted models to all four hooks below).
// `prisma` is referenced inside the hooks before assignment, which is fine because
// the hooks only run later, after the const below has been initialized (closure).
const softDeleteModel = (modelAccessor) => ({
  async findUnique({ args }) {
    // findUnique can't filter on non-unique fields, so redirect to findFirst.
    return prisma[modelAccessor].findFirst({ ...args, where: { ...args.where, isDeleted: false } });
  },
  async findFirst({ args, query }) {
    args.where = { ...args.where, isDeleted: false };
    return query(args);
  },
  async findMany({ args, query }) {
    args.where = { ...args.where, isDeleted: false };
    return query(args);
  },
  async count({ args, query }) {
    args.where = { ...args.where, isDeleted: false };
    return query(args);
  },
});

const prisma = basePrisma.$extends({
  query: {
    user: softDeleteModel('user'),
    session: softDeleteModel('session'),
  },
});

module.exports = prisma;
