


import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from '../fetchSetup';

const logoutapi = process.env.REACT_APP_LOGOUT_API; 
const SessionTimeoutWrapper = ({ children}) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  
  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const userId = sessionStorage.getItem("userId");

      await apiRequest(`${logoutapi}/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Session expired. Redirecting to login...");

      // Clear frontend session
      sessionStorage.clear();
      localStorage.clear();
      navigate("/Login");
    } catch (error) {
      console.error("Logout failed:", error);
      sessionStorage.clear();
      localStorage.clear();
      navigate("/Login");
    }
  };

  // 45 minutes = 2700000 ms
  useEffect(() => {
    const startTimeout = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleLogout, 2700000);
    };

    startTimeout();

    // Reset timeout on user activity
    const events = ["mousemove", "keypress", "click"];
    events.forEach((event) => window.addEventListener(event, startTimeout));

    return () => {
      clearTimeout(timeoutRef.current);
      events.forEach((event) =>
        window.removeEventListener(event, startTimeout)
      );
    };
  }, []);

  return children;
};

export default SessionTimeoutWrapper;
