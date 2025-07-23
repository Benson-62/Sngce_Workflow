// ===============================
// File: src/App.jsx
// Description: Main entry point for routing and layout. Sets up navigation and page routes.
// ===============================

// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import NewSubmission from './pages/NewSubmission';
import AdminPanel from './AdminPanel';
import ReceivedForms from './pages/ReceivedForms';
import ReceivedFormView from './pages/ReceivedFormView';
import './App.css';

// App: Main application component with router and navigation
function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submission/new" element={<NewSubmission />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/received-forms" element={<ReceivedForms />} />
          <Route path="/received-forms/:id" element={<ReceivedFormView />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 