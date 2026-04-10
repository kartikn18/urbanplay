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
        const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { userid: number, role: string };
        req.user = { id: decode.userid, role: decode.role }; 
        next();
    } catch (error) {
        return res.status(403).json({ message: "Invalid access token" });
    }
};
export const checkrole = (role:string[])=>{
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !role.includes(req.user.role)) {
            return res.status(403).json({ message: "You are not authorized to access this resource" });
        }
        next();
    };
}