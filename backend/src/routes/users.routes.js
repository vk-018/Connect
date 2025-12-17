import express from "express";
// import User from "../models/users.model.js";
// import bcrypt from "bcrypt";
// import httpStatus from "http-status";         //help in generating status code
import wrapAsync from "../utilities/wrapAsync.js";
// import jwt from "jsonwebtoken";
// import { generateToken } from "../utilities/jwt.js";
// import crypto from "crypto";
import { signin,signup,signout ,getHistoryOfUser, addtoActivity} from "../controllers/users.contollers.js";
import { authenticateToken } from "../utilities/jwt.js";          //to protect apis where db is being modified
const router=express.Router();

router.route("/register")
   .post(wrapAsync(signup));

//fn to generate token:-
router.route("/login")
    .post(wrapAsync(signin));


//logout need not to be protected
router.route("/logout")
    .post(wrapAsync(signout));


//below apis must be protcted hence the middleware

router.route("/get_all_activity")
   .get(authenticateToken,wrapAsync(getHistoryOfUser));

router.route("/add_to_activity")
   .post(authenticateToken, wrapAsync(addtoActivity));

   
export default router;
