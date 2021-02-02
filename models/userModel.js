const crypto = require('crypto');
const mongoose = require('mongoose');

const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'User must have a name!'],
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    required: [true, 'Please provide an email!'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email!'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: {
      values: ['traveller', 'guide', 'lead-guide', 'admin'],
      message: 'Role can only be traveller, guide, lead-guide or admin!',
    },
    default: 'traveller',
  },
  password: {
    type: String,
    required: [true, 'User must have a password!'],
    minLength: [8, 'Password must be at least 8 characters!'],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Password must match!'],
    validate: {
      // only works for .save() & .create()
      validator: function (val) {
        return val === this.password;
      },
      message: "Passwords didn't match!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetTokenExpires: {
    type: Date,
    select: false,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
  }

  next();
});

userSchema.pre('save', function (next) {
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// Instance methods

userSchema.methods.checkPassword = async function (enteredPass, hashedPass) {
  return await bcrypt.compare(enteredPass, hashedPass);
};

userSchema.methods.checkIfPasswordChanged = function (JWTIssuedAt) {
  if (this.passwordChangedAt) {
    const passChangedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10); // radix -> 10(decimal)
    return JWTIssuedAt < passChangedTimeStamp;
  }

  // password not changed
  return false;
};

userSchema.methods.createForgotPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // store encrypted
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetTokenExpires = Date.now() + 1000 * 60 * 10; // 10min -> for security reasons

  // return simple string
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
