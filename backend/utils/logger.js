const winston = require('winston');

// Determine log level based on environment
// Development outputs 'debug' and above; Production outputs 'warn' and above.
const level = process.env.NODE_ENV === 'development' ? 'debug' : 'warn';

const logger = winston.createLogger({
  level: level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

module.exports = logger;
