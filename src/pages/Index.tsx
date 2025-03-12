import React, { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StartupSection } from "@/components/sections/StartupSection";
import { OrderTypeSection } from "@/components/sections/OrderTypeSection";
import { MenuSection } from "@/components/sections/MenuSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { CheckoutSection } from "@/components/sections/CheckoutSection";
import { CartProvider } from "@/context/CartContext";

import { LoginSection } from "@/components/staffSection/LoginSection";
import { HomepageSection } from "@/components/staffSection/HomepageSection";
import { ManageMenuSection } from "@/components/staffSection/ManageMenuSection";
import { SalesDataSection } from "@/components/staffSection/SalesDataSection";
import { CheckOrders } from "@/components/staffSection/CheckOrders";

type Section =
  | "startup"
  | "order-type"
  | "menu"
  | "contact"
  | "checkout"
  | "login"
  | "homepage"
  | "staff-menu"
  | "staff-data"
  | "check-orders";

interface OrderInfo {
  selectedType?: "dine-in" | "pick-up";
  tableNumber?: string;
  fullName?: string;
  phoneNumber?: string;
  additionalInfo: string;
}

const Index = () => {
  const [currentSection, setCurrentSection] = useState<Section>("startup");
  const [orderInfo, setOrderInfo] = useState<OrderInfo>({
    additionalInfo: "",
  });

  const renderSection = () => {
    switch (currentSection) {
      case "startup":
        return (
          <StartupSection
            onGetStarted={() => setCurrentSection("order-type")}
            onContact={() => setCurrentSection("contact")}
          />
        );
      case "order-type":
        return (
          <OrderTypeSection
            onConfirm={() => setCurrentSection("menu")}
            setOrderInfo={setOrderInfo}
            onContact={() => setCurrentSection("contact")}
          />
        );
      case "menu":
        return (
          <MenuSection
            orderInfo={orderInfo}
            onBack={() => setCurrentSection("order-type")}
            onCheckout={() => setCurrentSection("checkout")}
          />
        );
      case "contact":
        return (
          <ContactSection
            onBack={() => setCurrentSection("startup")}
            onLogin={() => setCurrentSection("login")}
          />
        );
      case "checkout":
        return (
          <CheckoutSection
            orderInfo={orderInfo}
            onBack={() => setCurrentSection("menu")}
          />
        );
      case "login":
        return (
          <LoginSection
            onBack={() => setCurrentSection("contact")}
            onLogin={() => setCurrentSection("homepage")}
          />
        );
      case "homepage":
        return (
          <HomepageSection
            onCheckOrder={() => setCurrentSection("check-orders")}
            onSalesData={() => setCurrentSection("staff-data")}
            onManageMenu={() => setCurrentSection("staff-menu")}
          />
        );
      case "staff-menu":
        return (
          <ManageMenuSection onBack={() => setCurrentSection("homepage")} />
        );
      case "staff-data":
        return (
          <SalesDataSection
            totalSales={10000}
            totalOrders={250}
            productsSold={500}
            newCustomers={50}
          />
        );
      case "check-orders":
        return <CheckOrders onBack={() => setCurrentSection("homepage")} />;
      default:
        return (
          <StartupSection
            onGetStarted={() => setCurrentSection("order-type")}
            onContact={() => setCurrentSection("contact")}
          />
        );
    }
  };

  const footerBg =
    currentSection === "login" ||
    currentSection === "homepage" ||
    currentSection === "check-orders"
      ? "#94332d"
      : "#F5F2EE";

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col">
        {currentSection !== "startup" && currentSection !== "login" && (
          <Header />
        )}
        <main className="flex-grow">{renderSection()}</main>
        <Footer bgColor={footerBg} />
      </div>
    </CartProvider>
  );
};

export default Index;
