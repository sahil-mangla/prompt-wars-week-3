import { Request, Response, NextFunction } from 'express';

// Regular expressions to detect common PII types
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g
};

/**
 * Deeply scans and redacts PII strings within any object/array structure.
 */
export function redactPII(val: any): any {
  if (typeof val === 'string') {
    let sanitized = val;
    sanitized = sanitized.replace(PII_PATTERNS.email, '[EMAIL_REDACTED]');
    sanitized = sanitized.replace(PII_PATTERNS.phone, '[PHONE_REDACTED]');
    sanitized = sanitized.replace(PII_PATTERNS.creditCard, '[CARD_REDACTED]');
    sanitized = sanitized.replace(PII_PATTERNS.ssn, '[SSN_REDACTED]');
    return sanitized;
  } else if (Array.isArray(val)) {
    return val.map(item => redactPII(item));
  } else if (val !== null && typeof val === 'object') {
    const redactedObj: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      redactedObj[key] = redactPII(val[key]);
    }
    return redactedObj;
  }
  return val;
}

/**
 * Middleware that automatically redacts PII from request body, query parameters, and parameters.
 */
export function piiRedactorMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = redactPII(req.body);
  }
  if (req.query) {
    req.query = redactPII(req.query);
  }
  if (req.params) {
    req.params = redactPII(req.params);
  }
  next();
}
