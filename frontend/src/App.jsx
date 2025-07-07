import React from 'react';
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Simple components
const Dashboard = () => (
  <div style={{ padding: '20px' }}>
    <h1>Enterprise POS System</h1>
    <p>Welcome to the Enterprise POS System Dashboard</p>
  </div>
);

const Login = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>Login</h2>
    <p>Please log in to access the system</p>
  </div>
);

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App; 