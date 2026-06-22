import {Request , Response , NextFunction} from "express"

export type AsyncFunc  = (
req : Request,
res :Response,
next :NextFunction

)=> Promise<any>;


export const asyncHandler = (fn: AsyncFunc) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err)=>{ next(err)});
  };
};