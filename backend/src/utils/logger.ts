import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error',
      dirname: 'logs' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      dirname: 'logs' 
    })
  ]
});

export const logError = (error: any, context: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error({
    message: errorMessage,
    context,
    stack: errorStack,
    timestamp: new Date().toISOString()
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info({
    message,
    ...meta,
    timestamp: new Date().toISOString()
  });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn({
    message,
    ...meta,
    timestamp: new Date().toISOString()
  });
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug({
    message,
    ...meta,
    timestamp: new Date().toISOString()
  });
};

export default logger;
