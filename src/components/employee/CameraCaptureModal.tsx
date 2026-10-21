"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Smartphone,
  ShieldCheck,
  Compass,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { calculateDistanceMeters, formatDistance } from "@/lib/geo";
import { stopMediaStream, stopAllActiveMediaStreams } from "@/lib/camera";

export interface TargetLocation {
  id: string;
  locationName: string;
  locationType: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
}

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "CHECK_IN" | "CHECK_OUT";
  targetLocation: TargetLocation;
  onSuccess: (result: any) => void;
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  mode,
  targetLocation,
  onSuccess,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shouldStopRef = useRef(false);
  const isMountedRef = useRef(true);

  // States
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // GPS States
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Robust Stop Camera Helper
  const stopCamera = useCallback(() => {
    shouldStopRef.current = true;
    if (streamRef.current) {
      stopMediaStream(streamRef.current, videoRef.current);
      streamRef.current = null;
    }
    stopAllActiveMediaStreams();
    setCameraLoading(false);
  }, []);

  // Safe Close Handler
  const handleSafeClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Start Camera Stream with Race-Condition Guard
  const startCamera = useCallback(async () => {
    shouldStopRef.current = false;
    setCameraLoading(true);
    setCameraError(null);

    // Stop any existing stream before starting a new one
    if (streamRef.current) {
      stopMediaStream(streamRef.current, videoRef.current);
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("เบราว์เซอร์ของคุณไม่รองรับการเปิดกล้องโดยตรง");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      // Check if modal was closed or unmounted while waiting for user permission
      if (shouldStopRef.current || !isMountedRef.current || !isOpen) {
        stopMediaStream(stream);
        return;
      }

      streamRef.current = stream;
      if (typeof window !== "undefined") {
        (window as any).__currentMediaStream = stream;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraLoading(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("กรุณาอนุญาตการเข้าถึงกล้องถ่ายภาพในการตั้งค่าเบราว์เซอร์");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("ไม่พบอุปกรณ์กล้องบนเครื่องนี้");
      } else {
        setCameraError("ไม่สามารถเปิดกล้องได้: " + (err.message || "เกิดข้อผิดพลาด"));
      }
    }
  }, [isOpen]);

  // Request Device GPS
  const requestGPS = useCallback(() => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("เบราว์เซอร์ไม่รองรับระบบระบุตำแหน่ง GPS");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGpsLoading(false);
      },
      (err) => {
        console.warn("GPS error:", err);
        setGpsLoading(false);
        if (err.code === 1) {
          setGpsError("กรุณาอนุญาตการเข้าถึงพิกัด GPS ในอุปกรณ์ของคุณ");
        } else if (err.code === 2) {
          setGpsError("ไม่สามารถรับสัญญาณตำแหน่ง GPS ได้ กรุณาลองใหม่อีกครั้ง");
        } else {
          setGpsError("หมดเวลาในการค้นหาตำแหน่ง GPS");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Use Target GPS (Convenient testing fallback for desktop dev)
  const useSimulatedTargetGps = () => {
    setGpsCoords({
      latitude: targetLocation.latitude,
      longitude: targetLocation.longitude,
      accuracy: 10,
    });
    setGpsError(null);
  };

  // Initialize camera and GPS when modal opens, clean up when it closes
  useEffect(() => {
    isMountedRef.current = true;

    if (isOpen) {
      setCapturedImage(null);
      setSubmitting(false);
      requestGPS();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, startCamera, requestGPS, stopCamera]);

  // Safety listeners: Stop camera on tab switch, window blur, or navigation away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };

    const handleBeforeUnload = () => {
      stopCamera();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSafeClose();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleBeforeUnload);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [stopCamera, handleSafeClose]);

  // Capture Photo from Video to Canvas and IMMEDIATELY shutdown camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontal if front camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Compress to JPEG with 0.8 quality (~120KB)
    const base64Data = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(base64Data);

    // CRITICAL: Stop live hardware camera immediately after photo is captured
    stopCamera();
  };

  // Retake Photo: restart camera
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  // Distance calculation
  const distance = gpsCoords
    ? calculateDistanceMeters(
        gpsCoords.latitude,
        gpsCoords.longitude,
        targetLocation.latitude,
        targetLocation.longitude
      )
    : null;

  const isWithinRadius = distance !== null && distance <= targetLocation.allowedRadiusMeters;

  // Submit Attendance (Check In or Check Out)
  const handleSubmit = async () => {
    if (!capturedImage) {
      alert("กรุณาถ่ายภาพยืนยันตัวตนก่อนบันทึกเวลา");
      return;
    }

    if (!gpsCoords) {
      alert("ไม่พบข้อมูลพิกัด GPS กรุณารอระบบตรวจจับตำแหน่ง");
      return;
    }

    if (!isWithinRadius) {
      alert(
        `คุณอยู่นอกพื้นที่ที่กำหนด: ระยะห่าง ${Math.round(distance!)} เมตร (รัศมีที่อนุญาตไม่เกิน ${
          targetLocation.allowedRadiusMeters
        } เมตร)`
      );
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = mode === "CHECK_IN" ? "/api/employee/check-in" : "/api/employee/check-out";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: gpsCoords.latitude,
          longitude: gpsCoords.longitude,
          accuracy: gpsCoords.accuracy,
          photo: capturedImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการลงเวลา");
      }

      stopCamera();
      onSuccess(data);
      onClose();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาดในการลงเวลา");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isCheckIn = mode === "CHECK_IN";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        // Close if clicking outside the modal box
        if (e.target === e.currentTarget) {
          handleSafeClose();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                isCheckIn ? "bg-teal-500 text-white" : "bg-orange-500 text-white"
              }`}
            >
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isCheckIn ? "ลงเวลาเข้างาน (Check In)" : "ลงเวลาออกงาน (Check Out)"}
              </h3>
              <p className="text-[11px] text-slate-400">ถ่ายภาพยืนยันตัวตนผ่านกล้องสด</p>
            </div>
          </div>
          <button
            onClick={handleSafeClose}
            title="ปิดกล้องและหน้าต่าง"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <VideoOff className="h-3.5 w-3.5 text-rose-400" />
            <span>ปิดกล้อง</span>
          </button>
        </div>

        {/* Target Location & GPS Banner */}
        <div className="px-5 py-2.5 bg-slate-800/80 border-b border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span className="truncate max-w-[200px]">{targetLocation.locationName}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-semibold">
              รัศมี {targetLocation.allowedRadiusMeters} ม.
            </span>
          </div>

          {/* GPS Distance Status */}
          <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-700/60">
            {gpsLoading ? (
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <RefreshCw className="h-3 w-3 animate-spin text-teal-400" />
                กำลังตรวจจับพิกัด GPS...
              </span>
            ) : gpsCoords && distance !== null ? (
              <div className="flex items-center justify-between w-full">
                <span
                  className={`flex items-center gap-1 font-semibold text-[11px] ${
                    isWithinRadius ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isWithinRadius ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  {isWithinRadius
                    ? `อยู่ในพื้นที่ (ห่าง ${formatDistance(distance)})`
                    : `อยู่นอกพื้นที่ (ห่าง ${formatDistance(distance)})`}
                </span>
                <button
                  onClick={requestGPS}
                  className="text-[10px] text-teal-400 hover:underline flex items-center gap-0.5"
                >
                  <RefreshCw className="h-2.5 w-2.5" /> รีเฟรช GPS
                </button>
              </div>
            ) : gpsError ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-rose-400 text-[11px] truncate">{gpsError}</span>
                <button
                  onClick={requestGPS}
                  className="text-[10px] text-teal-400 hover:underline ml-2"
                >
                  ลองใหม่
                </button>
              </div>
            ) : (
              <span className="text-slate-400 text-[11px]">ยังไม่ได้รับตำแหน่ง GPS</span>
            )}
          </div>
        </div>

        {/* Camera / Photo Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] overflow-hidden">
          {capturedImage ? (
            /* Captured Photo Preview */
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured attendance photo"
                className="max-h-[340px] w-full object-contain"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md rounded-xl p-2.5 text-center text-xs text-emerald-400 font-semibold border border-emerald-500/30 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>บันทึกภาพถ่ายแล้ว (กล้องปิดอัตโนมัติ)</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Camera Error UI */
            <div className="p-6 text-center text-slate-300 max-w-xs space-y-3">
              <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto" />
              <p className="text-xs text-rose-300 font-medium">{cameraError}</p>
              <div className="flex gap-2 justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startCamera}
                  className="border-slate-700 text-white hover:bg-slate-800"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> ลองเปิดใหม่อีกครั้ง
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSafeClose}
                  className="text-slate-400 hover:text-white"
                >
                  ปิด
                </Button>
              </div>
            </div>
          ) : (
            /* Live Camera Feed */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Face Guide Oval Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-52 h-64 rounded-[50%] border-2 border-dashed border-teal-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-teal-300 font-semibold bg-slate-900/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                    จัดใบหน้าให้อยู่ในกรอบ
                  </div>
                </div>
              </div>

              {cameraLoading && (
                <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center gap-2 text-xs text-teal-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  กำลังเริ่มต้นกล้อง...
                </div>
              )}
            </div>
          )}

          {/* Hidden Canvas for Frame Grab */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Simulation testing banner for local testing (development only) */}
        {process.env.NODE_ENV === "development" && !isWithinRadius && (
          <div className="px-4 py-2 bg-amber-950/40 border-t border-amber-900/50 flex items-center justify-between text-[11px] text-amber-300">
            <span>ทดสอบระบบ: ใช้พิกัดจำลอง ณ จุดปฏิบัติงาน</span>
            <button
              onClick={useSimulatedTargetGps}
              className="px-2 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 font-bold border border-amber-500/40 transition-colors"
            >
              📍 ใช้พิกัดจุดงานนี้
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
          {!capturedImage ? (
            <div className="space-y-2">
              <Button
                onClick={capturePhoto}
                disabled={cameraLoading || Boolean(cameraError)}
                className={`w-full h-12 text-sm font-bold shadow-lg ${
                  isCheckIn
                    ? "bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/25"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25"
                }`}
              >
                <Camera className="h-5 w-5 mr-1" />
                กดถ่ายภาพ (Capture)
              </Button>
              <Button
                variant="ghost"
                onClick={handleSafeClose}
                className="w-full h-9 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <VideoOff className="h-3.5 w-3.5 mr-1 text-rose-400" />
                ยกเลิกและปิดกล้อง
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  disabled={submitting}
                  className="h-12 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  ถ่ายใหม่
                </Button>
                <Button
                  onClick={handleSubmit}
                  isLoading={submitting}
                  disabled={!isWithinRadius}
                  className={`h-12 text-sm font-bold ${
                    isCheckIn
                      ? "bg-teal-500 hover:bg-teal-600 text-white"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {isCheckIn ? "ยืนยันเข้างาน" : "ยืนยันออกงาน"}
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={handleSafeClose}
                className="w-full h-8 text-xs text-slate-400 hover:text-white"
              >
                ยกเลิก
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
