"use client";

import React, { useState, createContext, useContext } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface AdminContextType {
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
}

const AdminContext = createContext<AdminContextType>({
  selectedCompanyId: "ALL",
  setSelectedCompanyId: () => {},
});

export function useAdminContext() {
  return useContext(AdminContext);
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("ALL");

  return (
    <AdminContext.Provider value={{ selectedCompanyId, setSelectedCompanyId }}>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <AdminHeader
            onToggleSidebar={() => setSidebarOpen(true)}
            selectedCompanyId={selectedCompanyId}
            onCompanyChange={setSelectedCompanyId}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
