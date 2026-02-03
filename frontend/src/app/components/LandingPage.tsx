import { useState } from 'react';
import { LoginPage } from './LoginPage';
import type { AuthUser } from '@/services/authService';
import heroSection from '@/assets/f0305e9f2eab53322b0656d1916c39b21e8a18f1.png';
import howItWorksSection from '@/assets/5d82b607bef000dfada10597955785de8a20a66e.png';
import whyTokenSection from '@/assets/64fa271a3d41a460e8b51bdd772e0408c7f92eff.png';
import projectSystemSection from '@/assets/87dbda1bd84de3f1bfee7e73f2bfec1f1ea71e6b.png';
import helpSupportSection from '@/assets/b460068b367eea98e9b80d249edfc28524b10fa2.png';
import footerSection from '@/assets/d60b6f8c36076a378fed135461dd0ad962951397.png';

interface LandingPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  onContinueAsGuest?: () => void;
}

export function LandingPage({ onLoginSuccess, onContinueAsGuest }: LandingPageProps) {
  const [showLogin, setShowLogin] = useState(false);

  const scrollToLogin = () => {
    setShowLogin(true);
    // Login section'a scroll yap
    setTimeout(() => {
      const loginSection = document.getElementById('login-section');
      if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="w-full bg-black">
      {/* Hero Section */}
      <section className="relative w-full">
        <img 
          src={heroSection} 
          alt="Hero Section" 
          className="w-full h-auto object-cover"
        />
        {/* Optional: CTA button overlay to scroll to login */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={scrollToLogin}
            className="mt-[400px] px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-lg transition-all opacity-0 hover:opacity-100"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full">
        <img 
          src={howItWorksSection} 
          alt="How It Works" 
          className="w-full h-auto object-cover"
        />
      </section>

      {/* Login Section - Interactive */}
      <section id="login-section" className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Information */}
            <div className="text-center lg:text-left space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                Start optimizing immediately
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300">
                Up to <span className="font-bold text-blue-600 dark:text-blue-400">5 prompt optimizations</span> are available without signing in.
              </p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                Sign in to unlock full access and save your optimized prompts.
              </p>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <LoginPage 
                  onLoginSuccess={onLoginSuccess}
                  onContinueAsGuest={onContinueAsGuest}
                  showGuestOption={true}
                  embedded={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Token Saving Matters Section */}
      <section className="w-full">
        <img 
          src={whyTokenSection} 
          alt="Why Token Saving Matters" 
          className="w-full h-auto object-cover"
        />
      </section>

      {/* Project System Section */}
      <section className="w-full">
        <img 
          src={projectSystemSection} 
          alt="Project System" 
          className="w-full h-auto object-cover"
        />
      </section>

      {/* Help & Support + Trust & Reliability Section */}
      <section className="w-full">
        <img 
          src={helpSupportSection} 
          alt="Help & Support" 
          className="w-full h-auto object-cover"
        />
      </section>

      {/* Footer Section */}
      <section className="w-full">
        <img 
          src={footerSection} 
          alt="Footer" 
          className="w-full h-auto object-cover"
        />
      </section>
    </div>
  );
}