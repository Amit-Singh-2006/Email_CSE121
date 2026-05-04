import { Router } from "express";
import multer from "multer";
import * as xlsx from "xlsx";
import { z } from "zod";
import { AIServiceFactory } from "../ai/ai.service";

export const uploadRouter = Router();

// In-memory buffering for files. In production: use direct S3 upload streams.
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Zod schema for validated data
const ValidatedStudentSchema = z.object({
  registrationNumber: z.string().min(3),
  email: z.string().email().optional(),
  cgpa: z.number().min(0).max(10).optional(),
  attendancePercent: z.number().min(0).max(100).optional()
});

uploadRouter.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File required" });

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (rawData.length === 0) return res.status(400).json({ error: "Empty file" });

    const fileHeaders = Object.keys(rawData[0] as object);
    const targetSchema = ["registrationNumber", "email", "cgpa", "attendancePercent"];

    // 1. AI Schema Auto-Mapping
    const aiService = AIServiceFactory.getProvider();
    let mapping = {};
    
    // Attempt AI mapping in non-blocking way, implement fallback if it fails
    // Here we use mock fallback since real API needs auth context in edge cases
    mapping = fileHeaders.reduce((acc: any, header: string) => {
      const h = header.toLowerCase();
      if (h.includes("roll") || h.includes("reg")) acc[header] = "registrationNumber";
      else if (h.includes("mail")) acc[header] = "email";
      else if (h.includes("cgpa") || h.includes("grade")) acc[header] = "cgpa";
      else if (h.includes("att")) acc[header] = "attendancePercent";
      return acc;
    }, {});

    // 2. Data Validation & Transformation Phase
    let validRows = 0;
    let errors: any[] = [];

    const mappedData = rawData.map((row: any, index: number) => {
      const transformed: any = {};
      
      // Apply column mapping 
      Object.keys(row).forEach(key => {
        const mappedKey = mapping[key as keyof typeof mapping];
        if (mappedKey) {
            // Type coercion (string -> number for CGPA/Attendance)
            if (mappedKey === 'cgpa' || mappedKey === 'attendancePercent') {
                transformed[mappedKey] = parseFloat(row[key]);
            } else {
                transformed[mappedKey] = row[key];
            }
        }
      });

      // Zod Validation
      const result = ValidatedStudentSchema.safeParse(transformed);
      if (result.success) {
        validRows++;
        return result.data;
      } else {
        errors.push({ row: index + 2, issues: result.error.errors });
        return null;
      }
    });

    // Output Versioned Upload Batch (Mocking DB save here)
    const mockBatchId = "batch_" + Date.now();

    res.json({
      status: "success",
      batchId: mockBatchId,
      totalRows: rawData.length,
      validRows,
      errorsFound: errors.length,
      sampleErrors: errors.slice(0, 3), // Limit errors payload
      columnMap: Object.keys(mapping).map(k => ({ original: k, mappedTo: mapping[k as keyof typeof mapping] }))
    });

  } catch (err: any) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Ingestion pipeline failure", details: err.message });
  }
});
