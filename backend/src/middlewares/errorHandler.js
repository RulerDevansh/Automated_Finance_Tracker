export const notFound = (req, res, next) => {
  const err = new Error('Route not found');
  err.status = 404;
  next(err);
};

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || undefined;

  console.error(`[${req.method}] ${req.originalUrl} ->`, err);

  res.status(status).json({
    status,
    message,
    details
  });
};
