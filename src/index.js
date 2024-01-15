import dotenv from "dotenv"
import { app } from "./app.js";
import connectDB from "./db/index.js";


dotenv.config()

 connectDB()
 .then(()=>{
    app.listen(process.env.Port || 8000,()=>{
        console.log(`server is running on : ${process.env.PORT}`)
    })
 })
 .catch((err)=>{
    console.log("MONGO db connection failed", err)
 })


//just trying to check if I could commit a comment too
// import express from "express"
// import { DB_Name } from "./constants.js"
// const app = express()
// ( async () => {
//     try {
//         await mongoose.connect(`$mongodb+srv://kunalgrover2704:Kunal@123@cluster0.cygx40v.mongodb.net/${DB_Name}`)
//         app.on("errror", (error) => {
//             console.log("ERRR: ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port `);
//         })

//     } catch (error) {
//         console.error("ERROR: ", error)
//         throw err
//     }
// })()
