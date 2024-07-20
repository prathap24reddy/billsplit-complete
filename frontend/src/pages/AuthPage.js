import React from 'react';
import Login from '../components/Login';
import Signup from '../components/Signup';

function AuthPage({ onLogin, onSignup, baseAPI }) {
  return (
    <div className="box">
        <h2 className="box"id="heading">Login</h2>
        <Login onLogin={onLogin} baseAPI={baseAPI} />
      
      <h2 className="box"id="heading">Sign Up</h2>
      <Signup onSignup={onSignup} baseAPI={baseAPI}/>
    </div>
  );
}

export default AuthPage;