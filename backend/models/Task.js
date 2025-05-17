const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['To do', 'In progress', 'Completed'],
    default: 'To do'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: Date,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: { type: Date }
});

module.exports = mongoose.model('Task', TaskSchema);
