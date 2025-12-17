
import React, { useState } from 'react';
import { AppLogo } from './BrandAssets';
import { Language } from '../types';
import { ArrowRight, Check, Sun, Moon, Languages, Palette } from 'lucide-react';

interface Props {
  onComplete: (settings: { language: Language, isDarkMode: boolean }) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState<Language>('hi');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else {
      onComplete({ language: selectedLang, isDarkMode });
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-500 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Background Ambience */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-1000 ${isDarkMode ? 'opacity-30' : 'opacity-10'}`}>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-lime-500 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px] opacity-20"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-red-500 rounded-full blur-[80px] opacity-20"></div>
      </div>

      <div className="w-full max-w-md p-8 relative z-10 flex flex-col h-full max-h-[800px] justify-between">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center pt-8 animate-fade-in">
           <AppLogo size={80} className="mb-6 drop-shadow-2xl shadow-lime-500/50" />
           <h1 className={`text-4xl font-bold font-hindi mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
               श्री Dairy
           </h1>
           <p className={`text-sm tracking-widest uppercase font-medium ${isDarkMode ? 'text-lime-400' : 'text-lime-600'}`}>
               Smart Manager
           </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-center py-8">
            
            {/* Step 1: Language */}
            {step === 0 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-8">
                        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Choose Language</h2>
                        <p className={`text-lg font-hindi ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>भाषा चुनें</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setSelectedLang('en')}
                            className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${selectedLang === 'en' ? 'bg-lime-500 border-lime-500 scale-105 shadow-xl shadow-lime-500/20' : 'bg-transparent border-gray-700 hover:border-gray-500'}`}
                        >
                            <span className={`text-4xl font-bold ${selectedLang === 'en' ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Aa</span>
                            <span className={`text-sm font-medium ${selectedLang === 'en' ? 'text-lime-900' : isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>English</span>
                            {selectedLang === 'en' && <div className="absolute top-3 right-3 bg-white text-lime-600 rounded-full p-1"><Check size={12} strokeWidth={4} /></div>}
                        </button>

                        <button 
                            onClick={() => setSelectedLang('hi')}
                            className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all duration-300 ${selectedLang === 'hi' ? 'bg-lime-500 border-lime-500 scale-105 shadow-xl shadow-lime-500/20' : 'bg-transparent border-gray-700 hover:border-gray-500'}`}
                        >
                            <span className={`text-4xl font-bold font-hindi ${selectedLang === 'hi' ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>अ</span>
                            <span className={`text-sm font-medium ${selectedLang === 'hi' ? 'text-lime-900' : isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>हिंदी</span>
                            {selectedLang === 'hi' && <div className="absolute top-3 right-3 bg-white text-lime-600 rounded-full p-1"><Check size={12} strokeWidth={4} /></div>}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Theme */}
            {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-center mb-8">
                        <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {selectedLang === 'hi' ? 'थीम चुनें' : 'Choose Look'}
                        </h2>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {selectedLang === 'hi' ? 'आप इसे बाद में बदल सकते हैं' : 'You can change this later'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={() => setIsDarkMode(false)}
                            className={`p-4 rounded-3xl border-2 flex items-center justify-between px-6 transition-all duration-300 ${!isDarkMode ? 'bg-white border-lime-500 shadow-xl' : 'bg-transparent border-gray-700'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${!isDarkMode ? 'bg-orange-100 text-orange-500' : 'bg-gray-800 text-gray-400'}`}>
                                    <Sun size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-bold ${!isDarkMode ? 'text-gray-900' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedLang === 'hi' ? 'लाइट मोड' : 'Light Mode'}
                                    </h3>
                                    <p className="text-xs text-gray-500">Daytime clarity</p>
                                </div>
                            </div>
                            {!isDarkMode && <div className="bg-lime-500 text-white rounded-full p-1"><Check size={16} strokeWidth={3} /></div>}
                        </button>

                        <button 
                            onClick={() => setIsDarkMode(true)}
                            className={`p-4 rounded-3xl border-2 flex items-center justify-between px-6 transition-all duration-300 ${isDarkMode ? 'bg-gray-800 border-lime-500 shadow-xl' : 'bg-transparent border-gray-200'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-gray-100 text-gray-400'}`}>
                                    <Moon size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedLang === 'hi' ? 'डार्क मोड' : 'Dark Mode'}
                                    </h3>
                                    <p className="text-xs text-gray-500">Easy on eyes</p>
                                </div>
                            </div>
                            {isDarkMode && <div className="bg-lime-500 text-white rounded-full p-1"><Check size={16} strokeWidth={3} /></div>}
                        </button>
                    </div>
                </div>
            )}

        </div>

        {/* Footer Navigation */}
        <div className="pt-4">
            <button 
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-lime-400 to-lime-500 text-gray-900 font-bold text-lg shadow-lg shadow-lime-500/30 hover:shadow-lime-500/50 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
                {step === 0 ? 'Next' : (selectedLang === 'hi' ? 'शुरू करें' : 'Get Started')}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            {/* Step Indicators */}
            <div className="flex justify-center gap-2 mt-6">
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 0 ? 'w-8 bg-lime-500' : 'w-2 bg-gray-700'}`}></div>
                <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-lime-500' : 'w-2 bg-gray-700'}`}></div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
