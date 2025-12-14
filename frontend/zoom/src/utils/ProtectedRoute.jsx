import { Navigate, Outlet } from "react-router-dom";
//this is low level security for front ui only
const ProtectedRoute = () => {   // this is a wrapper for protected components-> it decides weather page is allowed to render or not
   const isAuthenticated = () => {
            if(localStorage.getItem("jwtoken")) {
                console.log("authenticated",localStorage.getItem("jwtoken"));
                return true;
            } 
            return false;
        }

        if (!isAuthenticated()) {
          return <Navigate to="/auth" replace />;      //Navigate works better than UseNavigate for protected Routes
        }

    return <Outlet />;
};

const UnProtectedRoute = () => {   // this is a wrapper for unprotected components-> it decides weather page is allowed to render or not
   const isAuthenticated = () => {
            if(localStorage.getItem("jwtoken")) {
                console.log("authenticated",localStorage.getItem("jwtoken"));
                return true;
            } 
            return false;
        }

        if (isAuthenticated()) {
          return <Navigate to="/home" replace />;      //Navigate works better than UseNavigate for protected Routes
        }

    return <Outlet />;
};

//write route to avoid rendering of a page if user is already logged in 

export  {ProtectedRoute,UnProtectedRoute};
