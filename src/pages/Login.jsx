import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const navigate = useNavigate();
  
  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      setIsUserLoggedIn(true);
      navigate('/project');
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check credentials
    if (username === 'webreich' && password === '1234') {
      // Store login state in localStorage for persistent login
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      
      setIsUserLoggedIn(true);
      
      // Redirect to Project page on successful login
      navigate('/project');
    } else {
      setError('Invalid username or password');
    }
  };

  // Logout function - can be called from other components using a button
  // You can export this function if needed
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    setIsUserLoggedIn(false);
    navigate('/login');
  };

  // Login form - only shown if user is not logged in
  if (!isUserLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-600">CRM Software</h1>
            <p className="mt-2 text-sm text-black">Enter your credentials to access the system</p>
          </div>
          
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-black">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="relative block w-full px-3 py-2 mt-1 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Username"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative block w-full px-3 py-2 mt-1 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md group hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  // This part won't typically render since we navigate away on login
  return null;
};

// Export the Login component as default
export default Login;

// Also export the logout function for use in other components
export const logout = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  window.location.href = '/login'; // Force redirect
};