import React from "react";
import { Header } from '@/components/layout/Header'; 

interface ContactSectionProps {
  onBack: () => void;
  onLogin: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onBack, onLogin }) => {
  return (
    <>
      <Header isSticky />
      
      {/* 
        Use flex-col to stack items vertically 
        and justify-between to push the last element to the bottom.
      */}
      <section className="min-h-[836px] bg-[#473E1D] py-4 px-4 md:py-8 md:px-0 flex flex-col justify-between">
        
        {/* Main content grows to fill available space */}
        <div className="container mx-auto flex-grow">
          {/* Back Button */}
          <div className="pl-4 mb-6">
            <button
              onClick={onBack}
              className="bg-[#F5F2EE] text-[#473E1D] px-2 py-1 rounded-full hover:bg-[#5c4f26] transition-colors"
            >
              ←
            </button>
          </div>

          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white pb-5">Contact Us</h1>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border border-[#F5F2EE] rounded-2xl">
              <span className="inline-flex items-center justify-center w-12 h-12 p-2 bg-[#F5F2EE] text-[#473E1D] rounded-2xl text-xl md:text-2xl">
                📍
              </span>
              <div>
                <h3 className="font-medium text-[#F5F2EE]">Address</h3>
                <p className="text-[#F5F2EE] text-sm md:text-base">
                  123 Main Street, City Name, State 12345
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border border-[#F5F2EE] rounded-2xl">
              <span className="inline-flex items-center justify-center w-12 h-12 p-2 bg-[#F5F2EE] text-[#473E1D] rounded-2xl text-xl md:text-2xl">
                📞
              </span>
              <div>
                <h3 className="font-medium text-[#F5F2EE]">Phone</h3>
                <p className="text-[#F5F2EE] text-sm md:text-base">+1 (123) 456-7890</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border border-[#F5F2EE] rounded-2xl">
              <span className="inline-flex items-center justify-center w-12 h-12 p-2 bg-[#F5F2EE] text-[#473E1D] rounded-2xl text-xl md:text-2xl">
                ✉️
              </span>
              <div>
                <h3 className="font-medium text-[#F5F2EE]">Email</h3>
                <p className="text-[#F5F2EE] text-sm md:text-base break-words">
                  info@allyanasfoodhouse.com
                </p>
              </div>
            </div>
          </div>
        </div>   

        <div className="text-center mb-4">
          <span 
            className="text-[#473E1D] cursor-pointer hover:text-[#F5F2EE]"
            onClick={onLogin}
          >
            Here
          </span>
        </div>

      </section>
    </>
  );
};
