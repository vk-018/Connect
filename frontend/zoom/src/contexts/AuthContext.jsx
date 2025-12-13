import {createContext, useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext= createContext();       //createContext through which we create a global auth context

const client=axios.create({       //can bypass writting this part again and again
    baseURL:"http://localhost:3000/api/v1/users",        //as all the routes of this context to this base only
    withCredentials: true  // 👈 important! send cookies automatically   , but now make change in cors too
});


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
          localStorage.setItem("token",result.data.token);
          router("/home")
          return result.data.message;
        } 
      }
      catch (error) {
        throw error;
      }
    }

    const value={
        user,
        register,
        login,
    };
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
