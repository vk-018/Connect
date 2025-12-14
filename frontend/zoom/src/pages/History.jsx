import React from 'react'
import { useContext,useEffect,useState } from 'react'
import { AuthContext } from '../contexts/AuthContext.jsx'
import { Link } from 'react-router-dom';

export default function History() {

    let [meetData ,setmeetData]= useState([]);
    const {getHistoryOfUser}= useContext(AuthContext);

    useEffect(() => {
        async function meetData(){
          let meetData= await getHistoryOfUser();
          setmeetData(meetData.meetingData);
          //console.log(meetData.meetingData);
        }
        meetData();
    },[]) ;



  return (
    <div className='historyPage'>
      <nav className='historyPagenavbar'>
        <div className='homePagenavHeader'>
          <h2 style={{color:"#7DD3FC"}}><span className='homeLogo' style={{color:'orange',cursor:"pointer"}}><Link to="/" style={{all: "unset",display: "revert"}}>Connect</Link></span> with The World</h2>
        </div>
      </nav>

      <div className='historyPageMainContainer'>
        <div className='historyHeader'>
            <p style={{color:"black",fontSize: "1.5rem", fontWeight:700}}>My Video Call Details</p>
        </div>
        <div className='historyDetails'>
          <span className='heading'>Date</span> <span className='heading'>Time</span> <span className='heading'>Meeting Code</span>
        </div>  
        {meetData.length > 0 ? 
        <div className='historyDataContainer'>

        {meetData.map((call,index)=>{
            const dateObj = new Date(call.date);       //converts date into a js date obj format
            const date = dateObj.toLocaleDateString("en-CA");
            const time = dateObj.toLocaleTimeString("en-GB");
            //console.log(dateObj,date,time);
            
          return(
            <div key={index} className='callDetail'>
                <p className='calldata'>{date}</p>
                <p className='calldata'>{time}</p>
                <p className='calldata'>{call.meetingCode}</p>
            </div>
          )
        })}
        </div>:
        <p style={{color: "black",padding: "1rem 0rem 1rem 0rem"}}>No Calls made yet....</p>}

      </div>
    </div>
  )
}
