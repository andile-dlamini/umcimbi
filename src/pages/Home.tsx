import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';

export default function Home() {
  const { isVendor } = useAuth();
  const { activeRole } = useRole();

  // Vendor role → Dashboard, Planner role → My Events
  if (activeRole === 'vendor' && isVendor) {
    return <Navigate to="/vendor-dashboard" replace />;
  }

  return <Navigate to="/events" replace />;
}
