import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req:Request, res:Response, next:NextFunction) => {
    const authheader = req.headers.authorization;
    const token = authheader && authheader.split(" ")[1];
    if(!token){
        return res.status(401).json({
            message:"Access token missing"
        })
    }
    try {
        const decode = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET || '') as {userId:number};
        req.body.userId = decode.userId;
        next();
    } catch (error) {
        return res.status(403).json({
            message:"Invalid access token"
        })
    }
};