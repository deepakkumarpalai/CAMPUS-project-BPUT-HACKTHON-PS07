const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    studentDobHash: { type: String, select: false },
    role: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'ADMIN'],
      required: true
    },
    phone: { type: String, trim: true },
    department: { type: String, trim: true },
    studentId: { type: String, trim: true },
    facultyId: { type: String, trim: true },
    profileImage: { type: String, default: '' },
    courses: [{ type: String }],
    isDemo: { type: Boolean, default: false }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchStudentDob = async function matchStudentDob(dateOfBirth) {
  if (!this.studentDobHash) return false;
  return bcrypt.compare(dateOfBirth, this.studentDobHash);
};

module.exports = mongoose.model('User', userSchema);
