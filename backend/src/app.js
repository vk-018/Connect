import express from "express";
import mongoose from "mongoose";
import 'dotenv/config';
import cookieParser from 'cookie-parser';

import {createServer} from "node:http";
//we need this to connect express and sockrt instances
import {Server} from "socket.io";
//
import cors from "cors";


import connectToSocket from "./controllers/socketmanager.js";   //fn to connct socket.io with node-http creates serevr

//importing routers
import userRoutes from "./routes/users.routes.js";





const app=express();
app.use(cookieParser());   //to handle cookies as we are using cookie absed authentication
const port = process.env.PORT || 3000;   //defines port this way ro we can use app.set('port',3000)

app.use(cors({                     //cant use allow all origin if using cookies
  origin: process.env.CLIENT_URL,  // React app
  credentials: true,                // allow cookies and auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({limit: "40kb"}));
//Purpose: Parses incoming requests with JSON payloads and makes them available on req.body.
//Restricts the size of incoming JSON requests to 40 kilobytes.
app.use(express.urlencoded({limit: "40kb" ,extended:true}));
//Purpose: Parses URL-encoded form data (like data from an HTML form).,extended: true Allows nested objects in the form data.
//Restricts the size of form data, similar to JSON limit.
const server= createServer(app);    //connect app with this
//you manually create an HTTP server and pass your Express app into it.
//This gives you a handle (server) that you can use with other systems — like WebSocket or Socket.IO — that need direct access to the HTTP server.
   
const io=connectToSocket(server);
//This line creates a new Socket.IO server instance that’s attached to your existing HTTP server.

//connection mongo db

main()
 .then(()=> {
    console.log("connection successfull");
 })
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

app.use("/api/v1/users",userRoutes);          //using users router         -> all the req to path /users.... will be handeled by this route
//we are defining our apis like this bcoz (i) to specify that this is an api call(means this is not just rendering of a static file) ,(ii) if we make any chnages later we can roll out different versions


app.get("/", (req,res)=>{
    
    return res.json({"hello":"working"});
})



const start= async()=> {      //id used set with port then app.get(port) was needed
    server.listen(port,()=>{
        console.log(`server is running at port ${port}`);
    })

}

start();