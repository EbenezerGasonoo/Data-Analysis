const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/production');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

async function removeUser(username) {
  try {
    await User.findOneAndDelete({ username });
    console.log(`User ${username} removed successfully`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Error removing user:', error);
  }
}

removeUser('Nomak');
