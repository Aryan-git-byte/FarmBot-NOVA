import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface StatusIndicatorProps {
  status: 'optimal' | 'warning' | 'critical';
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'medium',
  showText = true,
  className = ''
}) => {
  const { t } = useLanguage();

  const statusConfig = {
    optimal: {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-300 dark:border-green-700',
      icon: CheckCircle,
      text: t('optimal')
    },
    warning: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      border: 'border-yellow-300 dark:border-yellow-700',
      icon: AlertTriangle,
      text: t('warning')
    },
    critical: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-300 dark:border-red-700',
      icon: XCircle,
      text: t('critical')
    }
  };

  const sizeConfig = {
    small: { icon: 'h-4 w-4', text: 'text-sm', padding: 'px-2 py-1' },
    medium: { icon: 'h-6 w-6', text: 'text-base', padding: 'px-3 py-2' },
    large: { icon: 'h-8 w-8', text: 'text-lg', padding: 'px-4 py-3' }
  };

  const config = statusConfig[status];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center space-x-2 rounded-full border-2 ${config.bg} ${config.border} ${sizes.padding} ${className}`}>
      <Icon className={`${config.color} ${sizes.icon}`} />
      {showText && (
        <span className={`font-medium ${config.color} ${sizes.text}`}>
          {config.text}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;