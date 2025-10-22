import React from 'react';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  userRole: UserRole | null;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, userRole, children }) => {
  if (userRole && allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  // You can return a fallback UI, a redirect, or null
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
    </div>
  );
};

export default ProtectedRoute;
