import bcrypt from "bcryptjs"
import { Router } from "express"
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import { loginSchema, registerSchema, type registerUserInput } from "../../db/auth-schema"
import { UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { StatusCodes } from "http-status-codes"
import { prisma } from "../../config/prisma"
import { ApiError } from "../../utility/errorHandling/ApiError";
import { Prisma } from "../../../generated/prisma/client";
import { genJwtToken } from "../../utility/auth/jwt";
import { loggers } from "../../utility/logger/serviceLoggers";
import { clearCookieOptions, env, setCookieOptions } from "../../config/env";
import { SignOptions } from "jsonwebtoken";
import { verifyJwt } from "../../middlewares/verifyJwt";
import jwt from "jsonwebtoken"


const userRouter = Router();



userRouter.route("/auth/register").post(asyncHandler(async (req, res) => {
  const result = registerSchema.safeParse(req.body);

  if (result.success) {

    const { username, name, password, email } = result.data

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { userName: username }
        ]
      }, select: {
        id: true
      }
    });

    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, "User Already Exist's")
    }
    const hashedPass = await bcrypt.hash(password, 12)

    try {
      await prisma.user.create({
        data: { name, email, passwordHash: hashedPass, userName: username },
        select: {
          id: true
        }
      });


    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiError(StatusCodes.CONFLICT, "User already exists");
      }
      throw err;
    }
    loggers.auth.info("Registration successful", {
      userName: username,
      email: result.data.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });


    return res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED, { username, email, name }, "User Registered Sucessfully..."))
  }
  else {

    throw new UserInputValidationError("validation-error please check your Entered details", result.error.flatten().fieldErrors)
  }

}))

userRouter.route("/auth/login").post(asyncHandler(async (req, res) => {

  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    throw new UserInputValidationError("Please check your Credentials", result.error.flatten().fieldErrors)
  } else {

    const User = await prisma.user.findFirst({
      where: {
        OR: [
          { email: req.body.email },
          { userName: req.body.username }
        ]
      }, select: {
        id: true,
        passwordHash: true
      }
    });

    if (!User) {
      throw new UnauthorizedAccessError("Invalid Credentials")
    }
    const { password } = result.data
    const match = await bcrypt.compare(password, User.passwordHash)
    if (!match) {
      throw new UnauthorizedAccessError("Invalid Credentials")
    }
    const acessToken = genJwtToken({ userId: User.id, username: result.data.username! }
      , env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
      env.JWT_SECRET)

    const refreshToken = genJwtToken({ userId: User.id, username: result.data.username! }, env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"], env.REFRESH_TOKEN_SECRET)
      const refreshTokenHash = await bcrypt.hash(refreshToken, 12)
    try {
      await prisma.session.create({
        data: {
          userId: User.id,
          refreshToken:refreshTokenHash,
          expiresAt: new Date(Date.now() + Number((env.REFRESH_TOKEN_EXPIRES_IN).split("d")[0]) * 24 * 60 * 60 * 1000),
          createdAt: new Date()
        }
      })
    }
    catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ApiError(StatusCodes.CONFLICT, "Already Logged In")
      }
      return
    }

    loggers.auth.info("Login successful", {
      userId: User.id,
      email: result.data.email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.cookie("accessToken", acessToken, setCookieOptions)
      .cookie("refreshToken", refreshToken, setCookieOptions)
      

    res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {
      sucess: true,
    }, "User Logged in Sucessfully"))

  }

}))

userRouter.route("/auth/logout").post(verifyJwt, asyncHandler(async (req, res) => {

console.log(req.user.userId)
  await prisma.session.delete({
    where: {
      userId: req.user.userId
    }
  })

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production"
  }).clearCookie("refreshToken",clearCookieOptions)
  


  res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK, {}, "Logged Out Sucessfully"))

}))

userRouter.route("/auth/refresh").post(verifyJwt,asyncHandler(async(req,res)=>{
    const refreshToken = req.cookies.refreshToken

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
   res.cookie("accessToken",accessToken,setCookieOptions)
   return res.status(StatusCodes.OK).json(new ApiResponse(StatusCodes.OK,{},"accessToken Generated Sucessfully"))
    
   
   
}))



export { userRouter }