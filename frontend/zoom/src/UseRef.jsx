import { useState, useRef } from 'react';

export default function Stopwatch() {
  const [startTime, setStartTime] = useState(null);                   //to note the start when we press start
  const [now, setNow] = useState(null);                           //to store current time
  const intervalRef = useRef(null);                             //to store id of setInterval to use it to clear it

  /*When Start is clicked:
It sets both startTime and now to the current timestamp (in milliseconds).
It clears any old timer that might still be running (safety check).
It starts a new timer using setInterval() that:
Runs every 10 milliseconds (0.01 seconds).
Updates now with the current time — triggering re-renders.
This effectively makes the UI show the elapsed time live.*/

  function handleStart() {
    setStartTime(Date.now());
    setNow(Date.now());

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 10);    //change state 'now; in every 10 ms
  }

  function handleStop() {           //keep changing untill this fn is called
    clearInterval(intervalRef.current);
  }

  let secondsPassed = 0;
   if (startTime != null && now != null) {
    secondsPassed = (now - startTime) / 1000;        //convert ms to s
  }
//elapsed time is rounded to three digit
  return (
    <>
      <h1>Time passed: {secondsPassed.toFixed(3)}</h1>         
      <button onClick={handleStart}>
        Start
      </button>
      <button onClick={handleStop}>
        Stop
      </button>
    </>
  );
}