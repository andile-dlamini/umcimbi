import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

type ActiveRole = 'organiser' | 'vendor';

interface RoleContextType {
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  canSwitchRole: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { isVendor } = useAuth();
  const [activeRole, setActiveRole] = useState<ActiveRole>('organiser');

  // Load saved role preference
  useEffect(() => {
    const savedRole = localStorage.getItem('isiko-active-role') as ActiveRole | null;
    if (savedRole && (savedRole === 'organiser' || savedRole === 'vendor')) {
      // Only set vendor role if user is actually a vendor
      if (savedRole === 'vendor' && isVendor) {
        setActiveRole('vendor');
      } else {
        setActiveRole('organiser');
      }
    }
  }, [isVendor]);

  const handleSetActiveRole = (role: ActiveRole) => {
    if (role === 'vendor' && !isVendor) return;
    setActiveRole(role);
    localStorage.setItem('isiko-active-role', role);
  };

  const canSwitchRole = isVendor;

  return (
    <RoleContext.Provider value={{
      activeRole,
      setActiveRole: handleSetActiveRole,
      canSwitchRole,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}