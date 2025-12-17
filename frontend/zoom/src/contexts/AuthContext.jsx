import {createContext, useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext= createContext();       //createContext through which we create a global auth context

const client=axios.create({       //can bypass writting this part again and again
    baseURL:`${import.meta.env.VITE_API_URL}/api/v1/users`,        //as all the routes of this context to this base only
    withCredentials: true  // 👈 important! send cookies automatically   , but now make change in cors too
});

/*
axios.get(url, config) : so for get request we must use words like params. headers, passing simple objects wont be sent to backend
axios.post(url, data, config)  : passing a simple object will be sent with req,body
//header comes under the config part
*/

export const AuthProvider=({children}) =>{            //its a component

    const [user,setUser]=useState(null);
    const router=useNavigate();

    async function register(name,userName,password){
      try{
        let result= await client.post('/register',{
            name:name,
            userName:userName,
            password:password
        });
        console.log(result);
        if(result.status===201){
          return result.data.message;
        }
      }
      catch (error) {
        throw error;
      } 
    }

    async function login(userName,password){
      try{
        console.log(userName,password);
        let result= await client.post('/login',{
            userName:userName,
            password:password
        }); 
        
        console.log(result.data);
        if(result.status===200){
          localStorage.setItem("jwtoken",result.data.jwtoken);    //this is the real jwt token send this to backend to check authenticity
          localStorage.setItem("token",result.data.token);          //this token will be user to access all the user data 
          router("/home")
          return result.data.message;
        } 
      }
      catch (error) {
        throw error;
      }
    }

    async function logout() {
      try{
       console.log("logging out");
       let result=await client.post('/logout',
        {token: localStorage.getItem("token")},         //data object
        // {         //this is the config part
        // headers: {               //header object   // will work 
        //   Authorization: `Bearer ${localStorage.getItem("jwtoken")}`
        // }});
        
       // 2️⃣ Clear localStorage
      localStorage.removeItem("token"); // auth flag
      localStorage.removeItem("jwtoken"); 

       // 3️⃣ Redirect & block back navigation
      router("/", { replace: true });
      } 
      catch(err){
        console.log("Unable log out", err)
      }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }, 
                headers: {               //header object   // will work 
                 Authorization: `Bearer ${localStorage.getItem("jwtoken")}`
                }});
            //console.log(request);
            //console.log(request.data);
            return request.data
        } 
        catch(err) {
            throw err;
        }
    }

    async function addToUserHistory(meetingCode){
     try{
      let request= await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meetingCode: meetingCode,
      },
      {    //config part
        headers: {               //header object   
          Authorization: `Bearer ${localStorage.getItem("jwtoken")}`
        }
      });

      console.log(request);
      console.log(request.data);
     }
     catch(error){
      console.log("Failed to add Activty",err);
      throw error;
     }
    }

    const value={
        user,
        register,
        login,
        logout,
        getHistoryOfUser,
        addToUserHistory,
    };
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
