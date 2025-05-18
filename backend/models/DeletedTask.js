const mongoose = require('mongoose');

const DeletedTaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: String,
  createdAt: Date,
  completedAt: Date,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deletedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DeletedTask', DeletedTaskSchema);
