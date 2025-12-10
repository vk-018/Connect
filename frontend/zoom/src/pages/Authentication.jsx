import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useState } from 'react';
import ButtonBase from '@mui/material/ButtonBase';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import {useForm} from "react-hook-form";
import errorStyles from '../utils/errorstyle.js';
import { useEffect } from 'react';
import Collapse from '@mui/material/Collapse';

export default function Authentication() {
  

  let [error,seterror]=useState("");      //used to show any error
  let [message,setmessage]=useState("");          //used to set message of error
  let [formState,setformState]= useState(false);            //0 for sign in and 1 for sign up
  let [open,setopen]=useState(false);           //used to implement snackbar


  // React Hook Form setup
  
  const {register: formRegister,handleSubmit:formhandleSubmit,reset:formreset,formState:formformState}=useForm();
  const {errors}=formformState;


  function onClickSign(){
    setformState(!formState);
    seterror("");
    setmessage("");
    setopen(false);
  }
  useEffect(()=>{
    formreset({ name: "", userName: "", password: "" })     // clears all fields when toggling login/signup
  },[formState]);


  const {user,register,login}= useContext(AuthContext);

  async function handleSubmit(data){

    try{       
    //console.log(data);    //all fields are in data obj
    let msg="";
    if(formState===true){
      msg = await register(data.name,data.userName,data.password);    //msg gets populated only in case of successfull registrat
      setopen(true);              //enable snackbar
      setmessage(msg);               //set msg snackbar
      seterror("");              //no error
      setformState(false);       //
    }
    else{
      msg=await login(data.userName,data.password);
      setopen(true);
      setmessage(msg);
      seterror("");
    }
    //console.log("msg" +msg);
    }
  catch(err){
    //console.log("error"+err.response.data.message);
    let errmsg=err.response.data.message;
    seterror(errmsg);
    setopen(true);
    setmessage(formState===true ? "Registeration Failed" : "Login Failed");
  }
  }


  return (
    <div className='authPageContainer'>
      <div className='loginCard'>
        <h2 style={{textAlign:'center'}}>Login To <span style={{color:'orange'}}>Connect</span></h2>
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }} style={{margin:'auto',marginTop:'1rem',marginBottom:'1rem'}}>
          <LockOutlinedIcon />
        </Avatar>


    <div>
      <Button variant={formState===false ? "contained": ""} style={{marginRight: '1rem'}} onClick={onClickSign}>
        Sign In
      </Button>
      <Button variant={formState===true ? "contained": ""} onClick={onClickSign}>
        Sign Up
      </Button>
    </div>


    <Box
      component="form"
      sx={{ '& > :not(style)': { m: 1}}}        //responsive widths    //direct way to style box  //& > :not(style) → applies the style to all direct children of the form
      noValidate       //disable browsers validations
      autoComplete="off"
      className='loginForm'
      onSubmit={formhandleSubmit(handleSubmit)}
    >
      {formState && 
      <TextField label="Full Name" name="name" type="text" 
      variant="outlined" placeholder='Enter Your Name' className='loginInpBox'  
      {...formRegister("name",
        {
          validate : (value)=>{
            if(formState && value.trim()===""){
              return 'Enter a Valid Name'
            }
            else{
              return true;
            }
          }
        })}
        error={!!errors.name}                 // <-- this triggers red border
        helperText={errors.name?.message}     // <-- shows the message below/>
        sx={errorStyles}
      />
      }
      
      

      <TextField label="Username" name="userName" type="text" variant="outlined" 
      placeholder='Enter Your Username' className='loginInpBox' 
      {...formRegister("userName", {
          validate: (value) => value.trim() !== "" || "Enter a Valid Username",
      })}
      error={!!errors.userName}                 // <-- this triggers red border
      helperText={errors.userName?.message}     // <-- shows the message below
      sx={errorStyles}
      />  
      


      <TextField label="Password" name="password" type="password" variant="outlined" 
      placeholder='Enter Password' className='loginInpBox' 
      {...formRegister("password", {
          validate: (value) => value.trim() !== "" || "Enter a Valid Password",
      })}
      error={!!errors.password}                 // <-- this triggers red border
      helperText={errors.password?.message}     // <-- shows the message below
      sx={errorStyles}
      />
      

      <Collapse in={!!error}>
       <p style={{ color: "#F87171", textAlign: 'left', margin: '0px', marginLeft: '8px' }}>
       {error}
       </p>
      </Collapse>

      <Button type='submit' variant="contained" className='btnLogin'>{formState===false ? "LOGIN" : "SIGN UP"}</Button>
      
    </Box>


      </div>
      <Snackbar
       open={open}
       autoHideDuration={3000}     //this triggers on close after 3s
       onClose={() => setopen(false)}
       anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}   //relative to parent div
       sx={{
        zIndex:1500,
        marginBottom:'2rem',
       }}
       >
       <SnackbarContent
        message={message}
        sx={{
        
        color: 'white',
        fontSize: '1rem',
        borderRadius: '8px',
    }}
      />
      </Snackbar>

    </div>
  )}
