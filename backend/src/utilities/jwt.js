//fn to genrate token

import 'dotenv/config'
import jwt from "jsonwebtoken";
import httpStatus from 'http';

function generateToken(user){
    const token= jwt.sign(
        {name:user.name, userName: user.userName},
        process.env.TOKEN_SECRET,
        {expiresIn: 24 * 60 * 60},
    );
    return token;
}


//use this as middleware in route
function authenticateToken(req,res,next){
    const authHeader= req.headers["authorization"];
   console.log(authHeader);
   console.log(req.cookies);      //import cookie parser otherwise this wd be undefined
    const token= ((authHeader && authHeader.split(' ')[1]) ||(req.cookies && req.cookies.jwtoken)) // 👈 Extract token from cookie;
    //console.log(token);
//at least one method will give token
    if(!token){
        return res.status(httpStatus.FORBIDDEN).json({msg:"Token missing"});
    }

    jwt.verify(token,process.env.TOKEN_SECRET, (err,user)=>{
        if(err){
            console.log(err);
            return res.status(httpStatus.UNAUTHORIZED).json({message: "TOKEN MISSING or Expired"});
        }
        req.user= user;   //populate user
        next();
    })
}

export {generateToken,authenticateToken}