const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

// AI Explainer responses
const aiResponses = {
  upi: {
    keywords: ['upi', 'unified', 'payment', 'interface'],
    response: 'UPI (Unified Payments Interface) is a simple way to send money using your phone. Just enter the amount and confirm with your PIN. It\'s safe and instant! You don\'t need to remember bank account numbers.'
  },
  qr: {
    keywords: ['qr', 'code', 'scan', 'camera'],
    response: 'QR Code is like a special picture that contains payment information. Just point your phone camera at it, and it will show you who to pay and how much. It\'s faster than typing details.'
  },
  bill: {
    keywords: ['bill', 'electricity', 'water', 'pay'],
    response: 'A bill is money you need to pay for services like electricity, water, or phone. You can pay bills online using UPI to avoid going to offices. Keep bills saved for records.'
  },
  fraud: {
    keywords: ['fraud', 'safe', 'scam', 'cheat', 'security'],
    response: 'Safety tips: (1) Never share your PIN or OTP with anyone, (2) Always check the payee name before paying, (3) If someone calls asking for money urgently, verify with family first, (4) Banks never ask for passwords on phone.'
  },
  pin: {
    keywords: ['pin', 'password', 'otp'],
    response: 'PIN is your secret 4-6 digit password for payments. Never share it with anyone - not even bank staff. OTP is a one-time code sent to your phone for extra security. Use it only when YOU are making a payment.'
  },
  refund: {
    keywords: ['refund', 'return', 'money back'],
    response: 'If a payment fails or you paid wrong amount, refunds usually come back in 3-7 days. Check your bank statement. If money is not returned, contact your bank with the transaction ID.'
  }
};

// Ask AI
router.post('/ask', auth, async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const questionLower = question.toLowerCase();
    
    // Find matching response
    let response = 'I\'m here to help! Ask me about UPI, QR codes, bills, staying safe from fraud, or how payments work. Keep your questions simple and I\'ll explain clearly.';
    
    for (const [key, data] of Object.entries(aiResponses)) {
      if (data.keywords.some(keyword => questionLower.includes(keyword))) {
        response = data.response;
        break;
      }
    }

    res.json({ 
      question,
      answer: response,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get common questions
router.get('/questions', auth, async (req, res) => {
  try {
    const commonQuestions = [
      'What is UPI?',
      'How to scan QR code?',
      'How to stay safe from fraud?',
      'What is PIN and OTP?',
      'How to pay bills online?',
      'What if payment fails?'
    ];

    res.json({ questions: commonQuestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
