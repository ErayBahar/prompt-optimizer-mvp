import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Moon, Sun, User, Check, X } from 'lucide-react';
import { AboutUsModal } from '@/app/components/AboutUsModal';
import { useTheme } from '@/contexts/ThemeContext';
import googleLogo from '@/assets/48b798b9c95d9205d88e47f89d9b0ead3028138c.png';
import { loginWithEmail, signUpWithEmail, loginWithGoogle, type AuthUser } from '@/services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onContinueAsGuest?: () => void;
  showGuestOption?: boolean;
  guestLimitMessage?: string;
  embedded?: boolean; // Landing page içinde kullanılırken true
}

export function LoginPage({ onLoginSuccess, onContinueAsGuest, showGuestOption = false, guestLimitMessage, embedded = false }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  // Password validation for Sign Up
  const passwordValidation = {
    minLength: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*?_.]/.test(password),
  };

  const isPasswordValid = isSignUp 
    ? passwordValidation.minLength && 
      passwordValidation.hasUpperCase && 
      passwordValidation.hasNumber && 
      passwordValidation.hasSpecialChar
    : true; // Sign In modunda şifre validasyonu yok

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sign Up modunda şifre validasyonu kontrolü
    if (isSignUp && !isPasswordValid) {
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);
    try {
      const displayName = isSignUp ? `${name} ${surname}`.trim() : undefined;
      const user = isSignUp
        ? await signUpWithEmail(email, password, displayName)
        : await loginWithEmail(email, password);

      onLoginSuccess(user);
    } catch (error: any) {
      setAuthError(error?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      const user = await loginWithGoogle();
      onLoginSuccess(user);
    } catch (error: any) {
      setAuthError(error?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={embedded ? "" : "min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4 transition-colors"}>
      <div className="w-full max-w-md">
        {/* Theme Toggle Button */}
        {!embedded && (
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
            </button>
          </div>
        )}

        {/* Header */}
        {!embedded && (
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Prompt Optimizer Tool
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {guestLimitMessage || (isSignUp ? 'Create your account' : 'Sign in to continue')}
            </p>
          </div>
        )}

        {/* Login/SignUp Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-8 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {authError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs sm:text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                {authError}
              </div>
            )}
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="block w-full pl-8 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                {isSignUp ? 'Create a password' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-8 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password Requirements - Only show during Sign Up */}
              {isSignUp && (
                <div className="mt-2 space-y-1.5">
                  <PasswordRequirement 
                    met={passwordValidation.minLength} 
                    text="At least 6 characters" 
                  />
                  <PasswordRequirement 
                    met={passwordValidation.hasUpperCase} 
                    text="At least 1 uppercase letter (A–Z)" 
                  />
                  <PasswordRequirement 
                    met={passwordValidation.hasNumber} 
                    text="At least 1 number (0–9)" 
                  />
                  <PasswordRequirement 
                    met={passwordValidation.hasSpecialChar} 
                    text="At least 1 special character (! @ # $ % ^ & * ? _ .)" 
                  />
                </div>
              )}
            </div>

            {/* Name and Surname Inputs */}
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="block w-full pl-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="surname" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Surname
                  </label>
                  <input
                    id="surname"
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="Your Surname"
                    className="block w-full pl-3 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition"
            >
              {isSubmitting ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            {/* Guest Option */}
            {showGuestOption && onContinueAsGuest && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-xs sm:text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={onContinueAsGuest}
                    className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition"
                  >
                    Continue as Guest
                  </button>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">
                    Try 5 optimizations before signing up
                  </p>
                </div>
              </>
            )}

            {/* Google Login Button */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">or</span>
              </div>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2.5 sm:py-3 text-sm sm:text-base rounded-lg transition flex items-center justify-center border border-gray-300 dark:border-gray-600"
              >
                <img src={googleLogo} alt="Google" className="h-5 w-5 mr-3" />
                Continue with Google
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        {!embedded && (
          <>
            <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6 px-2">
              Optimize your prompts with AI-powered suggestions
            </p>
            
            {/* About Us Link */}
            <div className="text-center mt-3">
              <button
                onClick={() => setShowAboutUs(true)}
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
              >
                About Us
              </button>
            </div>
          </>
        )}
      </div>

      {/* About Us Modal */}
      {!embedded && <AboutUsModal isOpen={showAboutUs} onClose={() => setShowAboutUs(false)} />}
    </div>
  );
}

// PasswordRequirement Component
interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

function PasswordRequirement({ met, text }: PasswordRequirementProps) {
  return (
    <div className="flex items-center">
      {met ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      )}
      <span className="ml-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        {text}
      </span>
    </div>
  );
}