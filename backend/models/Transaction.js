const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  payee: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['bills', 'healthcare', 'groceries', 'transfer', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String
  },
  upiId: {
    type: String
  },
  transactionId: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-flag suspicious transactions
transactionSchema.pre('save', function(next) {
  // Flag if amount > 3000 and payee contains suspicious keywords
  const suspiciousKeywords = ['unknown', 'urgent', 'prize', 'lottery', 'winner'];
  const isSuspiciousPayee = suspiciousKeywords.some(keyword => 
    this.payee.toLowerCase().includes(keyword)
  );
  
  if (this.amount > 3000 || isSuspiciousPayee) {
    this.flagged = true;
    this.flagReason = this.amount > 3000 
      ? 'High amount transaction'
      : 'Suspicious payee name';
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
