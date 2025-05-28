import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

export default function AuthListener() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div>
      {user ? (
        <p>User is logged in.</p>
      ) : (
        <p>User is not logged in.</p>
      )}
    </div>
  );
}