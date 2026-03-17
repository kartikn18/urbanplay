import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                role: string;
            };
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authheader = req.headers.authorization;
    const token = authheader && authheader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Access token missing" });
    }
    try {
        const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || '') as { userId: number, role: string };
        req.user = { id: decode.userId, role: decode.role }; 
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid access token" });
    }
};