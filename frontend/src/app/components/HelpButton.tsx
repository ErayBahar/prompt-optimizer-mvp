import { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, Mail, Clock, Globe, Instagram, Linkedin, Share2 } from 'lucide-react';

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Prevent multiple clicks
  const handleToggle = () => {
    if (isClicking) return;
    
    setIsClicking(true);
    setIsOpen((prev) => !prev);
    
    setTimeout(() => {
      setIsClicking(false);
    }, 300);
  };

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Focus trap: focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Help Button - Fixed Bottom Left */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="fixed bottom-4 left-4 z-40 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
        aria-label="Help & Support"
        title="Help & Support"
      >
        <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7" />
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto transition-colors"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <h2
                id="help-modal-title"
                className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100"
              >
                Help & Support
              </h2>
              <button
                ref={closeButtonRef}
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Welcome Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  Hello! How can we help you? You can reach us through the contact channels below.
                </p>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                {/* Website */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Website
                    </h3>
                    <a
                      href="https://entrophi.co"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                    >
                      entrophi.co
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Email
                    </h3>
                    <a
                      href="mailto:info@entrophi.co"
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline break-all focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
                    >
                      info@entrophi.co
                    </a>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      We respond within 24 hours
                    </p>
                  </div>
                </div>

                {/* Social */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Social
                    </h3>
                    <div className="space-y-1.5">
                      <a
                        href="https://www.instagram.com/entrophi.co?igsh=cGh0OTgzN2Jnc2Fq"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-pink-600 dark:text-pink-400 hover:underline focus:outline-none focus:ring-2 focus:ring-pink-500 rounded"
                      >
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </a>
                      <a
                        href="https://www.linkedin.com/company/entrophico/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Working Hours
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Monday - Friday: 09:00 - 18:00
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Saturday: 10:00 - 16:00
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Closed on Sunday
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ Teaser */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-2">
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 list-none flex items-center gap-2">
                      <span className="text-blue-600 dark:text-blue-400 group-open:rotate-90 transition-transform">▶</span>
                      What is my optimization limit?
                    </summary>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 ml-6">
                      Guest users can perform 5 optimizations. Create a free account to get unlimited usage.
                    </p>
                  </details>
                  
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 list-none flex items-center gap-2">
                      <span className="text-blue-600 dark:text-blue-400 group-open:rotate-90 transition-transform">▶</span>
                      Will my prompt history be deleted?
                    </summary>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 ml-6">
                      No, all your optimization history is securely saved and you can access it anytime.
                    </p>
                  </details>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Prompt Optimizer v1.0.0 • © 2026 All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}