const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name Required'],
  },
  email: {
    type: String,
    required: [true, 'Email Required'],
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Invalid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password Required'],
    minlength: 6
  }
});

// Hide Password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare method
UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
