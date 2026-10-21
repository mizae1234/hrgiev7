import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// S3 / DigitalOcean Spaces Client Instance
let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (s3ClientInstance) return s3ClientInstance;

  const region = process.env.AWS_REGION || "sgp1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const endpoint = process.env.AWS_S3_ENDPOINT;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY in environment variables"
    );
  }

  s3ClientInstance = new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    // Force path style is false by default for S3 / DO Spaces virtual-hosted buckets
    forcePathStyle: false,
  });

  return s3ClientInstance;
}

/**
 * Returns year and month in YYYYMM format based on Bangkok timezone (e.g. "202610")
 */
export function formatBangkokYearMonth(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value || "2026";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  return `${year}${month}`;
}

/**
 * Returns compact date-time in Bangkok timezone: YYYYMMDD_HHmmss (e.g. "20261019_180104")
 */
export function formatBangkokDateTimeCompact(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  return `${get("year")}${get("month")}${get("day")}_${get("hour")}${get("minute")}${get("second")}`;
}

export interface AttendanceS3KeyOptions {
  /** รหัสพนักงาน (เช่น "EMP001") */
  employeeCode: string;
  /** วันเวลาที่บันทึก (default: เวลาปัจจุบัน) */
  date?: Date;
  /** ประเภทการบันทึก (เช่น "CHECK_IN" หรือ "CHECK_OUT" - ตัวเลือกเสริม) */
  eventType?: "CHECK_IN" | "CHECK_OUT" | string;
  /** ต้องการใส่ประเภท Event ลงในชื่อไฟล์หรือไม่ เช่น EMP001_CHECK_IN_20261019_180104.jpg */
  includeEventType?: boolean;
  /** นามสกุลไฟล์ (default: "jpg") */
  extension?: string;
}

/**
 * โครงสร้างโฟลเดอร์ตามที่กำหนด:
 * HR_GIEV7/timeAttendance/{YYYYMM}/{employeeCode}_{วันเวลาที่บันทึก}.{ext}
 *
 * ตัวอย่าง:
 * - HR_GIEV7/timeAttendance/202610/EMP001_20261019_180104.jpg
 * - HR_GIEV7/timeAttendance/202610/EMP001_CHECK_IN_20261019_180104.jpg (หากเปิด includeEventType)
 */
export function buildAttendancePhotoKey({
  employeeCode,
  date = new Date(),
  eventType,
  includeEventType = false,
  extension = "jpg",
}: AttendanceS3KeyOptions): string {
  const rootFolder = "HR_GIEV7";
  const subFolder = "timeAttendance";
  const yearMonth = formatBangkokYearMonth(date);
  const dateTimeCompact = formatBangkokDateTimeCompact(date);
  const cleanEmployeeCode = employeeCode.replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanExt = extension.replace(/^\./, "");

  let fileName = `${cleanEmployeeCode}_${dateTimeCompact}.${cleanExt}`;
  if (includeEventType && eventType) {
    fileName = `${cleanEmployeeCode}_${eventType}_${dateTimeCompact}.${cleanExt}`;
  }

  return `${rootFolder}/${subFolder}/${yearMonth}/${fileName}`;
}

/**
 * สร้าง Public URL สำหรับเข้าถึงภาพที่อัปโหลด
 */
export function getPublicUrlForS3Key(key: string): string {
  const publicBaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL?.replace(/\/$/, "");
  if (publicBaseUrl) {
    return `${publicBaseUrl}/${key}`;
  }

  const bucket = process.env.AWS_BUCKET_NAME || "space-workflow-dev";
  const region = process.env.AWS_REGION || "sgp1";
  const endpoint = process.env.AWS_S3_ENDPOINT;

  if (endpoint && endpoint.includes("digitaloceanspaces.com")) {
    return `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export interface UploadAttendanceImageOptions {
  employeeCode: string;
  photoBase64: string;
  eventType?: "CHECK_IN" | "CHECK_OUT" | string;
  date?: Date;
  includeEventType?: boolean;
}

export interface UploadResult {
  key: string;
  url: string;
  fileSize: number;
  mimeType: string;
}

/**
 * ฟังก์ชันสำหรับแปลง Base64 Data URL และอัปโหลดขึ้น S3 / DigitalOcean Spaces
 */
export async function uploadAttendanceImage({
  employeeCode,
  photoBase64,
  eventType,
  date = new Date(),
  includeEventType = false,
}: UploadAttendanceImageOptions): Promise<UploadResult> {
  const bucket = process.env.AWS_BUCKET_NAME;
  if (!bucket) {
    throw new Error("Missing AWS_BUCKET_NAME in environment variables");
  }

  // Parse Data URL e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  const matches = photoBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let mimeType = "image/jpeg";
  let base64Data = photoBase64;
  let extension = "jpg";

  if (matches && matches.length === 3) {
    mimeType = matches[1];
    base64Data = matches[2];
    if (mimeType.includes("png")) {
      extension = "png";
    } else if (mimeType.includes("webp")) {
      extension = "webp";
    }
  }

  const buffer = Buffer.from(base64Data, "base64");
  const fileSize = buffer.length;

  const key = buildAttendancePhotoKey({
    employeeCode,
    date,
    eventType,
    includeEventType,
    extension,
  });

  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: "public-read", // อนุญาตให้อ่านภาพผ่าน Public URL ได้
    })
  );

  const url = getPublicUrlForS3Key(key);

  return {
    key,
    url,
    fileSize,
    mimeType,
  };
}
