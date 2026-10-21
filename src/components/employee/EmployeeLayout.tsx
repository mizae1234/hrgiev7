"use client";

import React from "react";
import { EmployeeHeader } from "./EmployeeHeader";
import { EmployeeBottomNav } from "./EmployeeBottomNav";

export function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-start items-center">
      {/* Centered Mobile Shell */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col shadow-2xl relative border-x border-slate-200">
        <EmployeeHeader />
        <main className="flex-1 p-4 pb-24 overflow-y-auto">{children}</main>
        <EmployeeBottomNav />
      </div>
    </div>
  );
}
