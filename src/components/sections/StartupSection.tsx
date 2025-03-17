import React from "react";

interface StartupSectionProps {
  onGetStarted: () => void;
  onContact: () => void;
}

export const StartupSection: React.FC<StartupSectionProps> = ({ onGetStarted, onContact }) => {
  return (
    <section className="flex flex-col overflow-hidden items-center text-xs text-black font-normal pt-[100px] sm:pt-[226px] pb-[41px] px-4 sm:px-2 bg-[#F5F2EE] ">
      <div className="min-h-[343px]">
        <img
          loading="lazy"
          src="/images/startup.png"
          alt="Startup Image"
          className="aspect-[1.49] object-contain object-center w-full overflow-hidden self-stretch mt-8"
        />
      </div>
      <div  className="pt-32">
      <button 
        className="border bg-[#473E1D] w-[161px] max-w-full text-sm text-[#010101] font-bold mt-10 sm:mt-[243px] px-6 py-[18px] rounded-[50px] border-[rgba(62,53,28,1)] border-solid "
        onClick={onGetStarted}
      >
        <span className="text-[#F5F2EE]">Lets get started!</span>
      </button>

      <div className="mt-auto text-center pt-48">
        <span className="text-[#473E1D]">Contact Us</span>{" "}
        <span className="text-[#EEA733]" onClick={onContact}>
          Here
        </span>
      </div>
      </div>
    </section>
  );
};
