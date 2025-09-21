// Error handling middleware (NF-01: Layered architecture)
const errorMiddleware = {
  // 404 Not Found handler
  notFound: (req, res, next) => {
    // Skip logging for Chrome DevTools and other automated requests
    const ignoredPaths = [
      '/.well-known/',
      '/favicon.ico',
      '/robots.txt',
      '/apple-touch-icon',
      '/browserconfig.xml'
    ];
    
    const shouldIgnore = ignoredPaths.some(path => req.originalUrl.startsWith(path));
    
    if (shouldIgnore) {
      // Silently return 404 without logging
      return res.status(404).end();
    }
    
    const error = new Error(`Pagina niet gevonden - ${req.originalUrl}`);
    error.status = 404;
    next(error);
  },

  // General error handler
  errorHandler: (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Er is een onverwachte fout opgetreden';
    
    // Skip logging for Chrome DevTools and other automated requests
    const ignoredPaths = [
      '/.well-known/',
      '/favicon.ico',
      '/robots.txt',
      '/apple-touch-icon',
      '/browserconfig.xml'
    ];
    
    const shouldIgnoreLogging = ignoredPaths.some(path => req.originalUrl.startsWith(path));
    
    if (!shouldIgnoreLogging) {
      console.error(`Error ${status}: ${message}`);
      console.error(err.stack);
    }

    // Send error response
    res.status(status);
    
    // Check if it's an API request
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({
        error: {
          status,
          message
        }
      });
    } else {
      // Render error page
      res.render('error', {
        title: 'Fout',
        status,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
      });
    }
  },

  // Async error wrapper (NF-02: DRY principle)
  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
};

module.exports = errorMiddleware;
