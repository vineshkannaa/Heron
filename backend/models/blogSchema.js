import mongoose from "mongoose";

const blogSchema=new mongoose.Schema({
  title:{
    type:String,
  },
  body:{
    type:String,
  },
  imgURL:{
    type:String
  },
  date: {
    type: Date,
    default: Date.now,
  },
  userId:{
    type:mongoose.SchemaTypes.ObjectId,
    ref:"User",
    required:true
  }
})

const Blogs=mongoose.model("Blogs",blogSchema)

export {
  Blogs
}