import { NextFunction,Request,Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import z from "zod"
import { UnauthorizedAccessError } from "../utility/errorHandling/customErrors"
import { env } from "../config/env"



export const verifyJwt = (req:Request,res:Response,next:NextFunction)=>{

 const cookieToken = req.cookies?.acessToken;

const bearerToken = req
  .header("Authorization")
  ?.replace("Bearer ", "");

const token = cookieToken || bearerToken;

if (!token) {
  throw new UnauthorizedAccessError(
    "Unauthenticated User. Login first."
  );
}

     const verify = jwt.verify(token,env.JWT_SECRET) as JwtPayload
     req.user = verify
  

     next()
}