'use client';

import { useTheme } from '../lib/themeContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export default function AdminLayout({ 
  children, 
  title, 
  subtitle, 
  onBack, 
  actions 
}: AdminLayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className={`rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200 ${
          theme === 'dark' 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className={`mt-1 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* Toggle Theme */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                }`}
                title={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              
              {/* Back Button */}
              {onBack && (
                <button
                  onClick={onBack}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                  title="Voltar ao dashboard principal"
                >
                  Voltar
                </button>
              )}
              
              {/* Custom Actions */}
              {actions}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="transition-colors duration-200">
          {children}
        </div>

        {/* Footer */}
        <div className={`mt-8 pt-6 border-t transition-colors duration-200 ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="text-center">
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="font-semibold">Talos</span> | 2025 Automações e Sistemas Inteligentes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para cards
export function AdminCard({ 
  children, 
  title, 
  className = '' 
}: { 
  children: React.ReactNode; 
  title?: string; 
  className?: string;
}) {
  const { theme } = useTheme();
  
  return (
    <div className={`rounded-lg shadow-lg transition-colors duration-200 ${className} ${
      theme === 'dark' 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200'
    }`}>
      {title && (
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// Componente para botões
export function AdminButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  [key: string]: any;
}) {
  const { theme } = useTheme();
  
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  const variantClasses = {
    primary: theme === 'dark' 
      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500' 
      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: theme === 'dark'
      ? 'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500'
      : 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    success: theme === 'dark'
      ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
      : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: theme === 'dark'
      ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
      : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: theme === 'dark'
      ? 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500'
      : 'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500'
  };
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Componente para inputs
export function AdminInput({ 
  label, 
  tooltip,
  className = '',
  ...props 
}: {
  label?: string;
  tooltip?: string;
  className?: string;
  [key: string]: any;
}) {
  const { theme } = useTheme();
  
  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-1 ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {label}
          {tooltip && (
            <span className="ml-1 text-gray-400" title={tooltip}>ⓘ</span>
          )}
        </label>
      )}
      <input
        className={`block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        }`}
        {...props}
      />
    </div>
  );
}

// Componente para textareas
export function AdminTextarea({ 
  label, 
  tooltip,
  className = '',
  ...props 
}: {
  label?: string;
  tooltip?: string;
  className?: string;
  [key: string]: any;
}) {
  const { theme } = useTheme();
  
  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium mb-1 ${
          theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
        }`}>
          {label}
          {tooltip && (
            <span className="ml-1 text-gray-400" title={tooltip}>ⓘ</span>
          )}
        </label>
      )}
      <textarea
        className={`block w-full border rounded-lg px-3 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        }`}
        {...props}
      />
    </div>
  );
}

// Componente para tabelas
export function AdminTable({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { theme } = useTheme();
  
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`w-full ${
        theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
      }`}>
        {children}
      </table>
    </div>
  );
}

export function AdminTableHeader({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { theme } = useTheme();
  
  return (
    <thead className={`${
      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
    } ${className}`}>
      <tr>
        {children}
      </tr>
    </thead>
  );
}

export function AdminTableHeaderCell({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { theme } = useTheme();
  
  return (
    <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
      theme === 'dark' ? 'text-white' : 'text-gray-700'
    } ${className}`}>
      {children}
    </th>
  );
}

export function AdminTableBody({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { theme } = useTheme();
  
  return (
    <tbody className={`divide-y ${
      theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'
    } ${className}`}>
      {children}
    </tbody>
  );
}

export function AdminTableCell({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { theme } = useTheme();
  
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
      theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
    } ${className}`}>
      {children}
    </td>
  );
} 