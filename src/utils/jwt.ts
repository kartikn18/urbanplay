import jwt from "jsonwebtoken";
export const generateRefreshToken = (userid:number)=>{
    const refreshToken = jwt.sign({userid},String(process.env.REFRESH_TOKEN_SECRET),{expiresIn:"7d"})
    return refreshToken;
}
export const generateAccessToken = (userid:number)=>{
    const accesstoken = jwt.sign({userid},String(process.env.ACCESS_TOKEN_SECRET),{expiresIn:"15m"})
    return accesstoken;
}
