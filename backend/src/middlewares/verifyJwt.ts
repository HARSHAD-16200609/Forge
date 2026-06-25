import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { BadRequestError, UnauthorizedAccessError } from "../utility/errorHandling/customErrors"
import { env } from "../config/env"
import { prisma } from "../config/prisma"



export const verifyJwt = async (req: Request, res: Response, next: NextFunction) => {
 
  
   
  const cookieToken = req.cookies.accessToken;

  const bearerToken = req
    .header("Authorization")
    ?.replace("Bearer ", "");

  const token = cookieToken || bearerToken;

  if (!token) {
    throw new UnauthorizedAccessError(
      "Unauthenticated User. Login first."
    );
  }


  try {
    const payload = jwt.verify(
      token,
      env.JWT_SECRET
    ) as jwtPayload;
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId
      }, select: {
        id: true,
        username: true
      }
    })


    if (!user) throw new BadRequestError("Unauthorized Access Please Login First")
    req.user = user

  } catch {
    throw new UnauthorizedAccessError(
      "Invalid or expired access token"
    );
  }








  next()
}

