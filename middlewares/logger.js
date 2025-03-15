const chalk = require('chalk');
const { formatInTimeZone } = require('date-fns-tz');

function log(req, res, next) {
  const startTime = Date.now();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const logLevel = process.env.BN_LOG_LEVEL || 'debug';

  // Store the original res.end to track response
  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Format timestamp with timezone
    const timestamp = formatInTimeZone(
      new Date(),
      timeZone,
      'MMM dd yyyy HH:mm:ss.SSS zzz'
    );

    const method = chalk.bold(req.method);
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    const statusColor =
            status >= 500
              ? 'red'
              : status >= 400
                ? 'yellow'
                : status >= 300
                  ? 'cyan'
                  : status >= 200
                    ? 'green'
                    : 'white';

    // Get additional useful information
    const userAgent = req.get('user-agent') || '-';
    const contentLength = res.get('content-length') || 0;
    const environment = process.env.BN_SERVER_ENV || 'development';

    // Format duration to be more readable
    const formattedDuration =
            duration < 1000
              ? `${duration}ms`
              : `${(duration / 1000).toFixed(2)}s`;

    // Format content length to be more readable
    const formattedSize =
            contentLength < 1024
              ? `${contentLength}B`
              : `${(contentLength / 1024).toFixed(2)}KB`;

    // Only log based on log level and status code
    const shouldLog =
            logLevel === 'debug' ||
            (logLevel === 'error' && status >= 500) ||
            (logLevel === 'warn' && status >= 400) ||
            (logLevel === 'info' && status < 400);

    if (shouldLog) {
      // Format the log message with better spacing and organization
      console.log(
        chalk.gray(`[${timestamp}]`) +
                    chalk.blue(` [${environment}]`) +
                    ` ${method.padEnd(7)} ${url.padEnd(50)} ` +
                    chalk[statusColor](status.toString().padStart(3)) +
                    chalk.gray(
                      ` ${formattedDuration.padStart(
                        7
                      )} ${formattedSize.padStart(8)} `
                    ) +
                    `"${userAgent}"`
      );
    }

    // Restore original end
    originalEnd.apply(res, arguments);
  };

  // Error handling
  res.on('error', (error) => {
    // Always log errors regardless of log level
    const errorTimestamp = formatInTimeZone(
      new Date(),
      timeZone,
      'MMM dd yyyy HH:mm:ss.SSS zzz'
    );
    const environment = process.env.BN_SERVER_ENV || 'development';

    console.error(
      chalk.red(`[${errorTimestamp}]`) +
                chalk.blue(` [${environment}]`) +
                chalk.red(' [ERROR]'),
      chalk.red(error.message)
    );
  });

  next();
}

module.exports = log;
