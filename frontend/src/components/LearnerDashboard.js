// frontend/src/components/LearnerDashboard.js
import React, { useState, useEffect } from 'react';
import { QrCode, MessageSquare, LogOut, Copy, Check, Users } from 'lucide-react';
import api from '../utils/api';
import QRScannerModal from './QRScannerModal';
import AmountModal from './AmountModal';


/* ---------- Extractors: keep scanned UPI URI EXACT; derive query separately ---------- */
const extractUpiParts = (raw) => {
  if (!raw) return null;
  const s = String(raw).trim();


  // 1) Exact upi://pay?... (keep untouched)
  const upiMatch = s.match(/upi:\/\/pay\?[^#\s]+/i);
  if (upiMatch) {
    const rawUpiUri = upiMatch[0];
    const query = rawUpiUri.split('?')[1] || '';
    return { rawUpiUri, query };
  }


  // 2) intent:// that contains upi://pay?... inside
  const intentEmbedded = s.match(/upi:\/\/pay\?[^;"\s]+/i);
  if (intentEmbedded) {
    const rawUpiUri = intentEmbedded[0];
    const query = rawUpiUri.split('?')[1] || '';
    return { rawUpiUri, query };
  }


  // 3) raw query "pa=...&pn=..."
  if (/(^|[?&])pa=/.test(s)) {
    const query = s.includes('?') ? s.split('?').pop() : s;
    const rawUpiUri = `upi://pay?${query}`;
    return { rawUpiUri, query };
  }


  return null;
};


const pickMeta = (upiQuery) => {
  try {
    const p = new URLSearchParams(upiQuery);
    const pn = p.get('pn') || '';
    return { pn };
  } catch {
    return null;
  }
};


/* ---------- String-safe param setter: touch ONLY the 'am' (and ensure cu) ---------- */
const setParamInQuery = (q, key, value) => {
  // do not re-encode entire query; only encode the value we set
  const enc = encodeURIComponent(String(value));
  const re = new RegExp(`(^|&)${key}=([^&]*)`, 'i');
  if (re.test(q)) {
    return q.replace(re, (m, p1) => `${p1}${key}=${enc}`);
  }
  return q.length ? `${q}&${key}=${enc}` : `${key}=${enc}`;
};
const ensureCurrencyINR = (q) => {
  if (/(^|&)cu=([^&]*)/i.test(q)) return q;
  return q.length ? `${q}&cu=INR` : 'cu=INR';
};


/* ---------- Platform helpers ---------- */
const isAndroid = /Android/i.test(navigator.userAgent || '');
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');


/* ---------- Open GPay ONLY (no chooser) ---------- */
const openGooglePayOnly = (upiQueryWithAmt) => {
  // Build GPay URLs WITHOUT re-encoding the whole string
  const gpayScheme = `gpay://upi/pay?${upiQueryWithAmt}`;
  const tezScheme  = `tez://upi/pay?${upiQueryWithAmt}`; // legacy fallback if needed
  const androidIntent =
    `intent://pay?${upiQueryWithAmt}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;` +
    `S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user')};end`;


  if (isAndroid) {
    // Try direct package intent first (most reliable to target GPay)
    let switched = false;
    const onHide = () => { switched = true; cleanup(); };
    const cleanup = () => document.removeEventListener('visibilitychange', onHide);
    document.addEventListener('visibilitychange', onHide, { once: true });


    window.location.href = androidIntent;


    setTimeout(() => {
      if (!switched && document.visibilityState === 'visible') {
        // Try gpay:// then give up (no generic UPI, as requested)
        window.location.href = gpayScheme;
        setTimeout(() => {
          if (!switched && document.visibilityState === 'visible') {
            alert('Could not open Google Pay. Please install/enable GPay and try again.');
          }
          cleanup();
        }, 900);
      } else {
        cleanup();
      }
    }, 1200);
    return;
  }


  if (isIOS) {
    let switched = false;
    const onHide = () => { switched = true; cleanup(); };
    const cleanup = () => document.removeEventListener('visibilitychange', onHide);
    document.addEventListener('visibilitychange', onHide, { once: true });


    // Try gpay:// then tez:// (no generic UPI)
    window.location.href = gpayScheme;
    setTimeout(() => {
      if (!switched && document.visibilityState === 'visible') {
        window.location.href = tezScheme;
        setTimeout(() => {
          if (!switched && document.visibilityState === 'visible') {
            alert('Could not open Google Pay. Make sure it’s installed.');
          }
          cleanup();
        }, 900);
      } else {
        cleanup();
      }
    }, 900);
    return;
  }


  // Desktop/others: nothing else to do
  alert('This flow requires Google Pay on a mobile device.');
};


const LearnerDashboard = ({ userName, userId, token, onLogout, setCurrentPage }) => {
  const [transactions, setTransactions] = useState([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);


  // Amount modal state
  const [amountOpen, setAmountOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');   // original query from QR (string)
  const [pendingPayee, setPendingPayee] = useState('');   // for UI


  useEffect(() => {
    fetchTransactions();
    fetchUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const fetchUserInfo = async () => {
    try {
      const data = await api.get('/auth/me', token);
      setUserInfo(data.user);
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };


  const fetchTransactions = async () => {
    try {
      const data = await api.get('/transactions', token);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };


  const handleAIQuestion = async () => {
    if (!aiQuestion.trim()) return;
    setLoading(true);
    try {
      const data = await api.post('/ai/ask', { question: aiQuestion }, token);
      setAiResponse(data.answer);
    } catch (error) {
      setAiResponse("Sorry, I couldn't process your question. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const markAsDone = async (transactionId) => {
    try {
      await api.patch(`/transactions/${transactionId}/status`, { status: 'completed' }, token);
      await fetchTransactions();
    } catch (error) {
      alert('Failed to update transaction');
    }
  };


  // Scan QR → extract raw query → prompt for amount → open GPay with amount set
  const handleQRDetected = (scanned) => {
    setShowQRScanner(false);


    const parts = extractUpiParts(scanned);
    if (!parts) {
      alert(`Scanned code:\n${scanned}\n\nThis doesn't look like a UPI payment QR.`);
      return;
    }


    setPendingQuery(parts.query); // keep only the query to tweak 'am' safely
    const meta = pickMeta(parts.query);
    setPendingPayee(meta?.pn || '');
    setAmountOpen(true);
  };


  const onAmountConfirm = (amtString) => {
    setAmountOpen(false);


    // Touch ONLY 'am' and ensure cu=INR; keep all other params exactly as scanned order-wise
    let q = pendingQuery || '';
    q = setParamInQuery(q, 'am', amtString);
    q = ensureCurrencyINR(q);


    // Now open Google Pay only
    openGooglePayOnly(q);
  };


  const copyCode = () => {
    if (userInfo?.finsyncCode) {
      try {
        navigator.clipboard.writeText(userInfo.finsyncCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } catch {}
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onLogout} className="text-white hover:bg-white/20 p-2 rounded-lg transition" aria-label="Logout">
            <LogOut className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold">My Payments</h1>
          <button
            onClick={() => setShowCodeModal(true)}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
            aria-label="Show FinSync Code"
          >
            <Users className="w-6 h-6" />
          </button>
        </div>


        <p className="text-xl">Hello, {userName}! 👋</p>
        {userInfo?.linkedUserId && (
          <p className="text-sm opacity-90 mt-1">
            Protected by: {userInfo.linkedUserId.name} 🛡
          </p>
        )}
      </div>


      {/* FinSync Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full animate-fade-in">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Your FinSync Code</h3>


            {userInfo?.linkedUserId ? (
              <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-4">
                <p className="text-green-800 font-semibold mb-2">✓ Mentor Connected</p>
                <p className="text-gray-700">{userInfo.linkedUserId.name}</p>
                <p className="text-sm text-gray-600">{userInfo.linkedUserId.email}</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  ⚠ No mentor linked yet. Share your code with a family member.
                </p>
              </div>
            )}


            <div className="bg-purple-50 rounded-xl p-4 mb-4">
              <p className="text-gray-600 text-sm mb-2 text-center">Your Code:</p>
              <div className="bg-white rounded-lg p-3 mb-3">
                <div className="text-3xl font-bold text-purple-600 text-center tracking-wider">
                  {userInfo?.finsyncCode || 'Loading...'}
                </div>
              </div>
              <button
                onClick={copyCode}
                className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-95 transition"
              >
                {codeCopied ? (<><Check className="w-5 h-5" />Copied!</>) : (<><Copy className="w-5 h-5" />Copy Code</>)}
              </button>
            </div>


            <button
              onClick={() => setShowCodeModal(false)}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold active:scale-95 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}


      <div className="px-4 space-y-4">
        {/* Quick Actions — Scan QR */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <button
            onClick={() => setShowQRScanner(true)}
            className="bg-white p-6 rounded-2xl shadow-md active:scale-95 transition hover:shadow-lg"
          >
            <QrCode className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="font-semibold text-lg text-center">Scan QR</div>
          </button>
        </div>


        {/* AI Helper */}
        <div className="bg-gradient-to-r from-green-400 to-blue-500 p-6 rounded-2xl shadow-lg text-white mb-6">
          <div className="flex items-center mb-3">
            <MessageSquare className="w-6 h-6 mr-2" />
            <h3 className="text-xl font-bold">Ask AI Helper</h3>
          </div>
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder="Ask: What is UPI?"
            onKeyDown={(e) => e.key === 'Enter' && handleAIQuestion()}
            className="w-full p-4 rounded-xl mb-3 text-gray-800 text-lg focus:outline-none"
          />
          <button
            onClick={handleAIQuestion}
            disabled={loading}
            className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold text-lg active:scale-95 transition disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Get Answer'}
          </button>
          {aiResponse && (
            <div className="mt-4 bg-white text-gray-800 p-4 rounded-xl text-lg leading-relaxed">
              {aiResponse}
            </div>
          )}
        </div>


        {/* Transactions */}
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          {transactions.filter(t => t.status === 'pending').length > 0 ? 'Pending Bills' : 'Recent Transactions'}
        </h3>


        {transactions.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-md text-center">
            <p className="text-gray-600 text-lg">No transactions yet</p>
          </div>
        ) : (
          transactions.map(transaction => (
            <div
              key={transaction._id}
              className={`bg-white p-5 rounded-2xl shadow-md mb-3 ${transaction.flagged ? 'border-2 border-red-400' : ''}`}
            >
              {transaction.flagged && (
                <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-3 text-sm font-semibold">
                  ⚠ {transaction.flagReason || 'Unusual transaction - verify with family'}
                </div>
              )}


              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xl font-bold text-gray-800">{transaction.payee}</div>
                  <div className="text-gray-600 text-lg">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600">₹{transaction.amount}</div>
              </div>


              {transaction.status === 'pending' ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* "Pay Now" via amount prompt → GPay only */}
                  <button
                    onClick={() => {
                      const query = new URLSearchParams({
                        pa: 'merchant@upi',
                        pn: transaction.payee,
                        cu: 'INR', // base; we'll override/add 'am' in modal
                      }).toString();
                      setPendingQuery(query);
                      setPendingPayee(transaction.payee || '');
                      setAmountOpen(true);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-lg active:scale-95 transition"
                  >
                    Pay Now
                  </button>


                  <button
                    onClick={() => markAsDone(transaction._id)}
                    className="bg-green-500 text-white py-3 rounded-xl font-semibold text-lg active:scale-95 transition"
                  >
                    Mark Done
                  </button>
                </div>
              ) : (
                <div className="bg-green-100 text-green-700 py-3 rounded-xl text-center font-semibold text-lg">
                  ✓ Completed
                </div>
              )}
            </div>
          ))
        )}
      </div>


      {/* Modals */}
      {showQRScanner && (
        <QRScannerModal
          onClose={() => setShowQRScanner(false)}
          onDetected={handleQRDetected}
        />
      )}


      <AmountModal
        open={amountOpen}
        payeeName={pendingPayee}
        onClose={() => setAmountOpen(false)}
        onConfirm={onAmountConfirm}
      />
    </div>
  );
};


export default LearnerDashboard;