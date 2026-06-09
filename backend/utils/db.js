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

const prisma = basePrisma.$extends({
  query: {
    user: {
      async findUnique({ model, operation, args, query }) {
        args.where = args.where || {};
        args.where.isDeleted = false;
        return basePrisma.user.findFirst(args);
      },
      async findFirst({ model, operation, args, query }) {
        args.where = args.where || {};
        args.where.isDeleted = false;
        return query(args);
      },
      async findMany({ model, operation, args, query }) {
        args.where = args.where || {};
        args.where.isDeleted = false;
        return query(args);
      },
      async count({ model, operation, args, query }) {
        args.where = args.where || {};
        args.where.isDeleted = false;
        return query(args);
      },
    },
    session: {
      async findUnique({ model, operation, args, query }) {
        args.where = args.where || {};
        args.where.isDeleted = false;
        return basePrisma.session.findFirst(args);
      },
      async findFirst({ model, operation, args, query }) {
        args.where = args.where || {};
        args.where.isDeleted = false;
        return query(args);
      },
      async findMany({ model, operation, args, query }) {
        args.where = args.where || {};
        args.where.isDeleted = false;
        return query(args);
      },
      async count({ model, operation, args, query }) {
        args.where = args.where || {};
        args.where.isDeleted = false;
        return query(args);
      },
      async aggregate({ model, operation, args, query }) {
        args.where = args.where || {};
        args.where.isDeleted = false;
        return query(args);
      },
    },
  },
});

module.exports = prisma;
