import React from "react";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";


export const metadata = {
  title: "Employee Portal | HR Management",
  description: "ระบบลงเวลาทำงานและตารางงานพนักงาน",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <EmployeeLayout>{children}</EmployeeLayout>;
}
