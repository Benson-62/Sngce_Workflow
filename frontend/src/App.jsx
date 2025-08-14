// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import NewSubmission from './pages/NewSubmission';
import AdminPanel from './AdminPanel';
import ReceivedForms from './pages/ReceivedForms';
import ReceivedFormView from './pages/ReceivedFormView';
import SubmissionView from './pages/SubmissionView';
import PrincipalPage from './pages/PrincipalPage';
import ProfilePage from './pages/ProfilePage';
import MySubmission from './pages/MySubmission';
import WelcomeAnimation from './pages/WelcomeAnimation';
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
          <Route path="/submission/new" element={<NewSubmission />} />
          <Route path="/submission/:id" element={<SubmissionView />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/received-forms" element={<ReceivedForms />} />
          <Route path="/received-forms/:id" element={<ReceivedFormView />} />
          <Route path="/principal" element={<PrincipalPage />} />
          <Route path="/ProfilePage" element={<ProfilePage />} />
          <Route path="/my-submission" element={<MySubmission />} />
          <Route path="/welcome" element={<WelcomeAnimation />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 