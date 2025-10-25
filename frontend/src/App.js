import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import LearnerDashboard from './components/LearnerDashboard';
import MentorDashboard from './components/MentorDashboard';
import api from './utils/api';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      const user = JSON.parse(storedUser);
      setToken(storedToken);
      setUserName(user.name);
      setUserRole(user.role);
      setUserId(user.id);
      setCurrentPage(user.role === 'learner' ? 'learner-dashboard' : 'mentor-dashboard');
    }
  }, []);

  const handleLogin = (userData, authToken) => {
    setToken(authToken);
    setUserName(userData.name);
    setUserRole(userData.role);
    setUserId(userData.id);
    
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setCurrentPage(userData.role === 'learner' ? 'learner-dashboard' : 'mentor-dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setUserName('');
    setUserRole(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentPage('landing');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage setCurrentPage={setCurrentPage} />;
      
      case 'signup':
        return (
          <SignUpPage 
            setCurrentPage={setCurrentPage}
            onSignUp={handleLogin}
          />
        );
      
      case 'login':
        return (
          <LoginPage 
            setCurrentPage={setCurrentPage}
            onLogin={handleLogin}
          />
        );
      
      case 'learner-dashboard':
        return (
          <LearnerDashboard 
            userName={userName}
            userId={userId}
            token={token}
            onLogout={handleLogout}
            setCurrentPage={setCurrentPage}
          />
        );
      
      case 'mentor-dashboard':
        return (
          <MentorDashboard 
            userName={userName}
            userId={userId}
            token={token}
            onLogout={handleLogout}
            setCurrentPage={setCurrentPage}
          />
        );
      
      default:
        return <LandingPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;
