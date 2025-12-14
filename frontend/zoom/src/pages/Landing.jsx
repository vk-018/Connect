import React from 'react'
import { useState } from 'react'
import {  useNavigate } from 'react-router-dom';
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
          <h2><span className='homeLogo' style={{color:'orange',cursor:"pointer"}}><a href="/" style={{all: "unset",display: "revert"}}>Connect</a></span> with The World</h2>
        </div>
          
        <div className="navList">
          <a onClick={guestRandom}  className='landanchor'>Join as Guest</a>
          <a href="/auth" className='landanchor'>Register</a>
          <a href="/auth"  className='landanchor'>Login</a>
        </div>
      </nav>

      <div className="landingPageMainContainer">
        <div className='textSide'>
          <h1><span style={{color:'orange'}}>Connect</span> With Your Loved Ones</h1>
          <h4>Make Distance Immaterial...cover any distance using Connect</h4>
          <a href="/home">
            <button type="button" className='btnStart'>Get Started</button>
          </a>
        </div>
        
        <div className='imgSide'>
          <img src='./faceimg2.png' alt="mobile" className='faceimg'></img>
        </div>
      
        
      </div>
    </div>
  )
}

export default Landing
