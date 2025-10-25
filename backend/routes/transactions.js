const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all transactions for user (learner) or linked user (mentor viewing learner's transactions)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    let queryUserId = req.userId;
    
    // If mentor, get transactions of linked learner
    if (user.role === 'mentor' && user.linkedUserId) {
      queryUserId = user.linkedUserId;
    }

    const transactions = await Transaction.find({ userId: queryUserId })
      .sort({ date: -1 });
    
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction (only learners can create)
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (user.role !== 'learner') {
      return res.status(403).json({ error: 'Only learners can create transactions' });
    }

    const { payee, amount, category, upiId } = req.body;
    
    const transaction = new Transaction({
      userId: req.userId,
      payee,
      amount,
      category,
      upiId
    });

    await transaction.save();
    res.status(201).json({ transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transaction status (only learners can update their own)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, transactionId } = req.body;
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    transaction.status = status;
    if (transactionId) transaction.transactionId = transactionId;
    await transaction.save();

    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get flagged transactions
router.get('/flagged', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    let queryUserId = req.userId;
    
    // If mentor, get flagged transactions of linked learner
    if (user.role === 'mentor' && user.linkedUserId) {
      queryUserId = user.linkedUserId;
    }

    const transactions = await Transaction.find({
      userId: queryUserId,
      flagged: true
    }).sort({ date: -1 });
    
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    let queryUserId = req.userId;
    
    // If mentor, get stats of linked learner
    if (user.role === 'mentor' && user.linkedUserId) {
      queryUserId = user.linkedUserId;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: queryUserId,
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSpent = await Transaction.aggregate([
      {
        $match: {
          userId: queryUserId,
          status: 'completed',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      categoryStats: stats,
      totalSpent: totalSpent[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
