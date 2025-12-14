import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import errorStyles from '../utils/errorstyle.js';
import { AuthContext } from '../contexts/AuthContext.jsx';



export default function Home() {
  
  let navigate = useNavigate();
  const {logout,addToUserHistory}= useContext(AuthContext);
  
  const {
      register,
      handleSubmit,
      formState: { errors },
      reset,
    } = useForm();

  const onSubmit = async (data) => {
    console.log(data);
    await addToUserHistory(data.meetingCode);
    navigate(`/meet/${data.meetingCode}`, { replace: true });
    reset();     //clear all inputs after submit
  };

  return (
    <div className='homePageContainer'>
    <nav className='homePagenavbar'>
        <div className='homePagenavHeader'>
          <h2 style={{color:"#7DD3FC"}}><span className='homeLogo' style={{color:'orange',cursor:"pointer"}}><a href="/" style={{all: "unset",display: "revert"}}>Connect</a></span> with The World</h2>
        </div>
          
        <div className="homePagenavList">
          {/* <a href="/joinguest"  className='anchor'>Join as Guest</a> */}
          <a href="/history" className='anchor'>< HistoryRoundedIcon style={{ verticalAlign: 'middle' }}/>History</a>
          <button onClick={logout} className='anchor' >Logout</button>
        </div>
      </nav>

      <div className='meetingCodeFormContainer'>
        <p className='homePara1'>Video calls for EveryOne</p>
        <p className='homePara2'><span style={{color:'orange'}}>Connect </span>with World in one Click</p>
    <Box
      component="form"
      sx={{ '& > :not(style)': { m: 1}}}        //responsive widths    //direct way to style box  //& > :not(style) → applies the style to all direct children of the form
      noValidate       //disable browsers validations
      autoComplete="off"
      className='meetingCodeForm'
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextField label="Meeting Code" name="meetingCode" type="text"
      variant="outlined" placeholder='Enter a Meeting Code' className='meetingCodeInpBox'  
      {...register("meetingCode",
        {
          validate : (value)=>{
            if(value.trim()===""){
              return 'Enter a Valid Meeting Code'
            }
            else{
              return true;
            }
          }
        }
      )}
        error={!!errors.meetingCode}                 // <-- this triggers red border
        helperText={errors.meetingCode?.message}     // <-- shows the message below/>
        sx={errorStyles}
      />

      <Button type='submit' variant="contained" className='meetingCodeBtn'>{"Connect"}</Button>
    </Box>
    </div>
    </div>
)}
