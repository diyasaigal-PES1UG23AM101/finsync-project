import React from 'react';
import { CreditCard } from 'lucide-react';

const LandingPage = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-fade-in">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">FinSync</h1>
          <p className="text-xl text-purple-600 font-semibold mb-4">Financially Inclusive, Family-Friendly</p>
        </div>
        
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <p className="text-gray-700 text-lg leading-relaxed">
            Empowering elders with digital payments while keeping family connected. Learn, transact, and stay safe together.
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('signup')}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-xl text-xl font-semibold mb-3 shadow-lg active:scale-95 transition"
        >
          Sign Up
        </button>
        
        <button
          onClick={() => setCurrentPage('login')}
          className="w-full bg-white border-2 border-purple-600 text-purple-600 py-4 rounded-xl text-xl font-semibold shadow-md active:scale-95 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
