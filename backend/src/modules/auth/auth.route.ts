import bcrypt from "bcryptjs"
import { Router } from "express"
import { asyncHandler } from "../../utility/errorHandling/asyncHandler";
import {loginSchema, registerSchema, type registerUserInput} from "../../db/auth-schema"
import {  UnauthorizedAccessError, UserInputValidationError } from "../../utility/errorHandling/customErrors";
import { ApiResponse } from "../../utility/ApiResponse/ApiResponse";
import { StatusCodes } from "http-status-codes"
import {prisma} from "../../config/prisma"
import { ApiError } from "../../utility/errorHandling/ApiError";
import jwt from "jsonwebtoken"
import { Prisma } from "../../../generated/prisma/client";
import { genJwtToken } from "../../utility/auth/jwt";



const userRouter = Router();



userRouter.route("/auth/register").post(asyncHandler(async(req,res)=>{
const result  = registerSchema.safeParse(req.body);

if(result.success){

    const {username,name,password,email} = result.data

    const existingUser = await prisma.user.findFirst({
  where: {
    OR: [
      { email },
      { userName: username }
    ]
  },select:{
    id:true
  }
   });

  if(existingUser){
    throw new ApiError(StatusCodes.CONFLICT,"User Already Exist's")
   }
    const hashedPass = await bcrypt.hash(password,12)

     try {
      await prisma.user.create({
        data: { name, email, passwordHash: hashedPass, userName: username },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiError(StatusCodes.CONFLICT, "User already exists");
      }
      throw err;
    }

    return res.status(StatusCodes.CREATED).json(new ApiResponse(StatusCodes.CREATED,{username,email,name},"User Registered Sucessfully..."))
}
else { 
  
    throw new UserInputValidationError("validation-error please check your Entered details",result.error.flatten().fieldErrors)
}

}))

userRouter.route("/auth/login").post(asyncHandler(async(req,res)=>{
  
    const result = loginSchema.safeParse(req.body)
    if(!result.success){
        throw new UserInputValidationError("Please check your Credentials",result.error.flatten().fieldErrors)
    }else {
        
 const existingUser = await prisma.user.findFirst({
  where: {
    OR: [
      { email : req.body.email },
      { userName: req.body.username }
    ]
  }
   });

   if(!existingUser){
    throw new UnauthorizedAccessError("Invalid Credentials")
   }
   const {password}= result.data
  const match =  await bcrypt.compare(password,existingUser.passwordHash) 
  if(!match){
    throw new UnauthorizedAccessError("Invalid Credentials")
  }
const acessToken = genJwtToken({userId : existingUser.id,username : existingUser.userName})

const refreshToken = genJwtToken({userId:existingUser.id,username:existingUser.userName},"30d")

res.cookie("acessToken",acessToken,{
   httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 15 * 60 * 1000, 
})

    res.status(200).json({
      sucess:true,
      refreshToken,
      acessToken
    })
      
    }

}))



export {userRouter}