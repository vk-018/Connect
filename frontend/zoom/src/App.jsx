import './App.css'
import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Authentication from './pages/Authentication.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import VideoMeetComponent from './pages/VideoMeet.jsx';
import Home from './pages/Home.jsx';
import History from './pages/History.jsx';
import {ProtectedRoute,UnProtectedRoute} from './utils/ProtectedRoute.jsx';
import { Navigate } from 'react-router-dom';

function App() {
  

  return (
    <div className="App">
     
     <Router>              
        <AuthProvider>                 {/*   declare below router to acess use Navigate and abv routes coz this is not an route */}
        <Routes>
          <Route element={<UnProtectedRoute/>}>
            <Route path='/' element={<Landing/>} /> 
          </Route>
          
          <Route path='/auth' element={<Authentication/>}/>
          {/* using slug to create a dynamic route */}
          <Route path='/meet/:url' element={<VideoMeetComponent/>}/>
          {/* protect private routes */}
          <Route element={<ProtectedRoute/>}>
            <Route path='/home' element={<Home/>}/>
            <Route path='/history' element={<History/>}/>
          </Route>

          {/* 🔥 REQUIRED FOR RENDER  handling all the wide card redirects*/}
         {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
        </Routes>
        </AuthProvider> 
        
      </Router> 

      
    </div>
  )
}

export default App
