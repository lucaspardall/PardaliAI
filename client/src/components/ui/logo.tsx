
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
}

const sizeClasses = {
  sm: 'h-6',
  md: 'h-8', 
  lg: 'h-10',
  xl: 'h-12'
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
      <img 
        src="/logo.svg" 
        alt="CIP Shopee" 
        className={cn(sizeClasses[size], "w-auto mr-2 object-contain")}
      />
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
