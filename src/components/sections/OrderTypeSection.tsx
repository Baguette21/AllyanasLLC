import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type OrderType = "dine-in" | "pick-up" | null;

interface OrderInfo {
  selectedType?: OrderType;
  tableNumber?: string;
  fullName?: string;
  phoneNumber?: string;
  additionalInfo: string;
}

interface OrderTypeSectionProps {
  onConfirm: () => void;
  setOrderInfo: (info: OrderInfo) => void;
  onContact: () => void;
}

export const OrderTypeSection: React.FC<OrderTypeSectionProps> = ({ onConfirm, setOrderInfo, onContact }) => {
  const [selectedType, setSelectedType] = useState<OrderType>(null);
  const [orderInfo, setLocalOrderInfo] = useState<OrderInfo>({
    additionalInfo: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOrderTypeClick = (type: OrderType) => {
    setSelectedType(type);
    setLocalOrderInfo(prev => ({
      ...prev,
      selectedType: type
    }));
    setErrors({});
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+?([0-9]{2})?[-. ]?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  };

  const validateTableNumber = (table: string) => {
    const tableNum = parseInt(table);
    return !isNaN(tableNum) && tableNum >= 1 && tableNum <= 16;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For table numbers, only allow numbers
    if (name === "tableNumber") {
      if (value && !/^\d*$/.test(value)) {
        return;
      }
    }
    
    setLocalOrderInfo(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }

    // Validate on change
    if (name === "phoneNumber" && value && !validatePhoneNumber(value)) {
      setErrors(prev => ({
        ...prev,
        phoneNumber: "Please enter a valid phone number"
      }));
    }

    if (name === "tableNumber" && value && !validateTableNumber(value)) {
      setErrors(prev => ({
        ...prev,
        tableNumber: "Please enter a valid table number (1-16)"
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selectedType === "dine-in") {
      if (!orderInfo.tableNumber) {
        newErrors.tableNumber = "Table number is required";
      } else if (!validateTableNumber(orderInfo.tableNumber)) {
        newErrors.tableNumber = "Please enter a valid table number (1-16)";
      }
    }

    if (selectedType === "pick-up") {
      if (!orderInfo.fullName?.trim()) {
        newErrors.fullName = "Full name is required";
      }
      if (!orderInfo.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (!validatePhoneNumber(orderInfo.phoneNumber)) {
        newErrors.phoneNumber = "Please enter a valid phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    if (selectedType === "dine-in") {
      return !!orderInfo.tableNumber && validateTableNumber(orderInfo.tableNumber);
    }
    if (selectedType === "pick-up") {
      return !!orderInfo.fullName?.trim() && 
             !!orderInfo.phoneNumber && 
             validatePhoneNumber(orderInfo.phoneNumber);
    }
    return false;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      setOrderInfo(orderInfo);
      onConfirm();
    }
  };

  return (
    <section className="bg-[rgba(148,51,45,1)] overflow-hidden pb-[39px]">
      <div className="flex w-full flex-col items-stretch text-xs text-black font-normal mt-[33px] px-4 sm:px-[35px]">
        <h2 className="text-[#010101] text-xl text-center">
          How would you like to order?
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch gap-6 text-[32px] whitespace-nowrap text-center mt-[30px]">
          <div 
            className={`bg-[rgba(245,242,238,1)] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] flex flex-col items-stretch flex-1 pt-3 rounded-[15px] cursor-pointer transition-all ${selectedType === "dine-in" ? "ring-4 ring-[rgba(71,62,29,1)]" : ""}`}
            onClick={() => handleOrderTypeClick("dine-in")}
          >
            <div className="self-center z-10 text-2xl sm:text-[32px] font-bold">DINE-IN</div>
            <img loading="lazy" src="/images/dinein.png" alt="Dine-in" className="aspect-[0.92] object-contain w-[120px] sm:w-[156px] mx-auto mt-2" />
          </div>
          <div 
            className={`bg-[rgba(245,242,238,1)] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] flex flex-col items-stretch flex-1 pt-3 pb-1.5 px-1.5 rounded-[15px] cursor-pointer transition-all ${selectedType === "pick-up" ? "ring-4 ring-[rgba(71,62,29,1)]" : ""}`}
            onClick={() => handleOrderTypeClick("pick-up")}
          >
            <div className="self-center text-2xl sm:text-[32px] font-bold">PICK-UP</div>
            <img loading="lazy" src="/images/pickup.png" alt="Pick-up" className="aspect-[0.93] object-contain w-[110px] sm:w-[141px] mt-[11px] mx-auto" />
          </div>
        </div>
        {selectedType && (
          <div className="bg-[rgba(245,242,238,1)] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] flex flex-col items-stretch mt-9 p-4 sm:p-[21px] rounded-[15px]">
            <h3 className="font-semibold text-lg mb-4">
              {selectedType === "dine-in" ? "Table Information" : "Contact Information"}
            </h3>
            
            {selectedType === "dine-in" && (
              <div className="mb-4">
                <input
                  type="text"
                  name="tableNumber"
                  value={orderInfo.tableNumber || ""}
                  onChange={handleInputChange}
                  placeholder="Enter your table number (1-16)"
                  className={`px-[11px] py-[18px] border-[rgba(71,62,29,1)] border-solid border-2 rounded-md w-full ${errors.tableNumber ? 'border-red-500' : ''}`}
                />
                {errors.tableNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.tableNumber}</p>
                )}
              </div>
            )}

            {selectedType === "pick-up" && (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    name="fullName"
                    value={orderInfo.fullName || ""}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`px-[11px] py-[18px] border-[rgba(71,62,29,1)] border-solid border-2 rounded-md w-full ${errors.fullName ? 'border-red-500' : ''}`}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                  )}
                </div>
                <div className="mb-4">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={orderInfo.phoneNumber || ""}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className={`px-[11px] py-[18px] border-[rgba(71,62,29,1)] border-solid border-2 rounded-md w-full ${errors.phoneNumber ? 'border-red-500' : ''}`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
                  )}
                </div>
              </>
            )}

            <h3 className="font-semibold text-lg mb-2">Additional Information</h3>
            <textarea
              name="additionalInfo"
              value={orderInfo.additionalInfo}
              onChange={handleInputChange}
              placeholder="Any special requests or notes?"
              className="flex shrink-0 h-[151px] border-[rgba(71,62,29,1)] border-solid border-2 rounded-md p-3 mb-4 w-full"
            />
            
            <button 
              className={`bg-[rgba(71,62,29,1)] border self-center w-[215px] max-w-full text-white text-center px-11 py-[13px] rounded-[50px] border-[rgba(71,62,29,1)] border-solid max-md:px-5 transition-opacity ${!isFormValid() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
              disabled={!isFormValid()}
              onClick={handleConfirm}
            >
              Confirm & Go to Menu
            </button>
          </div>
        )}
        <div className="text-center self-center mt-9" onClick={onContact}>
          <span className="text-[rgba(245,244,240,1)]">Contact Us</span>{" "}
          <span className="text-[rgba(238,167,51,1)]">Here</span>
        </div>
      </div>
    </section>
  );
};