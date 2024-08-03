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
    <div className="App">
      <ToastContainer />
      <div className="header">
        <h1>Production Visualizer</h1>
      </div>
      <div className="content">
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                value={product}
                onChange={e => setProduct(e.target.value)}
                placeholder="Product"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Quantity"
                required
              />
            </div>
            <button type="submit" className="submit-button">Submit</button>
          </form>
        </div>
        <div className="filter-container">
          <div className="form-group">
            <label>Filter by product:</label>
            <input
              type="text"
              value={filter}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>Sort by date:</label>
            <select value={sortOrder} onChange={handleSortChange}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div className="form-group">
            <button onClick={exportDataToCSV} className="export-button">Export to CSV</button>
            <input type="file" accept=".csv" onChange={importDataFromCSV} className="import-button" />
          </div>
        </div>
        <div className="chart-controls">
          <label>Chart Type:</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
          </select>
        </div>
        <div className="chart-container">
          {renderChart()}
        </div>
        <div className="data-table">
          {sortedData.map(item => (
            <div className="data-row" key={item._id}>
              <span>{item.product}</span>
              <span>{new Date(item.date).toLocaleDateString()}</span>
              <span>{item.quantity}</span>
              <button onClick={() => startEditing(item._id, item.product, item.date, item.quantity)}>Edit</button>
              <button onClick={() => handleDelete(item._id)}>Delete</button>
            </div>
          ))}
        </div>
        {editingId && (
          <div className="edit-form">
            <h2>Edit Data</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <input
                  type="text"
                  value={editingProduct}
                  onChange={e => setEditingProduct(e.target.value)}
                  placeholder="Product"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="date"
                  value={editingDate}
                  onChange={e => setEditingDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="number"
                  value={editingQuantity}
                  onChange={e => setEditingQuantity(e.target.value)}
                  placeholder="Quantity"
                  required
                />
              </div>
              <button type="submit" className="submit-button">Update</button>
              <button type="button" onClick={cancelEditing} className="cancel-button">Cancel</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

