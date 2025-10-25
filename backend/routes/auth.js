const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, finsyncCode } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // LEARNER SIGN UP
    if (role === 'learner') {
      // Generate unique FinSync Code for learner
      let generatedCode;
      let codeExists = true;
      
      while (codeExists) {
        generatedCode = User.generateFinsyncCode();
        const existingCode = await User.findOne({ finsyncCode: generatedCode });
        if (!existingCode) codeExists = false;
      }

      // Create learner with FinSync Code
      const learner = new User({
        name,
        email,
        password,
        role: 'learner',
        finsyncCode: generatedCode
      });

      await learner.save();

      // Generate token
      const token = jwt.sign(
        { userId: learner._id, role: learner.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        user: {
          id: learner._id,
          name: learner.name,
          email: learner.email,
          role: learner.role,
          finsyncCode: learner.finsyncCode
        },
        token,
        message: 'Learner account created! Share your FinSync Code with your mentor.'
      });
    }

    // MENTOR SIGN UP
    if (role === 'mentor') {
      // Mentor must provide FinSync Code
      if (!finsyncCode || finsyncCode.trim() === '') {
        return res.status(400).json({ 
          error: 'FinSync Code is required for mentor signup. Please get the code from your family member (learner).' 
        });
      }

      // Find learner with this FinSync Code
      const learner = await User.findOne({ 
        finsyncCode: finsyncCode.toUpperCase().trim(),
        role: 'learner'
      });

      if (!learner) {
        return res.status(404).json({ 
          error: 'Invalid FinSync Code. Please check with your family member and try again.' 
        });
      }

      // Check if learner already has a mentor
      if (learner.linkedUserId) {
        return res.status(400).json({ 
          error: 'This learner already has a mentor linked.' 
        });
      }

      // Create mentor
      const mentor = new User({
        name,
        email,
        password,
        role: 'mentor',
        linkedUserId: learner._id // Link to learner
      });

      await mentor.save();

      // Update learner to link back to mentor
      learner.linkedUserId = mentor._id;
      await learner.save();

      // Generate token
      const token = jwt.sign(
        { userId: mentor._id, role: mentor.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        user: {
          id: mentor._id,
          name: mentor.name,
          email: mentor.email,
          role: mentor.role,
          linkedUserId: learner._id,
          linkedUserName: learner.name
        },
        token,
        message: `Successfully linked to ${learner.name}!`
      });
    }

    return res.status(400).json({ error: 'Invalid role specified' });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate('linkedUserId', 'name email role');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      finsyncCode: user.finsyncCode,
      linkedUserId: user.linkedUserId?._id,
      linkedUserName: user.linkedUserId?.name
    };

    res.json({
      user: userData,
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('linkedUserId', 'name email role');
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get linked user info (for both learner and mentor)
router.get('/linked-user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('linkedUserId', 'name email role finsyncCode');
    
    if (!user.linkedUserId) {
      return res.json({ linkedUser: null });
    }

    res.json({ 
      linkedUser: {
        id: user.linkedUserId._id,
        name: user.linkedUserId.name,
        email: user.linkedUserId.email,
        role: user.linkedUserId.role,
        finsyncCode: user.linkedUserId.finsyncCode
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
