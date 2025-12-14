import express from "express";
import User from "../models/users.model.js";
import Meet from "../models/meetings.model.js";
import bcrypt from "bcrypt";
import httpStatus from "http-status";         //help in generating status code
import crypto from "crypto";

import { generateToken } from "../utilities/jwt.js";



const signup= async function (req,res){
  
    let {userName,password}= req.body;
    // console.log(userName);
    const data= await User.find({userName:userName});        //returns an array
    // console.log(data);
    if(data.length!==0){
        res.status(httpStatus.CONFLICT).json({message:"User already Registered"});   //conflict 
    }
    else{
        const saltRounds=10;
        const hash=await bcrypt.hash(password,saltRounds);
        //console.log(hash);
        let newUser= new User({
            name:req.body.name,
            userName: req.body.userName,
            password: hash,
        });

        await newUser.save().then(()=>{
            console.log("saved");
        });
        res.status(httpStatus.CREATED).json({message:"Registration Successfull"});
    }
}

const signin =async function (req,res){
    //console.log(req.body);
    let userName= req.body.userName;
    let password= req.body.password;
    if(!userName || !password){                 //wont  come into effect as form validation is in application
        return res.status(httpStatus.BAD_REQUEST).json({messgae:"Enter Required Information"});
    }
    
    const user=await User.findOne({userName:userName});
    //console.log(user);
    if(!user){
        return res.status(httpStatus.NOT_FOUND).json({message:"User not Registered"});
    }
    const result=await bcrypt.compare(password,user.password);    //return a boolean value //bcypt errors not getting cvered in wrapAync
    //console.log(result);
    if(result){   //login successfull
        //const token=generateToken(user);   not implementing the JWT logic rt now
        //push token in user database
        user.token=crypto.randomBytes(20).toString("hex");
        await user.save().then(()=>{
            //console.log("updated");
        })
        const jwtoken=generateToken(user);

        res.cookie('jwtoken', jwtoken, {      // a cookie is always a key value pair
           httpOnly: true,    // 🚫 JS can't read this
           secure: false,      // ✅ true send only over HTTPS, for localhost it shd be false
           sameSite: 'Strict',// prevent CSRF from other sites
           maxAge: 24 * 60 * 60 * 1000 // 1 day in ms
        });
        //login via cookies is recommended , if using cookie only then no need to send token to frontend and then eventually store it to the local storage
        res.status(httpStatus.OK).json({jwtoken,message: "Logged in succesfully",token:user.token});   //here we are sending bcoz we implementing both methods
    }
    else{
        res.status(httpStatus.BAD_REQUEST).json({message: "Entered Password or Usernname is wrong"});
    }
}


const signout= async function (req,res){
  try {
    // 1️⃣ Clear JWT cookie
    res.clearCookie("jwtoken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // false in localhost
      sameSite: "Strict",
    });

   // 2️⃣ OPTIONAL: invalidate token in DB (if stored)
    if (req.body.token) {   //check if token passed
        //console.log("removing token", req.body.token)
        let user= await User.findOne({token:req.body.token});
        const updatedUser = await User.findByIdAndUpdate(user._id,{ $unset: { token: "" } },{ new: true }) // 👈 return updated data);

       // console.log(updatedUser);
    }
     //Jwt can never be destroyed hence not doing anything to it
    // 3️⃣ Send success response
    return res.status(httpStatus.OK).json({
      success: true,
      message: "Logged out successfully",
    });

    }
    catch(err){
        console.log("Unable to LogOut",err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
         success: false,
         message: "Logout failed",
        });
    }
}

//no need of try catch as WrapAsycn is there
const getHistoryOfUser= async function(req,res){          //req.body is undefined for get requests
  
    //console.log(req.query);
    let token=req.query.token;

    //retrive the user using token
    let user= await User.findOne({token: token});

    //retrieve the meeting data using the user_id
    let meetingData=await Meet.find({user_id:user._id});
    //console.log(meetingData);
    if(meetingData){
      res.status(httpStatus.OK).json({meetingData,message:"Meeting Data Retrieved" });
    }
    else{
      res.status(httpStatus.NOT_FOUND).json({message: "No Meetings Joined yet"});
    }
}
  

const addtoActivity= async function (req,res){
    //console.log(req.body);
    let token= req.body.token;
    let meetingCode= req.body.meetingCode;
    
    let user= await User.findOne({token: token});
    let newMeetingData= new Meet({
        user_id: user._id,
        meetingCode: meetingCode,
        password: user.password,
    });
    
    await newMeetingData.save().then(()=> {console.log("meet addded")});
    res.status(httpStatus.CREATED).json({message:"Meet addition Successfull"});
}


export {signup,signin,signout,getHistoryOfUser,addtoActivity} 