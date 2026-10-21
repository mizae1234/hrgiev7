import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";


export const metadata = {
  title: "Admin Portal | HR Management",
  description: "ระบบบริหารจัดการทรัพยากรบุคคล การลงเวลา และจุดบูธ",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
