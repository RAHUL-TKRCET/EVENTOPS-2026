import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation Error",
      message: "One or more fields failed schema validation.",
      details: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Syntax Errors (e.g. Malformed JSON)
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: "Bad Request",
      message: "Malformed JSON payload.",
      timestamp: new Date().toISOString(),
    });
  }

  // Standard Internal Server Error
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred while processing your request.",
    timestamp: new Date().toISOString(),
  });
}

