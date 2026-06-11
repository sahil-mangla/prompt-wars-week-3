import { redactPII, piiRedactorMiddleware } from '../api/middleware/security';

describe('Security & PII Shield Verification Tests', () => {

  describe('PII Redactor Helper Function', () => {
    it('should redact email addresses in string payloads', () => {
      const input = "User email is test.user@gmail.com and password was safe.";
      const result = redactPII(input);
      expect(result).toContain('[EMAIL_REDACTED]');
      expect(result).not.toContain('test.user@gmail.com');
    });

    it('should redact phone numbers in strings', () => {
      const input = "Call me at +1-555-019-2834 or +91 9999988888";
      const result = redactPII(input);
      expect(result).toContain('[PHONE_REDACTED]');
      expect(result).not.toContain('555-019-2834');
    });

    it('should redact credit cards in strings', () => {
      const input = "Visa card is 4111 1111 1111 1111.";
      const result = redactPII(input);
      expect(result).toContain('[CARD_REDACTED]');
      expect(result).not.toContain('4111 1111 1111 1111');
    });

    it('should recursively scan nested objects and arrays', () => {
      const payload = {
        name: "Karan",
        details: {
          email: "karan@example.com",
          contacts: ["9876543210", "karan.office@mail.in"]
        }
      };

      const result = redactPII(payload);
      expect(result.details.email).toBe('[EMAIL_REDACTED]');
      expect(result.details.contacts[0]).toBe('[PHONE_REDACTED]');
      expect(result.details.contacts[1]).toBe('[EMAIL_REDACTED]');
    });
  });

  describe('PII Middleware REST Integration', () => {
    it('should intercept POST requests and redact PII in body payload', () => {
      const req = {
        body: {
          userId: 'test-user@gmail.com', // PII email
          habitId: 'h1'
        },
        query: {},
        params: {}
      } as any;
      const res = {} as any;
      const next = jest.fn();

      piiRedactorMiddleware(req, res, next);

      expect(req.body.userId).toBe('[EMAIL_REDACTED]');
      expect(next).toHaveBeenCalled();
    });
  });
});
