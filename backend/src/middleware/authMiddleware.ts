import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('⚠️  AVERTISSEMENT SÉCURITÉ: JWT_SECRET non défini dans .env — utilisation du secret de fallback. NE PAS UTILISER EN PRODUCTION.');
}

const EFFECTIVE_SECRET = JWT_SECRET || 'safetrip_super_secret_key_2026';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentification requise. Veuillez vous connecter.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, EFFECTIVE_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré. Veuillez vous reconnecter.' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: `Accès refusé. Rôle requis: ${roles.join(' ou ')}.` });
      return;
    }
    next();
  };
}
