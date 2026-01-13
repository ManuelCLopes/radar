import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

export const logger = winston.createLogger({
    level: 'info',
    format: json(),
    transports: [
        new winston.transports.Console({
            format: process.env.NODE_ENV === 'production'
                ? json()
                : combine(
                    colorize(),
                    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    logFormat
                ),
        }),
    ],
});

export function log(message: string, source = "express") {
    logger.info(`[${source}] ${message}`);
}
