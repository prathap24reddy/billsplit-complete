import React from 'react';
import { Link } from 'react-router-dom';

function Header({ isAuthenticated, onLogout }) {
  return (
    <header className='item'>
    
      <div><Link to="/"><h1>BillSplit.</h1></Link></div>
      <div>
        {isAuthenticated ? (
          <button onClick={onLogout} className='logout'><p>Logout</p></button>
            ) : (
            <p><Link to="/login">Login</Link></p>
        )}
      </div>
    </header>
  );
}

export default Header;