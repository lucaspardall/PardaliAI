
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-3xl'
};

export default function Logo({ 
  className, 
  size = 'md', 
  showText = true,
  textClassName 
}: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn(
        "flex-shrink-0 mr-2 aspect-square",
        sizeClasses[size]
      )} style={{ minWidth: 'auto', maxWidth: 'none' }}>
        <img 
          src="/logo.png" 
          alt="CIP Shopee" 
          className="w-full h-full object-contain"
          style={{ aspectRatio: '1/1' }}
        />
      </div>
      {showText && (
        <h1 className={cn(
          "font-bold text-foreground font-heading",
          textSizeClasses[size],
          textClassName
        )}>
          CIP Shopee
        </h1>
      )}
    </div>
  );
}
