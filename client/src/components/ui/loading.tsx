
import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function Loading({ size = 'md', message }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="mx-auto mb-4">
          <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center">
            <i className="ri-shopping-bag-3-line text-2xl text-blue-600 mr-2"></i>
            <h3 className="text-lg font-semibold text-gray-900">CIP Shopee</h3>
          </div>
          {message && (
            <p className="text-sm text-gray-600">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
