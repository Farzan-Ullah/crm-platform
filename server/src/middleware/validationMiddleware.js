import { AppError } from '../utils/AppError.js';

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign parsed & sanitized values
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      return next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.slice(1).join('.'),
          message: e.message,
        }));

        return next(
          new AppError(
            'Validation failed for one or more fields',
            422,
            'VALIDATION_ERROR',
            formattedErrors
          )
        );
      }
      return next(err);
    }
  };
};
