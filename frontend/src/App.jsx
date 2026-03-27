import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Mock pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import DatasetDetailPage from './pages/DatasetDetailPage';
import ComplianceReportPage from './pages/ComplianceReportPage';
import AnnotationPage from './pages/AnnotationPage';
import ExportPage from './pages/ExportPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/dataset/:id" element={<DatasetDetailPage />} />
            <Route path="/dataset/:id/compliance" element={<ComplianceReportPage />} />
            <Route path="/dataset/:id/annotate" element={<AnnotationPage />} />
            <Route path="/dataset/:id/export" element={<ExportPage />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
