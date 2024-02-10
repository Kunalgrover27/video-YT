import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name || !description){
        throw new ApiError(300,"name and description required")
    }
    
    const exist= await Playlist.findOne({
        name:name,
        })

        if(exist){
            throw new ApiError(200,"playlist with same name already exists");
        }

    const playlist= await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });
    if (!playlist) {
        throw new ApiError(500, "failed to create playlist");
    }

    return res.status(200)
    .json(new ApiResponse(200,"playlist created successfully"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const playlistaggregate= await Playlist.aggregate([
        {
            $match:{
                owner:  new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            },
        },
        {
            $addFields: {
                videosCount: {
                    $size: "$videos",
                },
                totalviews: {
                    $sum: "$videos.views"
                }
            }       
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                videosCount: 1,
                updatedAt: 1
            }
        }
    ]);
    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched successfully"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const valid= await Playlist.isValidObjectId(playlistId);

    if(! valid){
        throw new ApiError(200,"playlist Id is invalid");
    }
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const playlistVideos= await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId),
            }
        },
        {
            $Lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            },
        },
        {
            $match:{
                "videos.isPublished": true
            },
        },
        {
            $Lookup:{
                from: "Users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            },
        },{
            $addFields:{
                totalVideos:{
                    $size: "$videos",
                },
                totalviews:{
                    $sum: "$videos.views"
                },
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalviews: 1,
                owner:{
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1
                },
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1
                }
               
            }
        }
    ]);
    return res
    .status(200)
    .json(new ApiResponse(200, playlistVideos[0], "playlist fetched successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    const playlist= await Playlist.findById(playlistId);
    const video= await Video.findById(videoId);

    if(! playlist || ! video){
        throw new ApiError(200,"playlist or video is not present");
    }

    const alreadypresent= await Playlist.findOne({
        video:videoId,
    })

    if(alreadypresent){
        return res.status(200)
        .json(new ApiResponse(200,"video is already present in playlist"));
    }

    if (
        (playlist.owner?.toString() && video.owner.toString()) !==
        req.user?._id.toString()
    ) {
        throw new ApiError(400, "only owner can add video to thier playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet: {
                videos: videoId,
            },
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(
            400,
            "failed to add video to playlist please try again"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Added video to playlist successfully"
            )
        );

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    const playlist= await Playlist.findById(playlistId);
    const video= await Video.findById(videoId);

    if(! playlist || ! video){
        throw new ApiError(200,"playlist or video is not present");
    }
    if (
        (playlist.owner?.toString() && video.owner.toString()) !==
        req.user?._id.toString()
    ) {
        throw new ApiError(400, "only owner can add video to thier playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId,
            },
        },
        { new: true }
    );
    
    if (!updatedPlaylist) {
        throw new ApiError(
            400,
            "failed to add video to playlist please try again"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Added video to playlist successfully"
            )
        );

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    
        if (!isValidObjectId(playlistId)) {
            throw new ApiError(400, "Invalid PlaylistId");
        }
    
        const playlist = await Playlist.findById(playlistId);
    
        if (!playlist) {
            throw new ApiError(404, "Playlist not found");
        }
    
        if (playlist.owner.toString() !== req.user?._id.toString()) {
            throw new ApiError(400, "only owner can delete the playlist");
        }
    
        await Playlist.findByIdAndDelete(playlist?._id);
    
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    playlist,
                    "playlist updated successfully"
                )
            );
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!name || !description) {
        throw new ApiError(400, "name and description both are required");
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit the playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set: {
                name,
                description,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "playlist updated successfully"
            )
        );
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}