export const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200, pagination = null) => {
  const response = {
    success: true,
    status: 'success',
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

export const sendError = (res, message = 'Something went wrong', statusCode = 500, errorCode = 'INTERNAL_ERROR', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors,
  });
};
