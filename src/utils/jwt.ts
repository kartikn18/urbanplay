import jwt from "jsonwebtoken";
export const generateRefreshToken = (userid:number,role:string)=>{
    const refreshToken = jwt.sign({userid,role},String(process.env.REFRESH_TOKEN_SECRET),{expiresIn:"7d"})
    return refreshToken;
}
export const generateAccessToken = (userid:number,role:string)=>{
    const accesstoken = jwt.sign({userid,role},String(process.env.ACCESS_TOKEN_SECRET),{expiresIn:"15m"})
    return accesstoken;
}
