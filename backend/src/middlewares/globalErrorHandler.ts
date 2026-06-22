import { Request,Response , NextFunction } from "express";
import { ApiError } from "../utility/errorHandling/ApiError";

export function globalErrorMiddleware(err:Error,req:Request,res:Response,next :NextFunction){
 if(err instanceof ApiError){
      return res.status(err.statusCode).json({
        status:err.statusCode,
            message : err.message,
             ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
    })
    

        })
    }
else{
     return res.status(500).json({
            status:500,
            message : "INTERNAL_SERVER_ERROR"
        })
}
}