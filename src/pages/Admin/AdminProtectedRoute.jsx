import { Navigate, Outlet } from 'react-router-dom';

const AdminProtectedRoute = () => {
  const savedUser = JSON.parse(
    localStorage.getItem('lumoraUser') || 'null'
  );

  if (!savedUser) {
    return <Navigate to="/login" replace />;
  }

  if (savedUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;