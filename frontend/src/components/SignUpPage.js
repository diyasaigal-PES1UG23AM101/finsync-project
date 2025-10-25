import React, { useState } from 'react';
import { ArrowLeft, User, Shield, Copy, Check } from 'lucide-react';
import api from '../utils/api';

const SignUpPage = ({ setCurrentPage, onSignUp }) => {
  const [userRole, setUserRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    finsyncCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSignUp = async () => {
    if (!userRole) {
      setError('Please select a role (Learner or Mentor)');
      return;
    }

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Mentor-specific validation
    if (userRole === 'mentor' && !formData.finsyncCode.trim()) {
      setError('Please enter the FinSync Code from your family member (learner)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: userRole,
        finsyncCode: userRole === 'mentor' ? formData.finsyncCode.trim() : undefined
      });

      // If learner, show success screen with FinSync Code
      if (userRole === 'learner') {
        setGeneratedCode(response.user.finsyncCode);
        setShowSuccess(true);
      } else {
        // If mentor, proceed to login
        onSignUp(response.user, response.token);
      }
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToLogin = () => {
    setCurrentPage('login');
  };

  // Success screen for learner with FinSync Code
  if (showSuccess && userRole === 'learner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Account Created!</h2>
            <p className="text-gray-600 text-lg">Welcome, {formData.name}!</p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-6 mb-6">
            <p className="text-gray-700 text-lg font-semibold mb-3 text-center">
              Your FinSync Code
            </p>
            <div className="bg-white rounded-xl p-4 mb-4">
              <div className="text-4xl font-bold text-purple-600 text-center tracking-wider">
                {generatedCode}
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
            >
              {codeCopied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 mb-6">
            <p className="text-blue-800 text-base leading-relaxed">
              📱 <strong>Important:</strong> Share this code with your family member (mentor) so they can link their account to yours and help monitor your transactions.
            </p>
          </div>

          <button
            onClick={handleProceedToLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl text-xl font-semibold shadow-lg active:scale-95 transition"
          >
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 mt-8 animate-fade-in">
        <button 
          onClick={() => setCurrentPage('landing')} 
          className="mb-4 text-gray-600 hover:text-gray-800 transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Create Account</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 text-lg font-semibold mb-3">I am a:</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setUserRole('learner')}
              className={`p-6 rounded-xl border-2 transition ${
                userRole === 'learner' 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-gray-300 bg-white hover:border-purple-300'
              }`}
            >
              <User className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="font-semibold text-lg">Learner</div>
              <div className="text-sm text-gray-600">Elder</div>
            </button>
            
            <button
              onClick={() => setUserRole('mentor')}
              className={`p-6 rounded-xl border-2 transition ${
                userRole === 'mentor' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
            >
              <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="font-semibold text-lg">Mentor</div>
              <div className="text-sm text-gray-600">Youth</div>
            </button>
          </div>
        </div>

        {userRole === 'learner' && (
          <div className="bg-purple-50 border border-purple-300 rounded-xl p-4 mb-4 text-sm text-purple-800">
            ℹ️ You'll receive a <strong>FinSync Code</strong> after signup to share with your mentor.
          </div>
        )}

        {userRole === 'mentor' && (
          <div className="bg-blue-50 border border-blue-300 rounded-xl p-4 mb-4 text-sm text-blue-800">
            ℹ️ You need a <strong>FinSync Code</strong> from your family member (learner) to create your account.
          </div>
        )}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-4 border-2 border-gray-300 rounded-xl mb-4 text-lg focus:border-purple-500 focus:outline-none"
        />
        
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
          placeholder="Password (min 6 characters)"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-4 border-2 border-gray-300 rounded-xl mb-4 text-lg focus:border-purple-500 focus:outline-none"
        />

        {userRole === 'mentor' && (
          <input
            type="text"
            name="finsyncCode"
            placeholder="Enter FinSync Code (e.g., FSABC123)"
            value={formData.finsyncCode}
            onChange={handleChange}
            className="w-full p-4 border-2 border-blue-400 rounded-xl mb-4 text-lg focus:border-blue-600 focus:outline-none font-mono uppercase"
            maxLength={8}
          />
        )}

        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl text-xl font-semibold shadow-lg active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className="text-center mt-4 text-gray-600">
          Already have an account?{' '}
          <button
            onClick={() => setCurrentPage('login')}
            className="text-purple-600 font-semibold hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
