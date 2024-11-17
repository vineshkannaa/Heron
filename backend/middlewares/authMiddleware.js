import jwt from "jsonwebtoken"

async function jwtAuthorization(req,res,next){
    try{
        const token=req.headers.authorization.split(" ")[1]
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        if (decoded){
            req.token=decoded
            console.log(decoded)
            next()
        }else{
            return res.status(401).json({
                message:"Unauthorized",
                data:null
            })
        }
    }catch(err){
        console.log(err)
        return res.status(401).json({
            message:"Unable to Authorize at this moment, Try again later",
            data:null
        })
    }
}

export {
    jwtAuthorization
}