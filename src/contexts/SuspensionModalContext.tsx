/**
 * Suspension Modal Context
 * 
 * Provides global state management for the suspension modal.
 * This allows the session management to trigger the modal from anywhere in the app.
 * 
 * Part of: Session-Management-Based Modal Suspension System
 * Created: 2025-01-24
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// =========================
// Types and Interfaces
// =========================

interface SuspensionModalContextType {
  isOpen: boolean;
  showModal: () => void;
  hideModal: () => void;
}

// =========================
// Context Creation
// =========================

const SuspensionModalContext = createContext<SuspensionModalContextType | undefined>(undefined);

// =========================
// Provider Component
// =========================

interface SuspensionModalProviderProps {
  children: ReactNode;
}

export const SuspensionModalProvider: React.FC<SuspensionModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const showModal = () => {
    console.log('[SuspensionModalContext] Showing suspension modal');
    setIsOpen(true);
  };

  const hideModal = () => {
    console.log('[SuspensionModalContext] Hiding suspension modal');
    setIsOpen(false);
  };

  const value: SuspensionModalContextType = {
    isOpen,
    showModal,
    hideModal
  };

  return (
    <SuspensionModalContext.Provider value={value}>
      {children}
    </SuspensionModalContext.Provider>
  );
};

// =========================
// Hook for Using Context
// =========================

export const useSuspensionModal = (): SuspensionModalContextType => {
  const context = useContext(SuspensionModalContext);
  if (context === undefined) {
    throw new Error('useSuspensionModal must be used within a SuspensionModalProvider');
  }
  return context;
};

export default SuspensionModalProvider;
