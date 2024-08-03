import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import Papa from 'papaparse';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button, TextField, Container, Card, CardContent, Select, MenuItem } from '@mui/material';
import './App.css';

// Register the components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  const [chartType, setChartType] = useState('line');
  const [editingId, setEditingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState('');
  const [editingDate, setEditingDate] = useState('');
  const [editingQuantity, setEditingQuantity] = useState('');

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/data/${editingId}`, {
        product: editingProduct,
        date: editingDate,
        quantity: editingQuantity,
      });
      const updatedData = data.map(item => item._id === editingId ? response.data : item);
      setData(updatedData);
      toast.success('Data updated successfully!');
      cancelEditing();
    } catch (error) {
      console.error('Error updating data:', error);
      toast.error('Failed to update data.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/data/${id}`);
      const updatedData = data.filter(item => item._id !== id);
      setData(updatedData);
      toast.success('Data deleted successfully!');
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Failed to delete data.');
    }
  };

  const startEditing = (id, product, date, quantity) => {
    setEditingId(id);
    setEditingProduct(product);
    setEditingDate(new Date(date).toISOString().substr(0, 10));
    setEditingQuantity(quantity);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingProduct('');
    setEditingDate('');
    setEditingQuantity('');
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
      backgroundColor: 'rgba(75,192,192,0.4)',
    }]
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Line data={chartData} />;
      case 'bar':
        return <Bar data={chartData} />;
      case 'pie':
        return <Pie data={chartData} />;
      default:
        return <Line data={chartData} />;
    }
  };

  return (
    <Container className="App">
      <ToastContainer className="toast-container" />
      <div className="header">
        <h1>Production Visualizer</h1>
      </div>
      <div className="content">
        <Card className="form-container">
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <TextField
                  label="Product"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  required
                  fullWidth
                />
              </div>
              <div className="form-group">
                <TextField
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  fullWidth
                />
              </div>
              <div className="form-group">
                <TextField
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                  fullWidth
                />
              </div>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card className="filter-container">
          <CardContent>
            <div className="form-group">
              <TextField
                label="Filter by product"
                value={filter}
                onChange={handleFilterChange}
                fullWidth
              />
            </div>
            <div className="form-group">
              <Select
                value={sortOrder}
                onChange={handleSortChange}
                fullWidth
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </div>
            <div className="form-group">
              <Button onClick={exportDataToCSV} variant="contained" color="secondary" fullWidth>
                Export to CSV
              </Button>
              <input type="file" accept=".csv" onChange={importDataFromCSV} className="import-button" />
            </div>
          </CardContent>
        </Card>
        <Card className="chart-controls">
          <CardContent>
            <TextField
              select
              label="Chart Type"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              fullWidth
            >
              <MenuItem value="line">Line</MenuItem>
              <MenuItem value="bar">Bar</MenuItem>
              <MenuItem value="pie">Pie</MenuItem>
            </TextField>
          </CardContent>
        </Card>
        <Card className="chart-container">
          <CardContent>
            {renderChart()}
          </CardContent>
        </Card>
        <div className="data-table">
          {sortedData.map(item => (
            <Card key={item._id} className="data-row">
              <CardContent>
                <span>{item.product}</span>
                <span>{new Date(item.date).toLocaleDateString()}</span>
                <span>{item.quantity}</span>
                <Button onClick={() => startEditing(item._id, item.product, item.date, item.quantity)} variant="contained">
                  Edit
                </Button>
                <Button onClick={() => handleDelete(item._id)} variant="contained" color="error">
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {editingId && (
          <Card className="edit-form">
            <CardContent>
              <h2>Edit Data</h2>
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <TextField
                    label="Product"
                    value={editingProduct}
                    onChange={e => setEditingProduct(e.target.value)}
                    required
                    fullWidth
                  />
                </div>
                <div className="form-group">
                  <TextField
                    type="date"
                    value={editingDate}
                    onChange={e => setEditingDate(e.target.value)}
                    required
                    fullWidth
                  />
                </div>
                <div className="form-group">
                  <TextField
                    label="Quantity"
                    type="number"
                    value={editingQuantity}
                    onChange={e => setEditingQuantity(e.target.value)}
                    required
                    fullWidth
                  />
                </div>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                  Update
                </Button>
                <Button type="button" onClick={cancelEditing} variant="outlined" fullWidth>
                  Cancel
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}

export default App;
