import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ErrorDisplayProps {
  type: 'network' | 'timeout' | 'server' | 'schema' | 'rate-limit' | 'empty-response';
  message: string;
  onRetry?: () => void;
  cooldownSeconds?: number;
}

const errorConfig = {
  'network': {
    icon: WifiOff,
    color: 'red',
    title: 'No Connection',
  },
  'timeout': {
    icon: AlertCircle,
    color: 'orange',
    title: 'Request Timeout',
  },
  'server': {
    icon: AlertCircle,
    color: 'red',
    title: 'Server Error',
  },
  'schema': {
    icon: AlertCircle,
    color: 'red',
    title: 'Unexpected Response',
  },
  'rate-limit': {
    icon: AlertCircle,
    color: 'orange',
    title: 'Too Many Requests',
  },
  'empty-response': {
    icon: AlertCircle,
    color: 'red',
    title: 'Empty Response',
  },
};

export function ErrorDisplay({ type, message, onRetry, cooldownSeconds }: ErrorDisplayProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className="mt-6 sm:mt-8 bg-white border-2 border-red-200 rounded-lg p-4 sm:p-6">
      <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-${config.color}-100 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 text-${config.color}-600`} />
        </div>
        
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {config.title}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 max-w-md">
            {message}
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            disabled={cooldownSeconds !== undefined && cooldownSeconds > 0}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>
              {cooldownSeconds !== undefined && cooldownSeconds > 0
                ? `Try again in ${cooldownSeconds}s`
                : 'Try Again'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}