import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import BillSplit from "./pages/BillSplit";
import AuthPage from "./pages/AuthPage";
import Header from "./Header";
import Footer from "./Footer";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const baseAPI="https://billsplit-i7tp.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserData(decoded);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Invalid token", error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = (token) => {
    try {
      const decoded = jwtDecode(token);
      setIsAuthenticated(true);
      setUserData(decoded);
      localStorage.setItem('token', token);
    } catch (error) {
      console.error("Error decoding token", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserData(null);
  };

  return (
    <Router>
      <div className="App">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <Routes>
          <Route 
            path="/" 
            element={isAuthenticated ? <BillSplit userData={userData} baseAPI={baseAPI}/> : <Navigate to="/login" />} 
          />
          <Route 
            path="/login" 
            element={!isAuthenticated ? <AuthPage onLogin={handleLogin} onSignup={handleLogin} baseAPI={baseAPI}/> : <Navigate to="/" />} 
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
