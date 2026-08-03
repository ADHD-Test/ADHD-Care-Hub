import type { NextFunction, Request, Response } from 'express';
import { ZodError, type AnyZodObject } from 'zod';
import { badRequest } from '../lib/errors.js';

type Source = 'body' | 'query' | 'params';

export function validate(schema: AnyZodObject, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req[source] = schema.parse(req[source]) as never;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(badRequest('Check the highlighted fields', error.flatten().fieldErrors));
      }
      next(error);
    }
  };
}
