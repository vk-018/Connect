import { Server } from "socket.io"

let connections={};    //this object will track arrays of [socket ids and username], against the thier paths as keys  (path is protocol + domain+ port)
let messages= {};       //stors an array of object as value and path as key , each element of that array have struture ({data,sender,socket-id-sender})
let timeOnline={};     //store socket id and thier connection time as key value pairs

//this fn is connecting n0de -http created seever with the socket.io server
const connectToSocket = (server) => {
    const io= new Server(server, {              //upgarde the handskae from http to WebScoket and use cors to handle cross origin req
        cors : { 
            origin: "*",    //allow all
            methods:["GET","POST"],
            allowedHeaders: ["*"],
            credentials: true,
        }
    });     //This line creates a new Socket.IO server instance that’s attached to your existing HTTP server.
    
    io.on("connection",(socket)=>{                //This registers a listener on the Socket.IO server (io) that fires every time a new client connects.
        console.log("user connected",socket.id);

        //in all the following block .on adds a an listner to the sockets so they can listen whatever client emits

        socket.on("join-call",(path,username)=>{       //this will handle a client joining the call
            
            if(connections[path]===undefined){
                connections[path]=[];              //if this the first client fromm that particular path
            }
            connections[path].push({
                socket_id:socket.id,
                username: username
            });        //push the socket id in same path array
            timeOnline[socket.id] =new Date();        //push the timing of connection in this object 

            //all other users in this path gets notified an user has joined
            for(let i=0;i<connections[path].length;i++){
                io.to(connections[path][i].socket_id).emit("user-joined",socket.id,connections[path]);    //.emit first arg is event name, other all are data sent
            }
            //replay past chat messages for that room to the joining socket.   (update the joining socket)
            if(messages[path]!==undefined){            //ensure there is atleast 1 message in  chatroom for this path
                for(let i=0;i<messages[path].length;i++){
                    io.to(socket.id).emit("chat-message",messages[path][i]['data'],messages[path][i]['sender'],messages[path][i]['socket-id-sender']);
                                    //    event name       //data                      ///sender                      //socket-id sender , we are sending this to check weather sender and current user is same -> if same increase notification number by 1                                                                                  // else keep the notifiaction number same, as our own message shd not be notified to us
                }
            }

        });

        /*
        Purpose: Used for WebRTC signaling forwarding (SDP / ICE). A socket sends a signal payload for another peer ID; server forwards it to the target peer.
        Behavior : Forwards with the sender id so the recipient knows who sent the signal:
        */
        socket.on("signal",(toId,message) =>{                  //listens from client
            io.to(toId).emit("signal",socket.id,message);        //send to particular cliebt
        });



        //Receives a chat message from a client and broadcasts it to other users in the same room, also storing it in messages[room].
        //# Flow : first find the room of sender, then store message, then send it to other users in that room
        socket.on("chat message", (data,sender)=>{          //we are reciving data which the client sent and sending it to the room wehre client is present

            var matchingRoom=null;       //   path/room where sending client is present
            for( const [roomKey,usersConnected] of JSON.parse(JSON.stringify(Object.entries))){    //roomkey represnts the path , userConnected represnt its value that is an array
                for(let i=0;i<usersConnected.length;i++){
                    if(usersConnected[i].socket_id===socket.id){
                        matchingRoom=roomKey;
                        break;
                    }
                }
            }
            //if room not found  -> not likely
            if(!matchingRoom){
                return;
            }

            //if room found then  
            if(matchingRoom){
                if(messages[matchingRoom]===undefined){             //till now no message object stored against this particular path/rooms
                    messages[matchingRoom]=[];
                }
                messages[matchingRoom].push({'sender':sender,"data":data, "socket-id-sender":socket.id});
                //store object  {data, sender and sender id} as an eleemnt of of array storing messages of this path/room
                console.log("message",key ,":",sender,data);
 

                for(let i=0;i<connections[matchingRoom].lenght;i++){
                    io.to(connections[matchingRoom][i].socket_id).emit("chat message",data,sender,socket.id);
                }
            }
        });

        //Handle disconnects
        socket.on("disconnect", ()=>{
            var connectionTime= Math.abs(timeOnline[socket.id]-new Date());         //calculate for which the user was online

            var matchingRoom;                              //key of the path/room from where user disconnected

            for( const [roomKey,usersConnected] of (Object.entries(connections))) {      //doing this parse and strigify to make a deep copy of connection enteries , otherwise chnages done here will reflect on the real object , we dont want that  (not needed rt now)
                for(let i=0;i <usersConnected.length; i++){
                    if(usersConnected[i].socket_id===socket.id){           //this is the room where socket was present
                        matchingRoom=roomKey;      //we got the room key/ path
                        console.log("yes found")
                        break;
                    }
                }
            }
                   console.log(matchingRoom);
                    //send msg to everyone that an user has left from this rooom
                    //and note index of outgoing oeer
                    let userIndex;
                    for(let i=0;i<connections[matchingRoom].length;i++){
                        // console.log(connections[matchingRoom][i]);
                        if(connections[matchingRoom][i].socket_id===socket.id){        //no need to tell urself that u disconnected
                            userIndex=i;
                            continue;
                        }
                        io.to(connections[matchingRoom][i].socket_id).emit("user-left",socket.id);      //send this message to everyone presnt in this room
                    }
                    //now all users have been notified that user left
                    //now disconnect user
                
                    connections[matchingRoom].splice(userIndex,1);            //removes on eelement at index

                    if(connections[matchingRoom].length===0){        //no one left in room with this key
                        delete connections[matchingRoom];           //remove this
                    }
                
            

        })
    })
    return io;
}

export default connectToSocket;