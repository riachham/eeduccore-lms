const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

const clearUsers = async () => {
  try {
    await connectDB();
    const result = await User.deleteMany();
    console.log(`Deleted ${result.deletedCount} users successfully!`);
    process.exit();
  } catch (error) {
    console.error('Failed to clear users:', error.message);
    process.exit(1);
  }
};

clearUsers();