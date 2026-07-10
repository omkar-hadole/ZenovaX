// AWS Lambda entry point.
// Wraps the existing Express app (server.js) so it can run behind API Gateway.
// The Express app itself is unchanged — serverless-http translates the Lambda
// event <-> req/res for us, so every existing route keeps working as-is.
require("./utils/vercel-nft-fix.js");
const serverless = require("serverless-http");
const app = require("./server.js");

// Binary media types must be passed through as Buffers (e.g. profile-picture
// uploads handled by multer.memoryStorage). Everything else is treated as text.
const handler = serverless(app, {
  binary: [
    "multipart/form-data",
    "image/*",
    "application/octet-stream",
  ],
});

// Lambda re-uses the container across invocations, so the Prisma client and any
// warm connections persist between requests (good for cold-start amortization).
module.exports.handler = async (event, context) => {
  // Let the DB connection be re-used across invocations instead of being torn
  // down when the event loop empties.
  context.callbackWaitsForEmptyEventLoop = false;
  return handler(event, context);
};
