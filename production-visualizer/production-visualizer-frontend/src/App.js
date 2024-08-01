// src/App.js
import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

function App() {
  const [product, setProduct] = useState('');
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [data, setData] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await axios.post('http://localhost:5000/data', { product, date, quantity });
    setData([...data, response.data]);
  };

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [{
      label: 'Production Quantity',
      data: data.map(d => d.quantity),
      borderColor: 'rgba(75,192,192,1)',
      borderWidth: 2,
    }]
  };

  return (
    <div>
      <h1>Production Visualizer</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" value={product} onChange={e => setProduct(e.target.value)} placeholder="Product" required />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantity" required />
        <button type="submit">Submit</button>
      </form>
      <Line data={chartData} />
    </div>
  );
}

export default App;
