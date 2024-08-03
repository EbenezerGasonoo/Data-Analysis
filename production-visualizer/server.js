const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/production');

const productionSchema = new mongoose.Schema({
  product: String,
  date: Date,
  quantity: Number,
});

const Production = mongoose.model('Production', productionSchema);

app.post('/data', async (req, res) => {
  console.log('Received data:', req.body); // Add this line to log the received data
  const productionData = new Production(req.body);
  try {
    await productionData.save();
    res.send(productionData);
  } catch (error) {
    console.error('Error saving data:', error); // Add this line to log any errors
    res.status(500).send(error);
  }
});

app.get('/data', async (req, res) => {
  try {
    const data = await Production.find();
    res.send(data);
  } catch (error) {
    console.error('Error fetching data:', error); // Add this line to log any errors
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
