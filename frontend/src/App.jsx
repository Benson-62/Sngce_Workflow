// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PrincipalPage from './pages/PrincipalPage';
import NewSubmission from './pages/NewSubmission';
import EditForm from './pages/EditForm';
import AdminPanel from './AdminPanel';
import ReceivedForms from './pages/ReceivedForms';
import ReceivedFormView from './pages/ReceivedFormView';
import SubmissionView from './pages/SubmissionView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/principal" element={<PrincipalPage />} />
          <Route path="/submission/new" element={<NewSubmission />} />
          <Route path="/submission/:id" element={<SubmissionView />} />
          <Route path="/submission/:id/edit" element={<EditForm />} />
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