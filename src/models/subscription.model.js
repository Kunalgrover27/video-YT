import mongoose, {Schema} from "mongoose"

const subscriptionSchema= new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,// one who is subscribing
        ref: "User"
    },
    channel:{
        type: Schema.Types.objectId, // whom subscriber is subscribing
        ref: "User"
    }
},{rimestamps: true})


export const Subscription = mongoose.model('Subscription', subscriptionSchema)