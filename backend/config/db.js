const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing. Add it to backend/.env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed. Check your Atlas URI, network access, and internet connection.');
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
