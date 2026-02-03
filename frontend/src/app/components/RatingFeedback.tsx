import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { saveRating } from '../../services/feedbackService';

interface RatingFeedbackProps {
  promptId?: string;
  onRatingSubmit?: (rating: number) => void;
  disabled?: boolean;
  userRating?: number;
}

export function RatingFeedback({ 
  promptId = 'temp', 
  onRatingSubmit,
  disabled = false,
  userRating
}: RatingFeedbackProps) {
  const [rating, setRating] = useState<number>(userRating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(!!userRating);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRatingAgain, setIsRatingAgain] = useState(false); // TC-62: Rate again modu
  const [selectedRating, setSelectedRating] = useState<number>(0); // TC-62: Seçilen rating (submit öncesi)

  // userRating prop değiştiğinde internal state'i güncelle
  useEffect(() => {
    setRating(userRating || 0);
    setIsSubmitted(!!userRating);
    setError(null);
    setSuccessMessage(null);
    setIsRatingAgain(false);
    setSelectedRating(0);
  }, [userRating, promptId]); // promptId de değiştiğinde reset et

  // TC-61, TC-63: Star'a tıklayınca rating seç (henüz submit etme)
  const handleStarClick = (value: number) => {
    if (disabled || (isSubmitted && !isRatingAgain)) return;
    
    setSelectedRating(value);
    setError(null);
  };

  // TC-61, TC-63: Submit butonu handler
  const handleSubmit = async () => {
    if (selectedRating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Backend'e rating gönder (update veya yeni kayıt)
      const result = await saveRating({
        promptId,
        rating: selectedRating,
        timestamp: new Date(),
      });

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to submit rating');
      }

      // TC-61: İlk submit success
      // TC-63: Update success (same logic)
      // TC-64: Aynı rating ile submit success
      const isUpdate = isRatingAgain && rating > 0;
      const isSameRating = isUpdate && selectedRating === rating;
      
      setRating(selectedRating);
      setIsSubmitted(true);
      setIsRatingAgain(false);
      setSelectedRating(0);
      
      // Success message
      if (isUpdate) {
        if (isSameRating) {
          // TC-64: Aynı rating
          setSuccessMessage('Your rating has been saved.');
        } else {
          // TC-63: Farklı rating (update)
          setSuccessMessage('Your rating has been updated. Thank you!');
        }
      } else {
        // TC-61: İlk submit
        setSuccessMessage('Thank you for your feedback!');
      }
      
      onRatingSubmit?.(selectedRating);

      // Success mesajını 3 saniye sonra kaldır
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

    } catch (err) {
      // TC-65: Error handling
      setError('Your feedback could not be saved. Please try again.');
      // Seçili rating korunur (kullanıcı tekrar submit edebilir)
      console.error('Rating submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // TC-62: Rate Again handler - kullanıcı rating'i değiştirmek isterse
  const handleRateAgain = () => {
    setIsRatingAgain(true);
    setIsSubmitted(false);
    setSuccessMessage(null);
    setError(null);
    setSelectedRating(0); // Yeni seçim için reset
    setHoveredRating(0);
  };

  const handleStarHover = (value: number) => {
    if (disabled || (isSubmitted && !isRatingAgain)) return;
    setHoveredRating(value);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  // Display logic
  // TC-61: Submit öncesi → selectedRating veya hover
  // TC-61: Submit sonrası → rating (read-only)
  // TC-62: Rate again → selectedRating veya hover (editable)
  const displayRating = isSubmitted && !isRatingAgain 
    ? rating  // Read-only mode
    : (hoveredRating || selectedRating); // Editable mode

  // TC-61: Submit butonu sadece rating seçiliyse ve henüz submit edilmemişse göster
  const showSubmitButton = selectedRating > 0 && !isSubmitted;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm font-medium text-gray-700">
          Rate this optimization
        </p>
        {isSubmitted && !isRatingAgain && (
          <span className="text-xs text-gray-500">Rated</span>
        )}
      </div>

      {/* Stars */}
      <div 
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleStarClick(value)}
            onMouseEnter={() => handleStarHover(value)}
            disabled={disabled || isSubmitting || (isSubmitted && !isRatingAgain)}
            className={`transition-all ${
              disabled || (isSubmitted && !isRatingAgain)
                ? 'cursor-default' 
                : 'cursor-pointer hover:scale-110'
            }`}
            aria-label={`Rate ${value} stars`}
          >
            <Star
              className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                value <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {(rating > 0 || selectedRating > 0) && (
          <span className="ml-2 text-sm text-gray-600">
            {isSubmitted && !isRatingAgain ? rating : selectedRating}/5
          </span>
        )}
      </div>

      {/* TC-61, TC-63: Submit Button */}
      {(showSubmitButton || (isRatingAgain && selectedRating > 0)) && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* TC-65: Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Helper Text */}
      {!isSubmitted && !successMessage && !error && !showSubmitButton && (
        <p className="text-xs text-gray-500">
          Click on the stars to select your rating, then submit your feedback.
        </p>
      )}

      {/* TC-62: Info text when rating again */}
      {isRatingAgain && !error && !successMessage && (
        <p className="text-xs text-blue-600">
          You can update your rating.
        </p>
      )}

      {/* TC-61, TC-62: Rate Again Button */}
      {isSubmitted && !isRatingAgain && !successMessage && (
        <button
          onClick={handleRateAgain}
          className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
        >
          Rate again
        </button>
      )}
    </div>
  );
}