import React from 'react';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';


export default function Home() {
  return (
    <div className='homePageContainer'>
    <nav className='homePagenavbar'>
        <div className='homePagenavHeader'>
          <h2 style={{color:"#7DD3FC"}}><span style={{color:'orange'}}>Connect</span> with The World</h2>
        </div>
          
        <div className="homePagenavList">
          {/* <a href="/joinguest"  className='anchor'>Join as Guest</a> */}
          <a href="/" className='anchor'>< HistoryRoundedIcon style={{ verticalAlign: 'middle' }}/>History</a>
          <a href="/"  className='anchor'>Logout</a>
        </div>
      </nav>

      <div>
        <p>Video calls for EveryOne</p>
        <p>Connect with World in one Click</p>
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
    </div>
  )
}
