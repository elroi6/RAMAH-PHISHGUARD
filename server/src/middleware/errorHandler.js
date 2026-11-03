const errorHandler = (err, req, res, next) => {
  console.error("Server error:", err.message);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message,
  });
};

export default errorHandler;