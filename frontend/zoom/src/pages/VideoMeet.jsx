import React, { useRef, useState,useEffect } from 'react'
import "../styles/VideoMeet.css"

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import io from "socket.io-client";
import { useForm } from 'react-hook-form';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import MicRoundedIcon from '@mui/icons-material/MicRounded';
import MicOffRoundedIcon from '@mui/icons-material/MicOffRounded';
import ScreenShareRoundedIcon from '@mui/icons-material/ScreenShareRounded';
import StopScreenShareRoundedIcon from '@mui/icons-material/StopScreenShareRounded';
import CallEndRoundedIcon from '@mui/icons-material/CallEndRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import Badge from '@mui/material/Badge';
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";


const server_url= import.meta.env.VITE_API_URL;
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
  "iceServers": [                                  //The Interactive Connectivity Establishment protocol is used to find the best connection.   (using stun/turn servers)
    {urls: "stun:stun1.l.google.com:19302"}
  ],
}
export default function VideoMeetComponent() {
  
  let socketRef=useRef();        //represents the socket
  let socketIdRef=useRef();        //represents the socket id
  let localVideoRef=useRef();      //represents our video tag   . bypasses the use of document selector
  let localScreenRef=useRef();    //repersents screen video , serves same purpose as local video ref
  let [videos,setvideos]=useState([]);     //videos of all the other urers connected

  //hardware wise or  permission wise
  let [videoAvailable,setvideoAvailable]= useState(true);
  let [audioAvailable,setaudioAvailable]= useState(true);
  let [screenShareAvailable,setscreenShareAvailable]= useState(true);
   

  //controlling video/audio/screeshare    
  let [video,setvideo]=useState();
  let [audio,setaudio]=useState();
  let [screenShare,setscreenShare]=useState();

  let[showModel,setshowModel]=useState(false);       //to control alerts/pop up
  let [messages,setmessages]=useState([]);        //chat messages
  let[message,setmessage]=useState("");          //our message
  let [newMessages,setnewMessages]=useState(0);    //number of new messages

  //user
  let [askForUsername,setaskForUsername]=useState(true);
  let [userName,setuserName]=useState("");

  const videoRef=useRef([]);      //to handle async nature of usestate   (will store videos of all the remote peers)
  const screenSenderMap = useRef({});       // { peerId: [RTCRtpSender, ...] } to remove senders later....bcoz peers will keep on expecting media and show a black screen even after screenStream is stopped , sender removal is necessary
  const expectedScreenFrom = useRef({});    // marks that a peer is expected to send a screen (used by ontrack)


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
        /*This is how you show a MediaStream in an HTML <video> tag.
         srcObject is used instead of src because it's not a file or URL — it's a live media stream.  */    
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

async function handleScreen(){
  if(screenShare){     //already sharing
    await stopScreenShare();
    return;
  }
  if(!screenShareAvailable){
    console.warn("Screen Display not available");
  }

  //Step1: asking for stream permission
  try{
    const screenStream= await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});     //only screen video
                                                   //notice this time its diplay media not user media
    window.screenStream=screenStream;           //storing global reference
    //console.log(window.screenStream);
    setscreenShare(true);

    //for each peer add the stream and renegotiate
    screenSenderMap.current={};

    // Let others know you're sharing so they can tag incoming ontrack as screen
    if (socketRef.current && socketRef.current.connected) {     //just cheking as a precaution
      socketRef.current.emit('screen-share-started', socketIdRef.current);      //emiiting two things the msg and id of user who is emitting
    }
    //for each peer, add screen tracks and renegotiate
    for(const socketId in connections){                     //connections stores socketId: ITS RTC connections
      if(socketId===socketIdRef.current){
        continue;
      }
      const peerConnection=connections[socketId];
      if(!peerConnection || peerConnection.connectionState==='closed'){
        continue;     //dont add tracks to closed or undefined connetions
      }

      const added=[];    //will be used to update screenSenderMap

      //Step2: starting media streaming  (but this willl be intiated after offer exchange)
      for(const track of screenStream.getTracks()){
        try{
          //addTrack returns the sender object which stores info regarding the track added
          const sender=peerConnection.addTrack(track,screenStream);        //adding track to each peer....this is what which needs to be removed later 
          added.push(sender);
        }
        catch(error){
          console.warn("Track Adding Failed",socketId,error);
        }
      }

      //now updated senders map
      //Step 3: negotiate offers so that data exchange finally begins
      if(added.length!==0){
        screenSenderMap.current[socketId]=added;
        await renegotiatePeer(peerConnection,socketId);
      }
    }
    console.log('localScreenRef at preview time:', localScreenRef.current);

    if(localScreenRef.current){                //localScreenRef.current  →  HTMLVideoElement    , make sure the dom elemnt to which it is assigned has loaded
      console.log("screen shared");
      localScreenRef.current.srcObject=screenStream;      //use this for local preview
      await localScreenRef.current.play()
    }

    //edge case : when the user ends the stream through browser UI  (different stop btn)
    const st=screenStream.getVideoTracks()[0];
    if(st){
      st.onended = () => stopScreenShare();
    }
  }
  catch(error){
    console.warn("Screen share failed/cancelled", error);
  }
}

async function stopScreenShare(){
  try {
    const screenStream = window.screenStream;
    //stop the tracks but this is not enough , peers still expect this stream and will show a black screen
    if (screenStream) {
      screenStream.getTracks().forEach(track => { try { track.stop(); } catch(error){console.log(error)} });
      window.screenStream = null;
    }

    //hence we need remove these screen senders from each peerConnection and renegotiate
    for(const socketId in screenSenderMap.current){
      const peerConnection= connections[socketId];
      if(!peerConnection){
        continue;
      }
      const senders= screenSenderMap.current[socketId] || [];  //its an array we know
      for(const sender of senders){
        try{
          peerConnection.removeTrack(sender);
        }
        catch(error){
          console.warn("Track Removal Failed",error);
        }
      }
      await renegotiatePeer(peerConnection,socketId);
    }
    screenSenderMap.current={};

    // notify others
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('screen-share-stopped', socketIdRef.current);
    }
}
catch(error){
  console.error("Error stopping screen share:", err);
}
finally{
  setscreenShare(false);
}
}

async function renegotiatePeer(pc, peerId) {
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('signal', peerId, JSON.stringify({ sdp: offer }));
    }
  } catch (err) {
    console.error("Renegotiate failed for", peerId, err);
  }
}

async function handleChat(){
  console.log("handle chat");
  let flag= !showModel;
  setshowModel(flag);
  setnewMessages(0);
}
async function handleSendMessage(){
  console.log("send msg");
  socketRef.current.emit('chat-message', message, window.username)
  setmessage("");
}
//add the new message to messages list
async function addMessage(data,sender,socketIdSender){
  console.log("add msg");
  setmessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data, id: socketIdSender}
        ]);
  //console.log(messages.length);
  if ((socketIdSender !== socketIdRef.current)) {
    console.log("hmmm",showModel);
    setnewMessages((prevNewMessages) => prevNewMessages + 1);
  }
}
async function handleEndCall(){
  console.log("handle end call");
  //first stop local stream
  try {
    const localStream = window.localStream;
    //stop the tracks but this is not enough
    if (localStream) {
      localStream.getTracks().forEach(track => { try { track.stop(); } catch(error){console.log(error)} });
      window.localStream = null;
    }

    //the screen stream
    if(screenShare){
      stopScreenShare();
    }

    //close rtc peer connection
    for (const peerId in connections) {
      try { connections[peerId].close(); } catch(_) {}
    }
    
    //tell others peers that u disconnected
    socketRef.current.emit("disconnect");
  }
    catch(err){
    console.log(err);
  }
  finally{
    window.location.href = "/"
  }
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

//fn to create answer and reply to offers created by new peers
async function gotMessageFromServer(fromId,message){              //callback to listen to event signal   (recieving two things offer and iceCandidate)
    //parse the recieved json data
    var signal=JSON.parse(message);
    if(fromId!==socketIdRef.current){           //dont respond to messages emitted by ourselves
      try{
      if(signal.sdp){     //if message is an sdp offer
        console.log("answer exchange staarted", Date.now());
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
    window.username=username;
   //####step 1: Signalling using socket 
    socketRef.current= io.connect(server_url, {secure:false});    //returns a Socket.IO client instance — i.e., an active WebSocket connection object to your server. [a socket obj]
    
    //the fn gotmsgfromserver completes the signalling process by exchnaging spds through offer/answer echange
    socketRef.current.on('signal',gotMessageFromServer);  
    
    //start of connection
    socketRef.current.on('connect',()=>{
      
      //retrieving socket id
      socketIdRef.current= socketRef.current.id;
      console.log(socketRef.current.id);
      //responding to socket.on 'join-call'   (in backend)
      socketRef.current.emit('join-call',window.location.href,username);              //pass the current path,and username

      //respond to io.emit

      //###step 2: Intiating peer to peer Connection:-
      //connect to each user seprately -> p2p method


      /*
What your code does on “user-joined”
Every client (including the sharer and the newcomer) receives the user-joined event with the full clients list.
Each client creates a RTCPeerConnection for every socket_id (except itself) and then immediately:
adds window.localStream tracks to that RTCPeerConnection (if present),
then attempts to add window.screenStream tracks (if present),
then (if newUserId === mySocket) creates offers from the new peer to all existing connections
      */
      socketRef.current.on("user-joined",async (newUserId,clients,)=>{        //clients is the array which consists object of socket_id and username of all the users from having same path(using same link) where new user joined
        
        clients.forEach(({socket_id,username})=>{   
          
          if(socket_id===socketIdRef.current){       //no connection needed for itself
            return;
          }
          //connections[socket_id] now represents the WebRTC connection between you(current socket) and that peer.
          connections[socket_id]= new RTCPeerConnection(peerConfigConnection);          //This object defines how the peer connection is set up and should contain information about the ICE servers to use.

          //ice trickle : Before two peers can communitcate using WebRTC, they need to exchange connectivity information.(ice candidates)
          //this is sending part recieving part will be handled somewehre else...

          
          //listen for ice candidate [possible connect path] from this specific peer connection the browser will automatically discover them 
          //this prepares your connection to start gathering ICE candidates automatically, but ICE trickling itself doesn’t start until you call createOffer().
          connections[socket_id].onicecandidate= function (event){
            if(event.candidate !== null){      //new candidate found
              //send this to other peer over the signalling channel created at start
              socketRef.current.emit('signal',socket_id,JSON.stringify({'ice': event.candidate}))             //signal recieved on line 376

              /*socketRef.current → your active Socket.IO client.
               'signal' → the event name used for signaling messages.
                socket_id → tells the server which peer to send it to.
                JSON.stringify({ 'ice': event.candidate }) → wraps the ICE candidate in JSON for transmission.*/ 
            }
          }
          
          //Once ICE candidates are being received, we should expect the state for our peer connection will eventually change to a connected state
          
          //#step 3: starting sending and recieving media       - though this will start once we exchange offers
          //handle incoming tracks from remote peers

          connections[socket_id].ontrack=(event)=>{            //whenever remote peer sends video/audio/scree this callback runs
            //console.log("ontrack fired for", socket_id);
            const remoteStream=event.streams[0];           //a MediaStream that groups one or more tracks from the same peer.
            //determine weather incoming stream is a camera stream or screen stream based on status of expected screen which we have already set true if this is screen share
  //           const track = event.track;
  // const label = track.label.toLowerCase();

  // let streamTyp = "camera";
  // if (label.includes("screen") || label.includes("window")) {
  //   streamTyp = "screen";
  // }

  // console.log("Detected stream:", streamTyp, label);
            const streamType = expectedScreenFrom.current[socket_id] ? 'screen' : 'camera';
            console.log(videos.length , streamType);

            // console.log("BEFORE:", videoRef.current);
            // console.log("FINDING ID: ", socket_id);
            setvideos(videos=>{
              //check it video of this peer already exists
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
                  username:username || 'Unknown',
                  streamType:streamType,       //camera or screen
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
         //add screen display media for newly joined user, extra thing will be tracking sender objects bcoz we need remove it later
          
          if(window.screenStream!==undefined && window.screenStream!==null){    
            const added=[];
            for(const track of window.screenStream.getTracks()){
              try{
              //addTrack returns the sender object which stores info regarding the track added

              const sender=connections[socket_id].addTrack(track,window.screenStream);        //adding track to each peer....this is what which needs to be removed later 
              added.push(sender);
              console.log("sreen track added successfully", Date.now());
              }
              catch(error){
                console.warn("screen Track Adding Failed",socket_id,error);
              }
             }

      //now updated senders map
      
      if(added.length!==0){
        screenSenderMap.current[socket_id]=(screenSenderMap.current[socket_id] || []).concat(added);
      }
          }
          else{
            console.log(window.screenStream);
            console.log("NO screen media stream Avl yet");
          } 
        
          //transmit the local media(camera+audio) to remote peer
          if(window.localStream!==undefined && window.localStream!==null){    
            const tracks= window.localStream.getTracks();
            tracks.forEach(track=>{
              connections[socket_id].addTrack(track,window.localStream);
            });
            console.log("local media tracks added successfully")
          }
          else{
            console.log("NO loacl media stream Avl yet");
          }
          })

    
//Step 3: negotiate offers so that data exchange finally begins    - logic is every new peer creates an offer and expects an answer from already existing peer ...
        //Last Step: now create offer from the new peer side
        if(newUserId===socketIdRef.current){                          //mkae sure its the new peer(user just joined) who is creating offer ,bcoz the server broadcast user-joined to all,including the new user, but we want only the new user to creeate offers
          for(let id2 in connections){                    //lopp through every socket id in our connection, skip yourself
            if(id2===socketIdRef.current){
              continue;
            }
            try{
            //now create offer
            console.log("offer exchange staarted", Date.now());
            const offer= await connections[id2].createOffer();      //Each connections[id2] is an RTCPeerConnection object representing a connection to another peer.
            console.log(offer);
            /*This generates the SDP offer — which describes:
             The codecs you support,Media configuration (audio/video),ICE transport parameters,and more. */
            await connections[id2].setLocalDescription(offer);   //Tells the browser:“I’m committing to use this configuration.”
            //This also triggers ICE candidate gathering internally.
            socketRef.current.emit('signal',id2,JSON.stringify({"sdp":offer}));
            //console.log('remoteDescription (answer):', connections[id2].remoteDescription.sdp);

          }
          catch(err){
            console.log(err);
          }
        }
      }
    });     

    //screen share, listening to server , sharer id is coming from the server
    socketRef.current.on('screen-share-started', (sharerId)=>{
      expectedScreenFrom.current[sharerId]=true;
    });
    //screen share stopped
    socketRef.current.on('screen-share-stopped',(sharerId)=> {
      // remove video objects corresponding to that peer's screen streams
      setvideos(prev => prev.filter(video => !(video.socketId===sharerId && video.streamType==='screen')));
      delete expectedScreenFrom.current[sharerId];
    });


    //after recieveing the data, sender, and sender socket id we trigger fn addmessage
      socketRef.current.on('chat-message',addMessage);

      socketRef.current.on("user-left",(id)=>{            //we got the id of user left
        console.log("disconnected");
        setvideos((videos)=> videos.filter((video)=> video.socketId!==id));           //remove this particular video
      })
    })
}

  
return (
    <div>
     {askForUsername === true ?
     
     <div className='previewContainer'>
      <p className='headerLine'>Video Call using <span style={{color:'orange'}}>Connect</span> </p>

      <div className='middle'>

      <div className='previewVideo'>    
        <video ref={localVideoRef} autoPlay muted style={{border: 'solid white 2px'}}></video>
        <div style={{ marginTop: "16px" }} className='permissionBtn'>
            <Button
              variant="contained"
              color={video ? "success" : "error"}
              onClick={() => {videoAvailable===false ? getPermission() : toggleMedia("video")}}
              disabled={!videoAvailable}
              sx={{
                mr: "3rem",
                height: "3rem" ,
                borderRadius:"75%" ,
                "&.Mui-disabled": {
                  backgroundColor: "#555",   // custom disabled background
                  color: "#ccc",             // custom text color
                  opacity: 1,                // important: remove default fade
                  cursor: "not-allowed"      // optional
                }
              }}
            >
              {video ? <VideocamRoundedIcon/> : <VideocamOffRoundedIcon/>}
            </Button>

            <Button
              variant="contained"
              color={audio ? "success" : "error"}
              onClick={() => {audioAvailable===false ? getPermission() : toggleMedia("audio")}}
              disabled={!audioAvailable}
              sx={{
                height: "3rem" ,
                borderRadius:"75%" ,
                "&.Mui-disabled": {
                   backgroundColor: "#555",   // custom disabled background
                   color: "#ccc",             // custom text color
                   opacity: 1,                // important: remove default fade
                  cursor: "not-allowed",     // optional
                  }
                }}
            >
              {audio ? <MicRoundedIcon/>: <MicOffRoundedIcon/>}
            </Button>
          </div>
      </div>

      <div className='formBox'>
      <p>Ready to <span style={{color:'orange'}}>Connect</span></p>

      <Box className='fieldBox'
      component="form"        //converts this mui box into a from
      sx={{ '& > :not(style)': { m: 1 } }}  //This applies: margin: 1 width: 25ch to every direct child of the Box, including the TextField and the Button.
      noValidate             //no browser style on display
      autoComplete="off"
      onSubmit={handleSubmit(connect)}          //handles all edge cases and calls connect fn
      >
      <TextField fullWidth id="outlined-basic" label="Username" name="username" variant="outlined" placeholder='Enter Your Username'
      sx={{       //this is how we style mui elements
      "& .MuiOutlinedInput-root": {
      borderRadius: "28px",
      }
      }}
      {...register("username",{   //register the input with  right hook form
          validate: (value) => value.trim() !== "" || "Enter a Valid UserName",
      })}
      error={!!errors.username}                 // <-- this triggers red border
      //helperText={errors.username?.message}     // <-- shows the message below
      />
      <Button type="submit" variant="contained" 
       sx={{
        borderRadius: "28px",  // rounded button
        padding: "10px 20px",
        "&:hover": {
          backgroundColor: "#155fa0",},
        width: "100%",
        }}>
        Connect
      </Button>

      </Box>
    </div>
    </div>

     </div> :
     <div className='connectedContainer'>

       {screenShare=== true ? 

       <div className='shareScreenContainer'>
         <video ref={localScreenRef} autoPlay muted ></video>
       </div>
        :
        
       <div className='peerVideoContainer'
       
       style={{backgroundImage: videos.length===0 ? "url('../waiting.png')": null ,
               backgroundSize: videos.length===0 ? "100% 100%": null,
               maxWidth: showModel ? "75%" : null,
               alignSelf: showModel ? 'flex-start' : null,
             }}>
              
        {videos.map((video)=>{
          return(
           <div key={video.socketId}  className='peerVideo'>
            <h3 className='peerName'>{video.username}</h3>
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
      }
      {showModel && 
      <div className='chatBox'>
        <div className='positionChat'>
          <div className='peerChatContainer'>
          <p style={{color: "black",fontWeight:"800", textAlign:"center", fontSize:"1.2rem"}}>Chat Section</p>
          {messages.length > 0 ? messages.map((chat,index)=>{
            return(
           <div key={index} className='peerChat' style={{marginLeft: chat.id===socketIdRef.current ? "auto" : "0"
            ,backgroundColor: chat.sender=== window.username ? "#D9EAFF" : "#FFFFFF"}}>
           
            <p className='chatPeerName' style={{color: chat.id===socketIdRef.current ? "#05203A": "#0B2545"}}>{chat.sender}</p>
            <p className='chatPeerMessage' style={{color: chat.id===socketIdRef.current ? "#05203A": "#0B2545"}}>{chat.data}</p>
           </div>
          )
        }): <p style={{color: "black"}}>No Messages yet</p>}
          </div>
          <div className="userChatContainer">
  <TextField
    label="Chat"
    variant="outlined"
    placeholder="Enter Your Message"
    value={message}
    onChange={(event)=> setmessage(event.target.value)}
    fullWidth
    slotProps={{
      input : {
      endAdornment: (
        <IconButton
        onClick={handleSendMessage}
          disabled={!message.trim()}
          sx={{ p: 0 }}
        >
        <SendRoundedIcon
        sx={{
         fontSize: 24,
         color: message.trim() ? "primary.main" : "grey.400",
        }}
        />
        </IconButton>
      )},
    }}
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "28px",
      },
    }}
  />
          </div>
        </div>
      </div>
      }
      
        <div className='userVideo' style={{left: showModel ? "0" : "auto"}}>    
          <video ref={localVideoRef} autoPlay muted ></video>
        </div>
      
      <div style={{ marginTop: "16px" }} className='realTimeBtn'>
            <Button
              variant="contained"
              color={video ? "success" : "error"}
              onClick={() => {videoAvailable===false ? getPermission() : toggleMedia("video")}}
              disabled={!videoAvailable}
              sx={{

                height: "3rem" ,
                borderRadius:"75%" ,
                mr: "2rem",
                "&.Mui-disabled": {
                  backgroundColor: "#555",   // custom disabled background
                  color: "#ccc",             // custom text color
                  opacity: 1,                // important: remove default fade
                  cursor: "not-allowed"      // optional
                }
              }}
            >
              {video ? <VideocamRoundedIcon/> : <VideocamOffRoundedIcon/>}
            </Button>

            <Button
              variant="contained"
              color={audio ? "success" : "error"}
              onClick={() => {audioAvailable===false ? getPermission() : toggleMedia("audio")}}
              disabled={!audioAvailable}
              sx={{
                mr: "2rem",
                height: "3rem" ,
                borderRadius:"75%" ,
                "&.Mui-disabled": {
                   backgroundColor: "#555",   // custom disabled background
                   color: "#ccc",             // custom text color
                   opacity: 1,                // important: remove default fade
                  cursor: "not-allowed",     // optional
                  }
                }}
            >
              {audio ? <MicRoundedIcon/>: <MicOffRoundedIcon/>}
            </Button>
            
            <Button
              variant="contained"
              color= "info"
              onClick={() => {screenShareAvailable===false ? getPermission() : handleScreen()}}
              disabled={!screenShareAvailable}
              sx={{
                mr: "2rem",
                height: "3rem" ,
                borderRadius:"75%" ,
                "&.Mui-disabled": {
                   backgroundColor: "#555",   // custom disabled background
                   color: "#ccc",             // custom text color
                   opacity: 1,                // important: remove default fade
                  cursor: "not-allowed",     // optional
                  }
                }}
            >
              {screenShare ? <ScreenShareRoundedIcon/>: <StopScreenShareRoundedIcon/>}
            </Button>
          
          <Badge badgeContent={newMessages} color="secondary" style={{marginRight:"2rem"}}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleChat}
              sx={{
                mr: "0",
                height: "3rem" ,
                borderRadius:"75%" ,
              }}
            >
              <ChatRoundedIcon/>
            </Button>
          </Badge>

            <Button
              variant="contained"
              color="error"
              onClick={handleEndCall}
              sx={{
                mr: "2rem",
                height: "3rem" ,
                borderRadius:"75%" ,
              }}
            >
              <CallEndRoundedIcon/>
            </Button>
      </div>
      
    </div>
     
    }
    </div>
)}