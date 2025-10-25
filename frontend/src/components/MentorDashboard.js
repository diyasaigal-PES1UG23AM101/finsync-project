import React, { useState, useEffect } from 'react';
import { Bell, TrendingUp, LogOut, User, Shield } from 'lucide-react';
import api from '../utils/api';

const MentorDashboard = ({ userName, userId, token, onLogout, setCurrentPage }) => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [linkedUser, setLinkedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get user info
      const userData = await api.get('/auth/me', token);
      setUserInfo(userData.user);

      // Get linked user info
      const linkedData = await api.get('/auth/linked-user', token);
      setLinkedUser(linkedData.linkedUser);

      // Get transactions
      const txData = await api.get('/transactions', token);
      setTransactions(txData.transactions);

      // Get stats
      const statsData = await api.get('/transactions/stats', token);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const flaggedTransactions = transactions.filter(t => t.flagged && t.status === 'pending');
  const completedCount = transactions.filter(t => t.status === 'completed').length;
  const totalSpent = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // Category data for chart
  const categoryData = {
    'bills': { amount: 0, color: 'bg-blue-500' },
    'healthcare': { amount: 0, color: 'bg-red-500' },
    'groceries': { amount: 0, color: 'bg-green-500' },
    'other': { amount: 0, color: 'bg-purple-500' }
  };

  transactions.forEach(t => {
    if (categoryData[t.category]) {
      categoryData[t.category].amount += t.amount;
    }
  });

  const maxAmount = Math.max(...Object.values(categoryData).map(d => d.amount), 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onLogout} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
            <LogOut className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">Family Monitor</h1>
          <div className="w-10"></div>
        </div>
        <p className="text-xl">Protecting your loved ones 🛡️</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Linked User Info */}
        {linkedUser ? (
          <div className="bg-white p-5 rounded-2xl shadow-md mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800">Monitoring</h3>
                <p className="text-lg text-gray-700">{linkedUser.name}</p>
                <p className="text-sm text-gray-500">{linkedUser.email}</p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 border-2 border-yellow-400 p-5 rounded-2xl mb-6">
            <h3 className="text-lg font-bold text-yellow-800 mb-2">No Learner Connected</h3>
            <p className="text-yellow-700">You need a FinSync Code from a learner to start monitoring.</p>
          </div>
        )}

        {/* Alerts */}
        {flaggedTransactions.length > 0 && (
          <div className="bg-red-50 border-2 border-red-400 p-5 rounded-2xl mb-6">
            <div className="flex items-center mb-3">
              <Bell className="w-6 h-6 mr-2 text-red-600" />
              <h3 className="text-xl font-bold text-red-800">
                {flaggedTransactions.length} Alert{flaggedTransactions.length > 1 ? 's' : ''}
              </h3>
            </div>
            {flaggedTransactions.map(transaction => (
              <div key={transaction._id} className="bg-white p-4 rounded-xl mb-3">
                <div className="font-bold text-lg text-gray-800">{transaction.payee}</div>
                <div className="text-red-600 font-semibold text-xl">₹{transaction.amount}</div>
                <div className="text-gray-600">{new Date(transaction.date).toLocaleDateString()}</div>
                <div className="text-sm text-gray-700 mt-2 bg-red-50 p-2 rounded">
                  ⚠️ {transaction.flagReason || 'Unusual transaction detected'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-md">
            <div className="text-gray-600 text-sm mb-1">Total Spent</div>
            <div className="text-3xl font-bold text-purple-600">₹{totalSpent}</div>
            <div className="text-xs text-gray-500 mt-1">This month</div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md">
            <div className="text-gray-600 text-sm mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-600">
              {completedCount}/{transactions.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Transactions</div>
          </div>
        </div>

        {/* Monthly Spending Chart */}
        {transactions.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-md mb-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">Spending by Category</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(categoryData).map(([category, data]) => {
                const percentage = (data.amount / maxAmount) * 100;
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 capitalize">{category}</span>
                      <span className="font-semibold">₹{data.amount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${data.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Transactions */}
        <h3 className="text-2xl font-bold text-gray-800 mb-3">All Transactions</h3>
        
        {transactions.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-md text-center">
            <p className="text-gray-600 text-lg">No transactions to monitor yet</p>
          </div>
        ) : (
          transactions.map(transaction => (
            <div
              key={transaction._id}
              className="bg-white p-5 rounded-2xl shadow-md mb-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-bold text-gray-800">{transaction.payee}</div>
                  <div className="text-gray-600">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-sm font-semibold ${
                      transaction.status === 'completed' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {transaction.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                    </span>
                    {transaction.flagged && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        Flagged
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-800">₹{transaction.amount}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;