import { SidebarLayout } from "./components/SidebarLayout";
import { Dashboard } from "./components/Dashboard";
import { DataIngestion } from "./components/DataIngestion";
import { Communications } from "./components/Communications";
import React, { useState } from "react";

export default function App() {
  const [view, setView] = useState("dashboard");

  return (
    <SidebarLayout currentView={view} onViewChange={setView}>
      {view === "dashboard" && <Dashboard />}
      {view === "ingestion" && <DataIngestion />}
      {view === "communications" && <Communications />}
      {view === "students" && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Student Directory Module</h2>
          <p className="text-gray-500 max-w-md">The full CRM view goes here. Includes advanced filtering, global search, and individual student profiles with historical academic records.</p>
        </div>
      )}
      {view === "reports" && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Analytics & Reports Module</h2>
          <p className="text-gray-500 max-w-md">Deep BI capabilities to analyze institutional-level performance by batch, semester, and demographic.</p>
        </div>
      )}
      {view === "settings" && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-gray-200 rounded-xl bg-white">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Tenant & Integration Settings</h2>
          <p className="text-gray-500 max-w-md">Configure SMTP, Twilio API Keys, Stripe Billing, and SSO integrations for this platform instance.</p>
        </div>
      )}
    </SidebarLayout>
  );
}
