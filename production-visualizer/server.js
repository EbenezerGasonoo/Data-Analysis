const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/production', { useNewUrlParser: true, useUnifiedTopology: true });

const productionSchema = new mongoose.Schema({
  product: String,
  date: Date,
  quantity: Number,
});

const Production = mongoose.model('Production', productionSchema);

app.post('/data', async (req, res) => {
  const productionData = new Production(req.body);
  try {
    await productionData.save();
    res.send(productionData);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
