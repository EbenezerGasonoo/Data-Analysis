const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/production', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
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

// Register a new user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(400).send('Error registering user');
  }
});

// Authenticate user and get a token
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send('Invalid credentials');
  }
  const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '1h' });
  res.send({ token });
});

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).send('Unauthorized');
  
  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).send('Forbidden');
    req.user = user;
    next();
  });
};

// Get production data
app.get('/data', authenticateToken, async (req, res) => {
  try {
    const data = await Production.find();
    res.send(data);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Add production data
app.post('/data', authenticateToken, async (req, res) => {
  const productionData = new Production(req.body);
  try {
    await productionData.save();
    res.send(productionData);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update production data
app.put('/data/:id', authenticateToken, async (req, res) => {
  try {
    const updatedData = await Production.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(updatedData);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Delete production data
app.delete('/data/:id', authenticateToken, async (req, res) => {
  try {
    await Production.findByIdAndDelete(req.params.id);
    res.send('Data deleted successfully');
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
