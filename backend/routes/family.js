const express = require('express');
const Family = require('../models/Family');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

// Get family members
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user.familyId) {
      return res.json({ family: null });
    }

    const family = await Family.findById(user.familyId)
      .populate('members.userId', 'name email role');
    
    res.json({ family });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Join family (for mentors)
router.post('/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const user = await User.findById(req.userId);

    if (user.role !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can join families' });
    }

    const family = await Family.findOne({ inviteCode });
    if (!family) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // Add mentor to family
    family.members.push({ userId: user._id, role: 'mentor' });
    await family.save();

    user.familyId = family._id;
    await user.save();

    res.json({ family, message: 'Successfully joined family' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get learner's transactions (for mentors)
router.get('/learner/:learnerId/transactions', auth, async (req, res) => {
  try {
    const mentor = await User.findById(req.userId);
    const learner = await User.findById(req.params.learnerId);

    // Verify they're in the same family
    if (!mentor.familyId || !learner.familyId || 
        mentor.familyId.toString() !== learner.familyId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (mentor.role !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can view this' });
    }

    const transactions = await Transaction.find({ userId: learner._id })
      .sort({ date: -1 });
    
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get family statistics (for mentors)
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (user.role !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can view stats' });
    }

    const family = await Family.findById(user.familyId);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }

    // Get all learners in family
    const learners = family.members
      .filter(m => m.role === 'learner')
      .map(m => m.userId);

    // Get stats for all learners
    const stats = await Transaction.aggregate([
      {
        $match: { userId: { $in: learners } }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const flaggedCount = await Transaction.countDocuments({
      userId: { $in: learners },
      flagged: true,
      status: 'pending'
    });

    res.json({ stats, flaggedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
