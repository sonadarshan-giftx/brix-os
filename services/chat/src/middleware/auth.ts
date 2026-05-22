import { Request, Response, NextFunction } from 'express';
import { ParamsFlatDictionary } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export interface AuthRequest extends Request<ParamsFlatDictionary, any, any, any> {
  user?: { id: string; email: string; role: string; };
}

const JWT_SECRET = process.env.JWT_SECRET || 'brixstac-dev-secret';

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'Access token required' }); return; }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId, status: 'ACTIVE' }, select: { id: true, email: true, role: true } });
    if (!user) { res.status(403).json({ error: 'User not found or deactivated' }); return; }
    req.user = user;
    next();
  } catch { res.status(403).json({ error: 'Invalid or expired token' }); }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required' }); return; }
    if (!roles.includes(req.user.role)) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    next();
  };
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { next(); return; }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch { next(); }
}
