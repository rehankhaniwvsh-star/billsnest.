import React from 'react';

export const INVOBILL_ORIGINAL_ASSET = '/assets/aistudio/1793287173545_6d7616ac.png';
export const INVOBILL_ICON_ASSET = '/assets/invobill_icon.png';
export const INVOBILL_FULL_LOGO_ASSET = '/assets/invobill_full_logo.png';

interface BrandLogoProps {
  brandName?: string;
  tagline?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  iconOnly?: boolean;
  layout?: 'horizontal' | 'vertical';
  useFullImage?: boolean;
}

export const ReceiptLogoIcon: React.FC<{
  className?: string;
  sizeClass?: string;
  showSparkle?: boolean;
}> = ({ className = '', sizeClass = 'w-10 h-10' }) => {
  return (
    <div
      className={`relative ${sizeClass} rounded-[24%] shadow-sm shadow-orange-500/15 flex items-center justify-center transition-all duration-300 shrink-0 select-none overflow-hidden ${className}`}
    >
      <img
        src={INVOBILL_ICON_ASSET}
        alt="Invobill Icon"
        className="w-full h-full object-contain select-none pointer-events-none drop-shadow-sm"
        onError={(e) => {
          // Graceful fallback to original uploaded asset
          const target = e.currentTarget;
          if (target.src !== window.location.origin + INVOBILL_ORIGINAL_ASSET) {
            target.src = INVOBILL_ORIGINAL_ASSET;
          }
        }}
      />
    </div>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  brandName = 'Invobill',
  tagline = 'Invoices, paid faster',
  size = 'md',
  showTagline = true,
  className = '',
  iconOnly = false,
  layout = 'horizontal',
  useFullImage = false,
}) => {
  // Sizing configurations matching the exact uploaded logo composition
  const sizeMap = {
    sm: {
      icon: 'w-7 h-7 sm:w-8 sm:h-8',
      title: 'text-lg sm:text-xl font-black tracking-[-0.035em]',
      tagline: 'text-[10px] sm:text-[11px] font-semibold -mt-0.5 tracking-tight',
      gap: 'gap-2',
      imgHeight: 'h-10 sm:h-12',
    },
    md: {
      icon: 'w-10 h-10 sm:w-11 sm:h-11',
      title: 'text-2xl sm:text-[26px] font-black tracking-[-0.035em]',
      tagline: 'text-xs sm:text-[13px] font-semibold -mt-0.5 tracking-tight',
      gap: 'gap-3',
      imgHeight: 'h-14 sm:h-16',
    },
    lg: {
      icon: 'w-14 h-14 sm:w-16 sm:h-16',
      title: 'text-3xl sm:text-4xl font-black tracking-[-0.04em]',
      tagline: 'text-sm sm:text-base font-semibold mt-0 tracking-tight',
      gap: 'gap-4',
      imgHeight: 'h-20 sm:h-24',
    },
    xl: {
      icon: 'w-20 h-20 sm:w-24 sm:h-24',
      title: 'text-4xl sm:text-5xl font-black tracking-[-0.04em]',
      tagline: 'text-base sm:text-lg font-semibold mt-0.5 tracking-tight',
      gap: 'gap-5',
      imgHeight: 'h-28 sm:h-32',
    },
  };

  const currentSize = sizeMap[size];

  if (iconOnly) {
    return <ReceiptLogoIcon sizeClass={currentSize.icon} className={className} />;
  }

  // If vertical layout or explicitly requested full image lockup
  if (layout === 'vertical' || useFullImage) {
    return (
      <div
        className={`inline-flex flex-col items-center text-center group cursor-pointer select-none transition-transform active:scale-[0.98] ${className}`}
      >
        <img
          src={INVOBILL_FULL_LOGO_ASSET}
          alt={`${brandName} — ${tagline}`}
          className={`${currentSize.imgHeight} w-auto object-contain drop-shadow-sm select-none pointer-events-none`}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== window.location.origin + INVOBILL_ORIGINAL_ASSET) {
              target.src = INVOBILL_ORIGINAL_ASSET;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center ${currentSize.gap} group cursor-pointer select-none transition-transform active:scale-[0.98] ${className}`}
    >
      {/* Uploaded Squircle Receipt App Icon */}
      <ReceiptLogoIcon sizeClass={currentSize.icon} />

      {/* Typography: Solid Dark Navy Brand Mark + Warm Terracotta Tagline matching uploaded logo */}
      <div className="flex flex-col items-start justify-center">
        <span
          className={`${currentSize.title} text-[#1A202C] dark:text-[#F8FAFC] leading-none font-sans font-black transition-colors group-hover:text-[#EA580C]`}
        >
          {brandName}
        </span>

        {showTagline && tagline && (
          <span
            className={`${currentSize.tagline} text-[#D46933] dark:text-[#FF8A65] leading-snug font-sans transition-colors`}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};


