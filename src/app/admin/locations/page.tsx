"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Building,
  Store,
  Compass,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useAdminContext } from "@/components/admin/AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LocationFormModal } from "@/components/admin/LocationFormModal";

export default function LocationManagementPage() {
  const { selectedCompanyId } = useAdminContext();

  const [locations, setLocations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((data) => {
        if (data.companies) setCompanies(data.companies);
      });
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/locations?companyId=${selectedCompanyId}`);
      const data = await res.json();
      if (data.locations) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [selectedCompanyId]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentLocation(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc: any) => {
    setIsEditing(true);
    setCurrentLocation(loc);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            สถานที่ปฏิบัติงาน & พิกัดจุดบูธ (Work Locations & Booths)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดพิกัดละติจูด/ลองจิจูด และรัศมีเรดาร์ GPS สำหรับตรวจสอบการลงเวลาเข้า-ออกงานของพนักงาน
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="font-semibold text-xs h-9 bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          เพิ่มสถานที่ / บูธใหม่
        </Button>
      </div>

      {/* Grid of Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            กำลังโหลดข้อมูลสถานที่...
          </div>
        ) : locations.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            ยังไม่มีข้อมูลสถานที่ปฏิบัติงาน
          </div>
        ) : (
          locations.map((loc) => {
            const isBooth = loc.locationType === "BOOTH";
            return (
              <Card
                key={loc.id}
                className="hover:shadow-md transition-all border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 min-h-[52px]">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          isBooth
                            ? "bg-amber-100 text-amber-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {isBooth ? <Store className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className="font-bold text-sm text-slate-900 block leading-snug line-clamp-2"
                          title={loc.locationName}
                        >
                          {loc.locationName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                          {loc.locationCode}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={isBooth ? "warning" : "info"}
                      size="sm"
                      className="shrink-0 whitespace-nowrap"
                    >
                      {isBooth ? "จุดบูธ" : "สำนักงาน"}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 min-h-8">
                    {loc.address || "ไม่มีรายละเอียดที่อยู่ระบุ"}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Compass className="h-3.5 w-3.5 text-slate-400" />
                        พิกัด GPS:
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-700">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-[11px]">รัศมีที่อนุญาต (Radius):</span>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full text-[11px]">
                        {loc.allowedRadiusMeters} เมตร
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> ดูบน Google Maps
                  </a>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(loc)}
                    className="h-7 text-xs font-medium"
                  >
                    <Edit2 className="h-3 w-3 mr-1" /> แก้ไข
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modular Location Modal */}
      <LocationFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLocations}
        isEditing={isEditing}
        currentId={currentLocation?.id || null}
        companies={companies}
        initialData={currentLocation}
      />
    </div>
  );
}
