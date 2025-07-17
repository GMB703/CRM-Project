import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

interface ValidationRule {
  type: 'string' | 'number' | 'boolean';
  required?: boolean;
  optional?: boolean;
}

interface ValidationSchema {
  body?: Record<string, ValidationRule>;
  query?: Record<string, ValidationRule>;
  params?: Record<string, ValidationRule>;
}

export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        validateObject(req.body, schema.body, 'body');
      }
      if (schema.query) {
        validateObject(req.query, schema.query, 'query');
      }
      if (schema.params) {
        validateObject(req.params, schema.params, 'params');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

function validateObject(
  data: any,
  rules: Record<string, ValidationRule>,
  location: string
) {
  for (const [field, rule] of Object.entries(rules)) {
    if (rule.required && !data[field]) {
      throw new BadRequestError(`${field} is required in ${location}`);
    }

    if (data[field] !== undefined && data[field] !== null) {
      const value = data[field];
      const type = typeof value;

      if (type !== rule.type) {
        throw new BadRequestError(
          `${field} in ${location} must be of type ${rule.type}`
        );
      }
    }
  }
} 