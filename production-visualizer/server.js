const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/production', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

const productionSchema = new mongoose.Schema({
  product: String,
  date: Date,
  quantity: Number,
});

const Production = mongoose.model('Production', productionSchema);

const secret = 'your_jwt_secret';

// Seed initial user
async function seedUser() {
  const user = await User.findOne({ username: 'Nomak' });
  if (!user) {
    const hashedPassword = await bcrypt.hash('Nomak', 10);
    await User.create({ username: 'Nomak', password: hashedPassword });
  }
}
seedUser();

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(400).send('Invalid credentials');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send('Invalid credentials');
  }
  const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '1h' });
  res.send({ token });
});

app.post('/reset', async (req, res) => {
  const { oldUsername, oldPassword, newUsername, newPassword } = req.body;
  const user = await User.findOne({ username: oldUsername });
  if (!user) {
    return res.status(400).send('Invalid credentials');
  }
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(400).send('Invalid credentials');
  }
  user.username = newUsername;
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.send('Credentials updated successfully');
});

app.post('/addUser', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();
  res.send('User added successfully');
});

app.post('/removeUser', async (req, res) => {
  const { username } = req.body;
  await User.findOneAndDelete({ username });
  res.send('User removed successfully');
});

app.post('/data', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  try {
    jwt.verify(token, secret);
  } catch (error) {
    return res.status(401).send('Unauthorized');
  }

  const productionData = new Production(req.body);
  try {
    await productionData.save();
    res.send(productionData);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get('/data', async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  try {
    jwt.verify(token, secret);
  } catch (error) {
    return res.status(401).send('Unauthorized');
  }

  const data = await Production.find();
  res.send(data);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
