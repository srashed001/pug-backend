class ExpressError extends Error {
  constructor(message, status) {
    super();
    this.message = message;
    this.status = status;
  }
}

// 404 NOT FOUND error

class NotFoundError extends ExpressError {
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

// 401 UNAUTHORIZED error

class UnauthError extends ExpressError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}
// 400 BAD REQUEST error

class BadRequestError extends ExpressError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}
// 401 FORBIDDEN error

class ForbiddenError extends ExpressError {
  constructor(message = "Unauthorized") {
    super(message, 403);
  }
}

class InactiveError extends ExpressError {
  constructor(message = "Account is currently disabled"){
    super(message, 403)
  }

}

module.exports = {
  ExpressError,
  NotFoundError,
  UnauthError,
  BadRequestError,
  ForbiddenError,
  InactiveError
};
