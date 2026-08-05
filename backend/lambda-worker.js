// AWS Lambda background-worker entry point.
//
// Serverless functions are frozen after they return, so the Express app can't
// keep a long-lived timer or BullMQ listener alive. Instead this function is
// invoked on a schedule (see BackgroundWorker in template.yaml) and runs one
// complete maintenance pass synchronously: session completion, mentor earnings
// release, stale-booking cancellation, storage cleanup, and a drain of any
// queued badge jobs. It exits when done, which is exactly what a Lambda can be
// asked to do.
const prisma = require("./utils/db");
const { runWorkerPass, drainBadgeQueue } = require("./utils/queue");

exports.handler = async () => {
  await runWorkerPass(prisma);
  const badgesProcessed = await drainBadgeQueue(prisma);

  return {
    success: true,
    maintenancePass: true,
    badgesProcessed,
  };
};