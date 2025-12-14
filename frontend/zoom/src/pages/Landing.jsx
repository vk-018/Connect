import React from 'react'
import { useState } from 'react'
import {  useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
function Landing() {
  let navigate= useNavigate();   //use navigate is preffered inside components  
  const guestRandom = ()=> {
    console.log("guest joining");
    let random=Math.random().toString(36).slice(2,10);    //very commonly used, generate erandom number make it a string then remove '0.' using slice
    navigate(`/meet/${random}`, {replace: true});
  }
  return (
    <div className="landingPageContainer">
      <nav className='navbar'>
        <div className='navHeader'>
          <h2><span className='homeLogo' style={{color:'orange',cursor:"pointer"}}><Link to="/" style={{all: "unset",display: "revert"}}>Connect</Link></span> with The World</h2>
        </div>
          
        <div className="navList">
          <a onClick={guestRandom}  className='landanchor'>Join as Guest</a>
          <Link to="/auth" className='landanchor'>Register</Link>
          <Link to="/auth"  className='landanchor'>Login</Link>
        </div>
      </nav>

      <div className="landingPageMainContainer">
        <div className='textSide'>
          <h1><span style={{color:'orange'}}>Connect</span> With Your Loved Ones</h1>
          <h4>Make Distance Immaterial...cover any distance using Connect</h4>
          
            <button type="button" className='btnStart' onClick={()=> {navigate("/home")}}>Get Started</button>
          
        </div>
        
        <div className='imgSide'>
          <img src='./faceimg2.png' alt="mobile" className='faceimg'></img>
        </div>
      
        
      </div>
    </div>
  )
}

export default Landing
