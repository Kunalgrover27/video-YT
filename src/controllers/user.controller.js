import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErros.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens= async(userId) =>{
    try {
        const user= await User.findById(userId)
        const accessToken= user.generateAccessToken()
        const refreshToken= user.generateRefreshToker()

        user.refreshToken=refreshToken
        await user.save({validationBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while tokens")
        
    }
}


const registerUser = asyncHandler( async(req,res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    console.log(req.body);
    const{fullName, email, username, password} = req.body;

    if(
        // try doing below without some instead use for-each
        [fullName, email, username, password].some((field)=> field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }
    // try by separate checking 
    const exist= await User.findOne({
        $or: [{ username },{ email }]
    })

    if(exist){
        throw new ApiError(409,"user already exists")
    }
    // file multer
    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
     coverImageLocalPath= req.files.coverImage[0].path;
    }   


    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required22")
    }

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        coverImage: coverImage?.url || "",
        avatar: avatar.url,
        email,
        password,
        username
    })
    // to remove pass and referesh token
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

}

)

const loginUser = asyncHandler( async(req,res) =>{
    //req body
    //username or email
    //find user
    // password check
    //tokens
    //cookie

    const{email, username, password} = req.body

    if(!username || !email){
        throw new ApiError(400,"username or email is required")
    }

    const user= await User.findOne({
        $or: [{email},{username}]
    })

    if(!user){
        throw new ApiError(401,"does not exist")
    }

    const isPasswordValid= await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken}= await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: LoggedInUser, accessToken, refreshToken
            },
            "user is Loggen In"

        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})
 

export {registerUser,
        loginUser,
        logoutUser
    }