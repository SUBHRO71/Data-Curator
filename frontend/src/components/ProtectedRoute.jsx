import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getStoredToken } from '../services/api';

const ProtectedRoute = () => {
    const token = getStoredToken();

    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
