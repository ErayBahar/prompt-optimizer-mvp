interface OptimizeButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export function OptimizeButton({ onClick, isLoading, disabled }: OptimizeButtonProps) {
  return (
    <div className="flex justify-center">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className="px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Optimizing...</span>
          </>
        ) : (
          <span>Optimize Prompt</span>
        )}
      </button>
    </div>
  );
}