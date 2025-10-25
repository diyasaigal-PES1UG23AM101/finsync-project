import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';

const LoginPage = ({ setCurrentPage, onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      onLogin(response.user, response.token);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Demo login for hackathon
  const handleDemoLogin = async (role) => {
    const demoCredentials = {
      learner: { email: 'grandma@finsync.com', password: 'password123' },
      mentor: { email: 'raj@finsync.com', password: 'password123' }
    };

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', demoCredentials[role]);
      onLogin(response.user, response.token);
    } catch (err) {
      setError('Demo login failed. Make sure backend is running and seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 mt-8 animate-fade-in">
        <button 
          onClick={() => setCurrentPage('landing')} 
          className="mb-4 text-gray-600 hover:text-gray-800 transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome Back</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-4 border-2 border-gray-300 rounded-xl mb-4 text-lg focus:border-purple-500 focus:outline-none"
        />
        
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          className="w-full p-4 border-2 border-gray-300 rounded-xl mb-6 text-lg focus:border-purple-500 focus:outline-none"
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl text-xl font-semibold shadow-lg active:scale-95 transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or try demo accounts</span>
          </div>
        </div>

        <button
          onClick={() => handleDemoLogin('learner')}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-3 rounded-xl text-lg font-semibold mb-3 shadow-md active:scale-95 transition disabled:opacity-50"
        >
          Demo: Login as Learner
        </button>

        <button
          onClick={() => handleDemoLogin('mentor')}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg font-semibold shadow-md active:scale-95 transition disabled:opacity-50"
        >
          Demo: Login as Mentor
        </button>

        <p className="text-center mt-4 text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={() => setCurrentPage('signup')}
            className="text-purple-600 font-semibold hover:underline"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

