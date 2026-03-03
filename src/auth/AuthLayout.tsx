import React, { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { Verify } from './Verify';

export const AuthLayout: React.FC = () => {
  const [page, setPage] = useState<'login' | 'register' | 'verify'>('login');
  const [email, setEmail] = useState('');

  const handleNeedsVerification = (userEmail: string) => {
    setEmail(userEmail);
    setPage('verify');
  };

  if (page === 'login') {
    return <Login onNavigate={setPage} onNeedsVerification={handleNeedsVerification} />;
  }

  if (page === 'register') {
    return <Register onNavigate={setPage} onNeedsVerification={handleNeedsVerification} />;
  }

  if (page === 'verify') {
    return <Verify email={email} onNavigate={setPage} />;
  }

  return null;
};
