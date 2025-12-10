import React, { useRef, useState,useEffect } from 'react'
import "../styles/VideoMeet.css"

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import io from "socket.io-client";
import { useForm } from 'react-hook-form';


const server_url="http://localhost:3000/";
const connections={};     //we cd have used useRef and defined it inside 
/*
1. RTCPeerConnection and ICE servers

When two browsers (or devices) want to connect directly using WebRTC, they need to find the best possible route between each other over the internet — even if both are behind NATs or firewalls.
That’s where ICE (Interactive Connectivity Establishment) comes in.
It uses ICE servers — specifically STUN and TURN servers — to help peers discover and establish a direct connection.

2. "iceservers" property

This is a list (array) of servers that WebRTC will use for connection negotiation.
Each entry can be:
A STUN server (used to discover your public IP)
A TURN server (used to relay data if a direct connection fails)
//TURN servers are required for reliable connections when STUN alone doesn’t work (e.g. strict NATs or corporate firewalls).
*/ 


//STUN or a TURN-server, and their role is to provide ICE candidates to each client which is then transferred to the remote peer
//This transferring of ICE candidates is commonly called signaling.

const peerConfigConnection={
  "iceservers": [                                  //The Interactive Connectivity Establishment protocol is used to find the best connection.   (using stun/turn servers)
    {urls: "stun:stun1.l.google.com:19302"}
  ],
}
export default function VideoMeetComponent() {
  
  let socketRef=useRef();        //represents the socket
  let socketIdRef=useRef();        //represents the socket id
  let localVideoRef=useRef();      //represents our video tag   . bypasses the use of document selector
  let [videos,setvideos]=useState([]);     //videos of all the other urers connected

  //hardware wise or  permission wise
  let [videoAvailable,setvideoAvailable]= useState(true);
  let [audioAvailable,setaudioAvailable]= useState(true);
  let [screenShareAvailable,setscreenShareAvailable]= useState(true);
   

  //controlling video/audio/screeshare    
  let [video,setvideo]=useState();
  let [audio,setaudio]=useState();
  let [screenShare,setscreenShare]=useState();

  let[showModel,setshowModel]=useState();       //to control alers/pop up
  let [messages,setmessages]=useState([]);        //chat messages
  let[message,setmessage]=useState("");          //our message
  let [newMessages,setnewMessages]=useState(0);    //number of new messages

  //user
  let [askForUsername,setaskForUsername]=useState(true);
  let [userName,setuserName]=useState("");

  const videoRef=useRef([]);      //to handle async nature of usestate   (will store videos of all the remote peers)
  

  //form validation handling
   const {register,handleSubmit,formState}=useForm();
   const {errors}=formState;

 //useeffect such that it becomes effective only in the case of first time rendering 
  useEffect(()=>{
    getPermission();
  },[]);

  //to detect whats allowed 
  // For cameras and microphones, we use navigator.mediaDevices.getUserMedia() to capture MediaStreams.
  //  For screen recording, we use navigator.mediaDevices.getDisplayMedia() instead.
async function getPermission() {
  let vidavl=false;
  let audavl=false;
  // Request video permission
  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
    setvideoAvailable(true);
    vidavl=true;
    videoStream.getTracks().forEach((track) => track.stop()); // stop test stream
    console.log("Video Permission granted");
  } catch (error) {
    setvideoAvailable(false);
    console.warn("Video permission denied:", error);
  }

  // Request audio permission
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setaudioAvailable(true);
    audavl=true;
    audioStream.getTracks().forEach((track) => track.stop()); // stop test stream
    console.log("Audio Permission granted");
  } catch (error) {
    setaudioAvailable(false);
    console.warn("Audio permission denied:", error);
  }
 
  
  // Check if screen share API exists
  if(navigator.mediaDevices.getDisplayMedia) {
    setscreenShareAvailable(true);
  } else {
    setscreenShareAvailable(false);
  }

  // If at least one permission is granted, combine and play local stream
  //we used loacal variables to get updated values here as the states will get updated after complete ececution

  await startLocalStream(vidavl,audavl);
}


  async function startLocalStream(vidavl,audavl){
    if(vidavl|| audavl){
    try {
      //start stream based on the permissions given 
      const userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: vidavl,
        audio: audavl,
      });
      // This assigns your media stream (the object returned by getUserMedia()) to a global variable called localStream on the window object.
      window.localStream = userMediaStream;      //now we can access this stream from multiple parts    i.e save this globally
      if (localVideoRef.current) {                  //gd practice to first check weather useRef var has loaded yet or not
        localVideoRef.current.srcObject = userMediaStream;         
        await localVideoRef.current.play();
      }
    //set initial video and audio states
    setvideo(vidavl);
    setaudio(audavl);
    console.log("local stream started");
    
    } catch (error) {
      console.error("Error combining media streams:", error);
    }
  }
  else{      //stop anything if running by chance
      try{
        let tracks=localVideoRef.current.srcObject.getTracks();        //accesscurrent stream
        for(var i=0;i<tracks.length;i++){
          tracks[i].stop();              //stop all tracks
        }
      }
      catch(err){
        console.log(err);
      }
  }
}
  

async function getUserMediaSuccess(){       //fns responsible for updating peers abt latest video or audio status
   //no more needed i guess, bcoz when we use track.enabled webRTC internally updates the peers abt this and sends a black screnn in case of videos aooff
   //and it sends silence in case of audio off
}


  function toggleMedia(type){                 //cd have use effect for audio and video state and just chnage the state by btn click
    //no need to check video avl or not bcoz bcoz respective btns wont be enabled if video / audio not enabled
    const stream=window.localStream;
    if(!stream){
      return;
    }
    // let is_updated=false;
    if(type==="video"){
      const videoTrack=stream.getVideoTracks()[0];
      if(videoTrack){
        const newState=!video;
        videoTrack.enabled=newState;
        // is_updated=true;
        setvideo(newState);
      }
    }
    if(type==="audio"){
      const audioTrack=stream.getAudioTracks()[0];
      if(audioTrack){
        const newState=!audio;
        audioTrack.enabled=newState;
        // is_updated=true;
        setaudio(newState);
      }
    }
    // if(is_updated){
    //   getUserMediaSuccess();
    // }
  }


  async function connect(data){
    
    setaskForUsername(false);
    //afteer re-rendering localVideoRef gets attached to a new video tag ...whose srcObject is not set yet ..so we have to handle that again
    setTimeout(()=> {           //setTimeout is used to make the following fn effectinve after re-rendereing bcoz if it executes b4 re-redering again localvideoRef.current will get attached to new video tag and srcObj will be unset agn
    if(localVideoRef.current && window.localStream){
      localVideoRef.current.srcObject=window.localStream;
      localVideoRef.current.play();
    }
    },0);
    getMedia(data.username);
  }


  function getMedia(username){
    // getUserMediaSuccess();    //connect with pears
    connectToSocketServer(username);      //start the video call
  }


  async function gotMessageFromServer(fromId,message){              //callback to listen to event signal   (recieving two things offer and iceCandidate)
    //parse the recieved json data
    var signal=JSON.parse(message);
    if(fromId!==socketIdRef.current){           //dont respond to messages emitted by ourselves
      try{
      if(signal.sdp){     //if message is an sdp offer
        await connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if(signal.sdp.type==='offer'){
          const answer=await connections[fromId].createAnswer();
          await connections[fromId].setLocalDescription(answer);
          socketRef.current.emit('signal',fromId,JSON.stringify({'sdp':answer}));
        }
      }
      if(signal.ice){
        await connections[fromId].addIceCandidate(new RTCIceCandidate (signal.ice));
      }
    }catch (err){
      console.log(err);
    }
    }
  }
  //USing WebRTC:-
  function connectToSocketServer(username){
    console.log("running");
   //####step 1: Signalling using socket 
    socketRef.current= io.connect(server_url, {secure:false});    //returns a Socket.IO client instance — i.e., an active WebSocket connection object to your server. [a socket obj]
    
    //the fn gotmsgfromserver completes the signalling process by exchnaging spds thorigh offer/anwer echange
    socketRef.current.on('signal',gotMessageFromServer);  
    
     
    //start of connection
    socketRef.current.on('connect',()=>{
      
      //retrieving socket id
      socketIdRef.current= socketRef.current.id;
      console.log(socketRef.current.id);
      //responding to socket.on 'join-call'   (in backend)
      socketRef.current.emit('join-call',window.location.href,username);              //pass the current path,nad username

      //respond to io.emit

      //###step 2: Intiating peer to peer Connection:-
      //connect to each user seprately -> p2p method
      socketRef.current.on("user-joined",async (socket_id,clients,)=>{        //clients is the array which consists object of socket_id and username of all the users from having same path(using same link) where new user joined
        
        clients.forEach(({socket_id,username})=>{      
          //connections[socket_id] now represents the WebRTC connection between you and that peer.
          connections[socket_id]= new RTCPeerConnection(peerConfigConnection);          //This object defines how the peer connection is set up and should contain information about the ICE servers to use.

          //ice trickle : Before two peers can communitcate using WebRTC, they need to exchange connectivity information.(ice candidates)
          //this is sending part recieving part will be handled somewehre else...

          
          //listen for ice candidate [possible connect path] from this specific peer connection the browser will automatically discover them 
          //his prepares your connection to start gathering ICE candidates automatically, but ICE trickling itself doesn’t start until you call createOffer().
          connections[socket_id].onicecandidate= function (event){
            if(event.candidate !== null){      //new candidate found
              //send this to other peer over the signalling channel created at start
              socketRef.current.emit('signal',socket_id,JSON.stringify({'ice': event.candidate}))
              /*socketRef.current → your active Socket.IO client.
               'signal' → the event name used for signaling messages.
                socket_id → tells the server which peer to send it to.
                JSON.stringify({ 'ice': event.candidate }) → wraps the ICE candidate in JSON for transmission.*/ 
            }
          }
          
          //Once ICE candidates are being received, we should expect the state for our peer connection will eventually change to a connected state
          
          //#step 3: starting sending and recieving media
          //handle incoming tracks from remote peers
          connections[socket_id].ontrack=(event)=>{
            console.log("ontrack fired for", socket_id);
            const remoteStream=event.streams[0];
            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socket_id);
            setvideos(videos=>{
              //check it video this peer already exsts
              //videoRef is needed bcoz of asycnhronous behaviour of useState , we can check this in videos array bcoz it wont be updated yet as any update in a state will take place after re-renderig
              let videoExists=videoRef.current.find(video=> video.socketId=== socket_id);
              let updated;
              if(videoExists){
                console.log("Existing video found");
                //if video exists just update the stream
                updated=videos.map(video=> video.socketId===socket_id ? {...video,stream: remoteStream}: video);
              }
              else{
                console.log("Creating New");
                const newVideo={
                  socketId : socket_id,
                  username:username,
                  stream: remoteStream,
                  autoPlay:true,
                  playinline: true,
                }
                updated=[...videos,newVideo];
              }
              videoRef.current=updated;
              return updated;
            });
          }
         
          //transmit the media to remote peer
          if(window.localStream!==undefined && window.localStream!==null){    //toggle condn yet to implement
            const tracks= window.localStream.getTracks();
            tracks.forEach(track=>{
              connections[socket_id].addTrack(track,window.localStream);
            });
          }
          else{
            //blacksilnece thing is not recommended 
            console.log("NO loacl media stream Avl yet");
          }
          
        })

        //Last Step: now create offer from the new peer side

        //id → the socket ID of the newly joined user.

        if(socket_id===socketIdRef.current){                          //mkae sure its the new peer(user just joined) who is creating offer ,bcoz the server broadcast user-joined to all,including the new user, but we want only the new user to creeate offers
          for(let id2 in connections){                    //lopp through every socket id in our connection, skip yourself
            if(id2===socketIdRef.current){
              continue;
            }
            try{
            //now create offer
            const offer= await connections[id2].createOffer();      //Each connections[id2] is an RTCPeerConnection object representing a connection to another peer.
            /*This generates the SDP offer — which describes:
             The codecs you support,Media configuration (audio/video),ICE transport parameters,and more. */
            await connections[id2].setLocalDescription(offer);   //Tells the browser:“I’m committing to use this configuration.”
            //This also triggers ICE candidate gathering internally.
            socketRef.current.emit('signal',id2,JSON.stringify({"sdp":offer}));
          }
          catch(err){
            console.log(err);
          }
        }
      }
    });     

      //socketRef.current.on('chat-message',addMessage);
      socketRef.current.on("user-left",(id)=>{            //we got the id of user left
        console.log("dis");
        setvideos((videos)=> videos.filter((video)=> video.socketId!==id));           //remove this particular video
      })
      
    })
  }

  
  return (
    <div>
     {askForUsername === true ?

     <div>
      Start Video Call using Connect 

      <Box
      component="form"
      sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
      noValidate
      autoComplete="off"
      onSubmit={handleSubmit(connect)}
      >

      <TextField id="outlined-basic" label="Username" name="username" variant="outlined" placeholder='Enter Username'
      {...register("username",{
          validate: (value) => value.trim() !== "" || "Enter a Valid UserName",
      })}
      error={!!errors.username}                 // <-- this triggers red border
      helperText={errors.username?.message}     // <-- shows the message below
      />

      <Button type="submit" variant="contained" >Connect</Button>
      </Box>


      <div>    
        <video ref={localVideoRef} autoPlay muted style={{border: 'solid white 2px'}}></video>
      </div>


      <div style={{ marginTop: "16px" }}>
            <Button
              variant="contained"
              color={video ? "success" : "error"}
              onClick={() => toggleMedia("video")}
              disabled={!videoAvailable}
              sx={{ mr: 2 }}
            >
              {video ? "Turn Camera Off" : "Turn Camera On"}
            </Button>

            <Button
              variant="contained"
              color={audio ? "success" : "error"}
              onClick={() => toggleMedia("audio")}
              disabled={!audioAvailable}
            >
              {audio ? "Mute Mic" : "Unmute Mic"}
            </Button>
          </div>


     </div> :

     <div className='connectedContainer'>
       <div className='peerVideoContainer'>
        {videos.map((video)=>{
          return(
           <div key={video.socketId}  className='peerVideo'>
            <h3>{video.username}</h3>
            <video ref= {ref=> {        //ref is used as DOM element handler
              if(ref && video.stream){
                ref.srcObject=video.stream;         //assigning content to video tag
              }
            }}
            autoPlay
            playsInline
            ></video>
           </div>
          )
        })}
       
        </div>
         <div className='userVideo'>    
        <video ref={localVideoRef} autoPlay muted ></video>
       </div>
       </div>
}</div>
)}