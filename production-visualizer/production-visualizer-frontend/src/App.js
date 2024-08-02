import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Papa from 'papaparse';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Register the components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = 'http://localhost:5000';

function App() {
  const [product, setProduct] = useState('');
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await axios.get(`${API_URL}/data`);
        setData(result.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/data`, { product, date, quantity });
      setData([...data, response.data]);
      toast.success('Data submitted successfully!');
    } catch (error) {
      console.error('Error submitting data:', error);
      toast.error('Failed to submit data.');
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const exportDataToCSV = () => {
    const csvRows = [];
    const headers = Object.keys(data[0]);
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'production_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Data exported to CSV successfully!');
  };

  const importDataFromCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const importedData = results.data.map((d) => ({
            product: d.product,
            date: new Date(d.date),
            quantity: Number(d.quantity),
          }));

          for (const item of importedData) {
            await axios.post(`${API_URL}/data`, item);
          }

          setData([...data, ...importedData]);
          toast.success('Data imported successfully!');
        } catch (error) {
          console.error('Error importing data:', error);
          toast.error('Failed to import data.');
        }
      },
    });
  };

  const filteredData = data.filter(d => d.product.includes(filter));
  const sortedData = filteredData.sort((a, b) => {
    if (sortOrder === 'asc') {
      return new Date(a.date) - new Date(b.date);
    } else {
      return new Date(b.date) - new Date(a.date);
    }
  });

  const chartData = {
    labels: sortedData.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [{
      label: 'Production Quantity',
      data: sortedData.map(d => d.quantity),
      borderColor: 'rgba(75,192,192,1)',
      borderWidth: 2,
    }]
  };

  return (
    <div className="App">
      <ToastContainer />
      <h1 className="header">Production Visualizer</h1>
      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          value={product}
          onChange={e => setProduct(e.target.value)}
          placeholder="Product"
          required
        />
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
        <input
          type="number"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          placeholder="Quantity"
          required
        />
        <button type="submit">Submit</button>
      </form>
      <div className="filters">
        <label>Filter by product:</label>
        <input
          type="text"
          value={filter}
          onChange={handleFilterChange}
        />
        <label>Sort by date:</label>
        <select value={sortOrder} onChange={handleSortChange}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <button onClick={exportDataToCSV}>Export to CSV</button>
        <input type="file" accept=".csv" onChange={importDataFromCSV} />
      </div>
      <Line className="Line" data={chartData} />
    </div>
  );
}

export default App;
