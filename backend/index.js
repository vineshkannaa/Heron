import express from "express";
import connectDB from "./connection/db.js";
import bcrypt from "bcrypt"
import { User } from "./models/userSchema.js";
import { Blogs } from "./models/blogSchema.js";
import jwt from "jsonwebtoken"
import { jwtAuthorization, cloudinaryUpload } from "./middlewares/index.js";
import multer from "multer";
import cors from "cors"

const upload=multer({dest:'uploads/'})
const app = express()
app.use(express.json())
app.use(cors())

const PORT=process.env.PORT
connectDB()

app.use((req,res,next)=>{
  console.log(req.method)
  next()
})

app.get("/",(req,res)=>{
  res.status(200).json({
    "message":"Healthy server running on port "+PORT
  })
})

app.post("/signup",async (req,res)=>{
  const {username, email, bio, password}= req.body
  if (!username || !email || !password){
    return res.status(400).json({
      "message":"Fields empty"
    })
  }  

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase(), username:username});
  if (existingUser) {
    return res.status(409).json({ message: "User with this email/username already exists" });
  }
  try{
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    const newUser= User.create({
      username:username,
      email:email,
      bio:bio,
      password:hash
    })
    const jwtToken = jwt.sign({ email: newUser.email }, process.env.JWT_SECRET);      
    return res.status(200).json({
      message:"Signed up sucessfully!",
      token:jwtToken
    })  
  }catch(err){
    console.log(err)
    return res.status(400).json({
      message:"Unable to process at this moment!"
    })
  }
})

app.post("/signin",async (req,res)=>{
  const {username, email, password}= req.body
  if ((!username && !email )|| !password){
    return res.status(400).json({
      "message":"Fields empty"
    })
  }  
  try{
    // Check if user already exists
    try{
      let existingUser
      const existingUserWithUsername=await User.findOne({ username:username });
      if(!existingUserWithUsername){
        existingUser=await User.findOne({ email: email });
      }else{
        existingUser=existingUserWithUsername
      }
      const jwtToken = jwt.sign({ email: existingUser.email }, process.env.JWT_SECRET);      
      return res.status(200).json({
        message:"Signed In sucessfully!",
        token:jwtToken
      })
    } catch(err){
      console.log(err)
      return res.status(400).json({
        message:"User not found!"
      })
    }
  }catch(err){
    console.log(err)
    return res.status(400).json({
      message:"Unable to process at this moment!"
    })
  }
})

app.post("/create-post",jwtAuthorization,upload.single('blogPostImage'), async (req,res)=>{
  const {title, body}=req.body
  const blogPostImage=req.file.filename
  const imgURL=await cloudinaryUpload(blogPostImage)
  if(!title || !body){
    return res.status(400).json({
      message:"Fields empty!"
    })
  }
  console.log(title,body,imgURL)
  const email=req.token.email

  try{
    const existingUser=await User.findOne({email:email})
    console.log(existingUser)
    if(existingUser){
      const newPost=await Blogs.create({
        userId:existingUser._id,
        title:title,
        body:body,
        imgURL:imgURL
      }) 
      return res.status(200).json({
        message:"new post created successfully!",
        blogId:newPost._id,
        imgURL:newPost.imgURL
      })
    }
   
  }catch(err){
    console.log(err)
    return res.status(400).json({
      message:"Error creating a post"
    })
  }
})


//chatgpt generated endpoints

// 2. View all blogs by a particular user
app.get("/user/:userId/blogs", async (req, res) => {
  const { userId } = req.params;

  try {
    const blogs = await Blogs.find({ userId }).populate("userId", "username email");
    if (!blogs.length) {
      return res.status(404).json({ message: "No blogs found for this user!" });
    }

    return res.status(200).json({ blogs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving blogs!" });
  }
});

// 3. Delete a blog by its ID
app.delete("/blog/:blogId", jwtAuthorization, async (req, res) => {
  const { blogId } = req.params;

  try {
    const blog = await Blogs.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found!" });
    }
    await blog.deleteOne();
    return res.status(200).json({ message: "Blog deleted successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting blog!" });
  }
});

// 4. Edit a blog by its ID
app.put("/blog/:blogId", jwtAuthorization, async (req, res) => {
  const { blogId } = req.params;
  const { title, body } = req.body;

  if (!title && !body) {
    return res.status(400).json({ message: "No fields to update!" });
  }

  try {
    const blog = await Blogs.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found!" });
    }

    if (title) blog.title = title;
    if (body) blog.body = body;

    await blog.save();

    return res.status(200).json({ message: "Blog updated successfully!", blog });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating blog!" });
  }
});

// 5. View all blogs for all users (tick)
app.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blogs.find().populate("userId", "username email");
    if (!blogs.length) {
      return res.status(404).json({ message: "No blogs found!" });
    }

    return res.status(200).json({ blogs });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving blogs!" });
  }
});

app.get("/my-blogs", jwtAuthorization, async (req, res) => {
  const email = req.token.email;
  try {
    const user = await User.findOne({ email });
    const blogs = await Blogs.find({ userId: user._id });
    res.status(200).json({ blogs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs" });
  }
});

app.get("/getprofile", jwtAuthorization, async (req, res) => {
  const email = req.token.email; // Extract email from the JWT token

  try {
    // Find the user by their email
    const user = await User.findOne({ email }).select("-password"); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Respond with the user's profile
    return res.status(200).json({
      message: "Profile retrieved successfully!",
      profile: {
        username: user.username,
        email: user.email,
        bio: user.bio,
        imgURL: user.imgURL,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error retrieving profile!" });
  }
});

app.put("/upload-bio", jwtAuthorization, async (req, res) => {
  const { bio } = req.body; // Extract bio from request body
  const email = req.token.email; // Extract email from the decoded token

  if (!bio) {
    return res.status(400).json({ message: "Bio cannot be empty!" });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Update the user's bio
    user.bio = bio;
    await user.save();

    return res.status(200).json({
      message: "Bio updated successfully!",
      updatedBio: user.bio,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating bio!" });
  }
});


 
app.listen(PORT,()=>{
  console.log(`Server running in port ${PORT}`)
})
