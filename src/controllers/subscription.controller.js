import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const valid= await isValidObjectId(channelId);

    if(!valid){
        throw new ApiError(300,"channelId not valid");
        }

    const ifalreadysubs= await Subscription.findOne({
        subscriber: req.user?._id,
        channel:channelId,
    })
    if(ifalreadysubs){
        await Subscription.findByIdAndDelete(ifalreadysubs?._id);

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: false },
                "unsunscribed successfully"
            )
        );
}    

    const subs= await Subscription.create({
        subscriber: req.user?._id,
        channel:channelId,
    })   
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            { subscribed: true },
            "subscribed successfully"
        )
    );
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(! isValidObjectId(channelId)){
        throw new ApiError(200,"user id not found")
    }
    const subscribers= await Subscription.aggregate([
        {
            $match:{
                channel:channelId,
            }
        },
        {
            $lookup:{
                from: "users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers"

            }
        },
        {
            $addFields: {
            subscribersCount: {
                $size: "$subscribers",
            },
            }
        },   
        {
            '$unwind': '$channelSubscribers'
        }, {
            '$replaceRoot': {
                'newRoot': '$channelSubscribers'
            }
        }
    ])
    res.status(200).json(
        new ApiResponse(200, channels, "Channel subscribers fetched successfully")
    )
})
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup:{
                from: "users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedTo"

            }
        },
        {
            $addFields: {
                subscriberInfo: { $first: "$subscriberInfo" }
            }
        },
        {
            $project:{
                channelsSubscribedTo:1
            }
        }

    ])    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}