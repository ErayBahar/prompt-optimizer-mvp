import { X, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchAboutUsContent, getFallbackContent, type AboutUsContent } from '@/services/contentService';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutUsModal({ isOpen, onClose }: AboutUsModalProps) {
  const [content, setContent] = useState<AboutUsContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen]);

  const loadContent = async () => {
    setIsLoading(true);
    setError(false);
    
    try {
      const data = await fetchAboutUsContent();
      setContent(data);
    } catch (err) {
      console.error('Error loading About Us content:', err);
      setError(true);
      // Use fallback content even on error
      setContent(getFallbackContent());
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">About Us</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading content...</p>
            </div>
          )}

          {/* Error Banner (shows even when fallback is used) */}
          {error && !isLoading && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Content Loading Issue</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Unable to load latest content. Displaying cached version.
                </p>
              </div>
            </div>
          )}

          {/* Content Display */}
          {!isLoading && content && (
            <>
              {/* Introduction */}
              <div>
                {content.introduction.map((paragraph, index) => (
                  <p 
                    key={index}
                    className={`text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed ${
                      index > 0 ? 'mt-3' : ''
                    } ${index === content.introduction.length - 1 ? 'font-medium' : ''}`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* How It Works */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">How It Works</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {content.howItWorks.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              {/* Why Token Saving Matters */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">Why Token Saving Matters</h3>
                {content.whyTokenSaving.description.map((paragraph, index) => (
                  <p 
                    key={index}
                    className={`text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed ${index > 0 ? 'mt-3' : ''}`}
                  >
                    {paragraph}
                  </p>
                ))}
                <ul className="list-disc list-inside space-y-1 mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {content.whyTokenSaving.benefits.slice(0, -1).map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
                  {content.whyTokenSaving.benefits[content.whyTokenSaving.benefits.length - 1]}
                </p>
              </div>

              {/* Key Features */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">Key Features</h3>
                <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {content.keyFeatures.map((feature, index) => (
                    <li key={index}>
                      <strong>{feature.title}</strong> – {feature.description}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust & Reliability */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">Trust & Reliability</h3>
                <ul className="list-disc list-inside space-y-1 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  {content.trustAndReliability.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}