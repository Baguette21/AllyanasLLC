import React, { useState } from "react";

interface LoginSectionProps {
  onLogin: () => void;
  onBack: () => void;
}

export const LoginSection: React.FC<LoginSectionProps> = ({ onLogin, onBack }) => {
    const[accessCode, setAccessCode] = useState("");
    const[error, setError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if(accessCode === "hello") {
            onLogin();
        } else {
            setError("Invalid access code or password");
        }
    };

    return (
        <div className="min-h-[96vh] flex flex-col">
            <div className="bg-[#F5F2EE] flex items-center justify-center py-8 px-4">
                <img    
                    src="/images/startup.png"
                    alt="Header"
                    className="object-contain h-20"
                />
            </div>

            <div className="flex-1 bg-[#94332d] flex items-center justify-center px-4 py-8">
                <div className="bg-[#F5F2EE] rounded-lg p-8 w-full max-w-7xl min-h-[60vh] flex flex-col justify-center relative">
                    <button
                        onClick={onBack}
                        className="absolute left-4 top-4 text-[#473E1D] flex items-center gap-2 text-lg"
                    >
                        ← Back
                    </button>
                    
                    <form onSubmit={handleLogin} className="mx-auto w-full max-w-xl">
                        <div className="mb-6 w-full">
                            <label className="block text-medium font-regular text-[#473E1D] mb-2">
                                Access Code
                            </label>

                            <input
                                type="password"
                                placeholder="Enter Access Code"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                className="w-full px-7 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#473E1D] text-[#473E1D]"
                            />
                        </div>

                        {error && (
                            <p className="text-[#94332d] text-sm mb-4 text-center">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-[#473E1D] text-white py-2 px-4 rounded-sm hover:bg-[#5C4D25] transition-colors"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
