export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
} 

/* [STABLE COMPONENT - DO NOT MODIFY]
 * This Error Utilities module is complete and stable.
 * Core functionality:
 * - Custom error classes
 * - Error type differentiation
 * - Standardized error handling
 * 
 * This is a critical error handling component.
 * Changes here could affect all error handling across the application.
 * Modify only if absolutely necessary and after thorough testing.
 */ 