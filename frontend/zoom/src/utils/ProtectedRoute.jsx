import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {   // this is a wrapper for protected components-> it decides weather page is allowed to render or not
    const isAuthenticated = () => {
        return !!localStorage.getItem("token");         //  !! converts the value to a boolean:
    };

    if (!isAuthenticated()) {                  //if not token exist dont render the child component redirect to somewhere else 
        return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
