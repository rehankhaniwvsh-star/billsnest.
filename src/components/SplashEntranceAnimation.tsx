import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MorphingMascot, MascotMode } from './MorphingMascot';
import { ReceiptLogoIcon } from './BrandLogo';
import { ArrowRight, Sparkles } from 'lucide-react';

interface SplashEntranceAnimationProps {
  brandName?: string;
  tagline?: string;
  onComplete?: () => void;
}

export const SplashEntranceAnimation: React.FC<SplashEntranceAnimationProps> = ({
  brandName = 'Invobill',
  tagline = 'Invoices, paid faster',
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [stage, setStage] = useState<number>(0);
  const [activeMascotMode, setActiveMascotMode] = useState<MascotMode>('blob');

  // Progressive sequence timing for the entrance animation
  useEffect(() => {
    // Step 0: Blob Mascot (0ms)
    setActiveMascotMode('blob');

    // Step 1: Dots Wave Loader (700ms)
    const t1 = setTimeout(() => {
      setStage(1);
      setActiveMascotMode('dots');
    }, 700);

    // Step 2: Atom Multi-Orbit Prism (1400ms)
    const t2 = setTimeout(() => {
      setStage(2);
      setActiveMascotMode('atom');
    }, 1400);

    // Step 3: Rainbow Track & Final Morph into Logo (2100ms)
    const t3 = setTimeout(() => {
      setStage(3);
    }, 2100);

    // Step 4: Smooth Auto-Transition into Website (2900ms)
    const t4 = setTimeout(() => {
      handleFinish();
    }, 2900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleFinish = () => {
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="website-entrance-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFFFFF] dark:bg-[#070C1E] select-none overflow-hidden"
        >
          {/* Subtle Ambient Background Glows */}
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-br from-orange-500/15 via-red-500/10 to-amber-500/15 rounded-full blur-3xl pointer-events-none -top-20 -left-20 animate-pulse" />
          <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/15 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20 animate-pulse" />

          {/* Central Animated Morphing Stage */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-md w-full">
            {/* Animated Icon Container */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center mb-6">
              <AnimatePresence mode="wait">
                {stage < 3 ? (
                  <motion.div
                    key={`splash-mascot-${activeMascotMode}`}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <MorphingMascot
                      mode={activeMascotMode}
                      size="custom"
                      customSizeClass="w-28 h-28 sm:w-32 sm:h-32"
                      interactive={false}
                    />
                  </motion.div>
                ) : (
                  /* Morphing Final Transformation to Brand Logo */
                  <motion.div
                    key="splash-final-logo"
                    initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 20 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <ReceiptLogoIcon sizeClass="w-24 h-24 sm:w-28 sm:h-28" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Typography Entrance matching uploaded brand lockup */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-1.5 flex flex-col items-center"
            >
              <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.035em] text-[#11192E] dark:text-[#F9FAFB]">
                {brandName}
              </h1>

              <p className="text-[#E65100] dark:text-[#FB923C] font-bold text-sm sm:text-lg tracking-tight">
                {tagline}
              </p>

              {/* Progress Indicator Dots */}
              <div className="flex items-center gap-1.5 pt-4">
                {[0, 1, 2, 3].map((s) => (
                  <motion.div
                    key={`splash-dot-${s}`}
                    className="h-1.5 rounded-full transition-all duration-300"
                    animate={{
                      width: stage === s ? 24 : 6,
                      backgroundColor: stage === s ? '#FF5722' : '#E5E7EB',
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Skip / Enter Instant Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={handleFinish}
              className="mt-8 inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span>Enter Website</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
