import React from "react";

interface StartupSectionProps {
  onGetStarted: () => void;
  onContact: () => void;
}

export const StartupSection: React.FC<StartupSectionProps> = ({ onGetStarted, onContact }) => {
  return (
    <section className="flex flex-col overflow-hidden items-center text-xs text-black font-normal pt-[100px] sm:pt-[226px] pb-[41px] px-4 sm:px-2">
      <div className="w-full max-w-[600px] mx-auto">
        <img
          loading="lazy"
          src="/images/startup.png"
          alt="Startup Image"
          className="aspect-[1.49] object-contain object-center w-full overflow-hidden self-stretch mt-8"
        />
      </div>
      <button 
        className="border bg-[rgba(71,62,29,1)] w-[161px] max-w-full text-sm text-[#010101] font-bold mt-10 sm:mt-[243px] px-6 py-[18px] rounded-[50px] border-[rgba(62,53,28,1)] border-solid"
        onClick={onGetStarted}
      >
        <span className="text-[rgba(255,255,255,1)]">Lets get started!</span>
      </button>
      <div 
        className="text-center mt-8 sm:mt-[94px] cursor-pointer"
        onClick={onContact}
      >
        Contact Us<span className="text-[rgba(148,51,45,1)]"> Here</span>
      </div>
    </section>
  );
};
