export function asyncHandler(fn) {
  return function asyncHandlerWrapper(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function sendError(res, status, message, details) {
  const payload = { error: message };
  if (details !== undefined) payload.details = details;
  return res.status(status).json(payload);
}
