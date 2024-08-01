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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showResetForm, setShowResetForm] = useState(false);
  const [oldUsername, setOldUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const result = await axios.get(`${API_URL}/data`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setData(result.data);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      setToken(response.data.token);
      setIsAuthenticated(true);
      toast.success('Login successful!');
    } catch (error) {
      console.error('Error logging in:', error);
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/data`, { product, date, quantity }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData([...data, response.data]);
      toast.success('Data submitted successfully!');
    } catch (error) {
      console.error('Error submitting data:', error);
      toast.error('Failed to submit data.');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/reset`, { oldUsername, oldPassword, newUsername, newPassword });
      toast.success('Credentials updated successfully!');
      setShowResetForm(false);
    } catch (error) {
      console.error('Error resetting credentials:', error);
      toast.error('Failed to reset credentials.');
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
            await axios.post(`${API_URL}/data`, item, {
              headers: { Authorization: `Bearer ${token}` },
            });
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
      <h1>Production Visualizer</h1>
      {!isAuthenticated ? (
        <form onSubmit={handleLogin}>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <>
          <button onClick={() => setShowResetForm(!showResetForm)}>
            {showResetForm ? 'Cancel' : 'Reset Credentials'}
          </button>
          {showResetForm && (
            <form onSubmit={handleReset}>
              <input
                type="text"
                value={oldUsername}
                onChange={e => setOldUsername(e.target.value)}
                placeholder="Old Username"
                required
              />
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="Old Password"
                required
              />
              <input
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="New Username"
                required
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New Password"
                required
              />
              <button type="submit">Submit</button>
            </form>
          )}
          <form onSubmit={handleSubmit}>
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
          <div>
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
          <Line data={chartData} />
        </>
      )}
    </div>
  );
}

export default App;
