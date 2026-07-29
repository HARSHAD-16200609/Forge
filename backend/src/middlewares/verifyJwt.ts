import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { BadRequestError, UnauthorizedAccessError } from "../utility/errorHandling/customErrors"
import { env } from "../config/env"
import { prisma } from "../config/prisma"
import { verifyAccessToken } from "../utility/auth/jwt"



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


  const user = await verifyAccessToken(token)

  if (!user) throw new BadRequestError("Unauthorized Access Please Login First")

  req.user = { userId: user.id, username: user.username , sessionId: user.sessionId ?? ""}


  next()
}


