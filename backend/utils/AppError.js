class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = null, params = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.params = params;
    this.isOperational = true;
  }
}

module.exports = AppError;
