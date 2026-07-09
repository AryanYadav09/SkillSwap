const ApiError = require("../utils/apiError");

const notFoundHandler = (_req, _res, next) => {
  next(new ApiError(404, "Resource not found"));
};

const errorHandler = (error, _req, res, _next) => {
  if (error.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A unique field already exists",
      details: error.meta,
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Requested record was not found",
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Something went wrong";

  return res.status(statusCode).json({
    success: false,
    message,
    details: error.details || null,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
