import React from "react";

interface ContactSectionProps {
  onBack: () => void;
  onLogin: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onBack, onLogin }) => {
  return (
    <section className="min-h-screen bg-[rgba(245,242,238,1)] py-4 px-4 md:py-8 md:px-0">
      <div className="container mx-auto">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[rgba(148,51,45,1)]">Contact Us</h1>
          <button
            onClick={onBack}
            className="w-full sm:w-auto bg-[#4CAF50] text-white px-6 py-2 rounded-lg hover:bg-[#45a049] transition-colors"
          >
            Back
          </button>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
          {/* Restaurant Information */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-[rgba(148,51,45,1)]">
              Restaurant Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-xl md:text-2xl mr-3">📍</span>
                <div>
                  <h3 className="font-medium">Address</h3>
                  <p className="text-gray-600 text-sm md:text-base">123 Main Street, City Name, State 12345</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-xl md:text-2xl mr-3">📞</span>
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-gray-600 text-sm md:text-base">+1 (123) 456-7890</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-xl md:text-2xl mr-3">✉️</span>
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-gray-600 text-sm md:text-base break-words">info@allyanasfoodhouse.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-[rgba(148,51,45,1)]">
              Operating Hours
            </h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-xl md:text-2xl mr-3">🕒</span>
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium">Monday - Friday</h3>
                    <p className="text-gray-600 text-sm md:text-base">10:00 AM - 10:00 PM</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Saturday - Sunday</h3>
                    <p className="text-gray-600 text-sm md:text-base">11:00 AM - 11:00 PM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-4 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-[rgba(148,51,45,1)]">
            Send us a Message
          </h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(148,51,45,0.5)]"
                  placeholder="Your Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(148,51,45,0.5)]"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(148,51,45,0.5)]"
                placeholder="Message Subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(148,51,45,0.5)] h-24 md:h-32"
                placeholder="Your Message"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-[rgba(148,51,45,1)] text-white py-3 rounded-lg hover:bg-[rgba(148,51,45,0.8)] transition-colors text-sm md:text-base"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Social Media Links */}
        <div className="text-center mb-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-[rgba(148,51,45,1)]">
            Follow Us
          </h2>
          <div className="flex justify-center space-x-8 md:space-x-12">
            <a href="#" className="text-2xl md:text-3xl hover:opacity-80 transition-opacity">📱</a>
            <a href="#" className="text-2xl md:text-3xl hover:opacity-80 transition-opacity">📘</a>
            <a href="#" className="text-2xl md:text-3xl hover:opacity-80 transition-opacity">📸</a>
          </div>
        </div>

        <div className="flex justify-center mt-8">
           <button
            onClick={onLogin}
            className="px-6 py-2 bg-white text-[#F5F2EE] rounded-lg hover:bg-[#F5F2EE] transition-colors"
          >
            .
          </button>
        </div>
      </div>
    </section>
  );
};
