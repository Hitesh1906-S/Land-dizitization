import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center flex-row whitespace-nowrap font-bold rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-govnavy-900 hover:bg-govnavy-950 text-white shadow-xs hover:shadow-md focus:ring-govnavy-900 border border-govnavy-900',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/90 shadow-2xs hover:border-slate-400 focus:ring-slate-400',
    outline: 'border border-blue-600 text-blue-600 hover:bg-blue-50/80 focus:ring-blue-600 bg-white/50',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md focus:ring-emerald-600 border border-emerald-600',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-md focus:ring-rose-600 border border-rose-600',
    ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4 text-current shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
