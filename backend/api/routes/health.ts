import { Router, Request, Response } from 'express';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'habitloop-backend',
    version: '0.1.0'
  });
});

export default router;
