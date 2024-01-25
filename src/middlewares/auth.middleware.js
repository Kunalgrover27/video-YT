import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErros.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(rea,res,next) => {
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log(token);
        if(!token){
            throw new ApirError(401,"unauthorized request")
        }
        // for github repo
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401,"Invalid access token")
    }
})