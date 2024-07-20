import React, { useState } from 'react';
import axios from 'axios';

function Signup({ onSignup, baseAPI }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post(`${baseAPI}/signup`, { name, email, password });
      alert(response.data.message);  // Alert the user about successful signup

      // Clear the form
      setName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.response?.data?.error || 'An error occurred during signup');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='box'>
      {error && <div className="error">{error}</div>}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="UserName"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit" className='button'><p>Sign Up</p></button>
    </form>
  );
}

export default Signup;
