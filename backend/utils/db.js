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

const prisma = basePrisma;

prisma.$use(async (params, next) => {
  const softDeleteModels = ['User', 'Session']; // add any other soft-deleted models
  
  if (softDeleteModels.includes(params.model)) {
    params.args = params.args || {};
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.action = 'findFirst';
      params.args.where = { ...params.args.where, isDeleted: false };
    }
    if (params.action === 'findMany') {
      params.args.where = { ...params.args.where, isDeleted: false };
    }
    if (params.action === 'count') {
      params.args.where = { ...params.args.where, isDeleted: false };
    }
  }
  
  return next(params);
});

module.exports = prisma;
