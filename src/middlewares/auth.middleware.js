import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiErros";
import { asyncHandler } from "../utils/asyncHandler";


export const verifyJWT = asyncHandler(async(rea,res,next) => {
    try {
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log(token);
        if(!token){
            throw new ApirError(401,"unauthorized request")
        }

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