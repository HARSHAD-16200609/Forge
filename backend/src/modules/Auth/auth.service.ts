import { StatusCodes } from "http-status-codes";
import { Prisma } from "../../../generated/prisma/client";
import { loginSchema, loginUserInput, registerSchema, registerUserInput } from "../../db/auth-schema";
import { authRepository } from "./auth.repository"
import bcrypt from "bcryptjs";
import { ApiError } from "../../utility/errorHandling/ApiError";
import { prisma } from "../../config/prisma";
import { BadRequestError, UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import type { loginInput } from "../../types/auth"
import { genJwtToken } from "../../utility/auth/jwt";
import { env } from "../../config/env";
import { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken"

class AuthService {

    async Register(User: registerUserInput) {
      
        const { username, password, email } = User


        const existingUser = await authRepository.findUserByUsernameorEmail(username, email)

        if (existingUser) {
            throw new ApiError(StatusCodes.CONFLICT, "User Already Exist's")
        }
        const hashedPass = await bcrypt.hash(password, 12)

        try {
              User.password = hashedPass
            const user = await authRepository.createUser(User)

            return user
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
                throw new ApiError(StatusCodes.CONFLICT, "User already exists");
            }
            throw err;
        }

    }
    async Login(User: loginUserInput) {
    
        const { username, password, email } = User
        const identifier = username ?? email ?? "";

        if (identifier.trim().length === 0) throw new BadRequestError("Please Enter Username Or Email")

        const existingUser = await authRepository.findUserForLogin(identifier)


        if (!existingUser) {
            throw new ApiError(StatusCodes.NOT_FOUND, "Invalid Credentials !!!")
        }

        const match = await bcrypt.compare(password, existingUser.password)
        if (!match) {
            throw new UnauthorizedAccessError("Invalid Credentials !!!")
        }
        const accessToken = genJwtToken({ userId: existingUser.id, username: existingUser.username! }
            , env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
            env.JWT_SECRET)

        const refreshToken = genJwtToken({ userId: existingUser.id, username: existingUser.username! }, env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"], env.REFRESH_TOKEN_SECRET)
        const refreshTokenHash = await bcrypt.hash(refreshToken, 12)

        const sessionInfo = {
            email: existingUser.email,
            userId: existingUser.id,
            refreshToken, accessToken
        }
        try {
            const session = {
                userId: existingUser.id,
                refreshToken: refreshTokenHash,
                expiresAt: new Date(Date.now() + Number((env.REFRESH_TOKEN_EXPIRES_IN).split("d")[0]) * 24 * 60 * 60 * 1000),
                createdAt: new Date()
            }
            await authRepository.createSession(session)

            return sessionInfo
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                throw new ApiError(StatusCodes.CONFLICT, "Already Logged In")
            }
            return 
        }

    }

async Refresh(Cookies : Record<string,any> ){
     const {refreshToken} = Cookies
         if(!refreshToken){
           throw new UnauthorizedAccessError("Invalid Token")
         }
      const decoded = jwt.verify(refreshToken,env.REFRESH_TOKEN_SECRET) as jwtPayload
    
      
      const session = await prisma.session.findFirst({
 where :{
    userId : decoded.userId
  },
  select:{
    refreshToken:true
  }
}) 

if(!session){
   throw new UnauthorizedAccessError("Invalid Token")
}
 const valid =await bcrypt.compare(refreshToken,session.refreshToken)
   if(!valid){
 throw new UnauthorizedAccessError("Invalid Token")

   } 
   
   const accessToken = genJwtToken({userId:decoded.userId,username:decoded.username},env.JWT_EXPIRES_IN as SignOptions["expiresIn"],env.JWT_SECRET)

   return accessToken
     
}
async Logout(userId :string){
  
    try{
           await prisma.session.delete({
    where: {
      userId
    }
  })
    }
   catch(err){
    if(err instanceof  Prisma.PrismaClientKnownRequestError && err.code === "P2025"){
        throw new ApiError(404,"Record not Found")
    }
    return
   }
}

}

export const authService = new AuthService()