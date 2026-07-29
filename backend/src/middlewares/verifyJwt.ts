import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { BadRequestError, UnauthorizedAccessError } from "../utility/errorHandling/customErrors"
import { env } from "../config/env"
import { prisma } from "../config/prisma"
import { verifyAccessToken } from "../utility/auth/jwt"
import { setEngine } from "node:crypto"
import { authRepository } from "../modules/Auth/auth.repository"



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


  const payload = await verifyAccessToken(token)


  const session = await authRepository.validateSession(payload.sessionId ?? "")

  if (!session) throw new UnauthorizedAccessError("Session Expired")

  if (session.userId !== payload.userId) throw new UnauthorizedAccessError("Invalid Token")

  req.user = { userId: session.userId, username: session.user.username, sessionId: session.id }


  next()
}


