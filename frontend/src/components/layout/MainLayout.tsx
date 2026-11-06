
import { useState } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

import Dashboard from "../../pages/Dashboard";
import Inventory from "../../pages/Inventory";
import Sales from "../../pages/Sales";
import PurchaseOrders from "../../pages/PurchaseOrders";
import Analytics from "../../pages/Analytics";
import AIAssistant from "../../pages/AIAssistant";
import Settings from "../../pages/Settings";
import Suppliers from "../../pages/Suppliers";

function MainLayout() {
  const [activePage, setActivePage] = useState("Dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;

      case "Inventory":
        return <Inventory />;

      case "Sales":
        return <Sales />;

      case "Purchase Orders":
        return <PurchaseOrders />;

      case "Analytics":
        return <Analytics />;

      case "AI Intelligence":
        return <AIAssistant />;

      case "Settings":
        return <Settings />;
      case "Suppliers":
        return <Suppliers />;

      default:
        return (
          <div className="bg-white rounded-xl p-8 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">
              {activePage}
            </h2>
            <p className="text-slate-500 mt-2">
              This module is coming soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar title={activePage} />

        <main className="flex-1 p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
