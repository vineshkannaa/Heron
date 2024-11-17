import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    bio:{
        type:String,
        default:""
    },
    email:{
        type:String,
        required:true
    },
    imgURL:{
        type:String,
        default:"https://res.cloudinary.com/djeplonq5/image/upload/v1729526095/Avatar_edcw0g.png"
    }
})

const User=mongoose.model("User",userSchema)

export {
    User
}

