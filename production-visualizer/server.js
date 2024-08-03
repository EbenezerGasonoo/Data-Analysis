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
  console.log('Received data:', req.body);
  const productionData = new Production(req.body);
  try {
    await productionData.save();
    res.send(productionData);
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send(error);
  }
});

app.get('/data', async (req, res) => {
  try {
    const data = await Production.find();
    res.send(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send(error);
  }
});

app.put('/data/:id', async (req, res) => {
  try {
    const data = await Production.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.send(data);
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).send(error);
  }
});

app.delete('/data/:id', async (req, res) => {
  try {
    await Production.findByIdAndDelete(req.params.id);
    res.send({ message: 'Data deleted successfully' });
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
