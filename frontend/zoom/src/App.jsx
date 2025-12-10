import './App.css'
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Authentication from './pages/Authentication.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import VideoMeetComponent from './pages/VideoMeet.jsx';
import MyFormComponent from './form.jsx';
import Stopwatch from './UseRef.jsx';
function App() {
  

  return (
    <div className="App">
     
     <Router>              
        <AuthProvider>                 {/*   declare below router to acess use Navigate and abv routes coz this is not an route */}
        <Routes>
          <Route path='/' element={<Landing/>} /> 
          <Route path='/auth' element={<Authentication/>}/>
          {/* using slug to create a dynamic route */}
          <Route path='/:url' element={<VideoMeetComponent/>}/>
        </Routes>
        </AuthProvider> 
      </Router> 

      
    </div>
  )
}

export default App
