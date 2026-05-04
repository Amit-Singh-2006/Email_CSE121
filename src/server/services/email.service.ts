import * as Brevo from "@getbrevo/brevo";

// ============================================================
// BREVO TRANSACTIONAL EMAIL SERVICE
// ============================================================
// Wraps the Brevo SDK for type-safe email dispatching.
// In production: store BREVO_API_KEY in your secrets manager.
// ============================================================

const apiInstance = new Brevo.TransactionalEmailsApi();

apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || ""
);

export interface StudentRecord {
  id: string;
  name: string;
  parentName: string;
  parentEmail: string;
  attendancePercent: number;
  cgpa: number;
  department: string;
}

export interface ReportData {
  semester: number;
  subjects: Array<{ name: string; ca: number; mid: number; end: number }>;
  aiSummary?: string;
  pdfBase64?: string; // Optional PDF attachment (base64-encoded)
}

// ──────────────────────────────────────────────────────────────
// HTML Email Template Generator
// ──────────────────────────────────────────────────────────────
function generateEmailHTML(student: StudentRecord, report: ReportData): string {
  const riskBadge =
    student.attendancePercent < 75
      ? `<span style="background:#ef4444;color:#fff;padding:4px 12px;border-radius:99px;font-size:13px;">⚠ At Risk</span>`
      : `<span style="background:#22c55e;color:#fff;padding:4px 12px;border-radius:99px;font-size:13px;">✓ On Track</span>`;

  const subjectRows = report.subjects
    .map(
      (s) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${s.name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">${s.ca}/30</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">${s.mid}/50</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">${s.end}/100</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;">
          <h1 style="color:#fff;margin:0;font-size:22px;">📊 Academic Progress Report</h1>
          <p style="color:#c4b5fd;margin:8px 0 0;">Semester ${report.semester} | ${student.department}</p>
        </td></tr>
        <!-- Greeting -->
        <tr><td style="padding:32px 40px 0;">
          <p style="color:#374151;font-size:15px;">Dear <strong>${student.parentName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;line-height:1.7;">
            Please find below the academic performance summary for your ward 
            <strong>${student.name}</strong> for Semester ${report.semester}.
          </p>
          <div style="margin:16px 0;">${riskBadge}</div>
        </td></tr>
        <!-- Stats -->
        <tr><td style="padding:20px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#f9fafb;border-radius:8px;padding:20px;text-align:center;width:50%;">
                <div style="font-size:32px;font-weight:700;color:#4f46e5;">${student.cgpa.toFixed(2)}</div>
                <div style="color:#6b7280;font-size:13px;margin-top:4px;">CGPA</div>
              </td>
              <td width="16"></td>
              <td style="background:#f9fafb;border-radius:8px;padding:20px;text-align:center;width:50%;">
                <div style="font-size:32px;font-weight:700;color:${student.attendancePercent < 75 ? "#ef4444" : "#22c55e"};">${student.attendancePercent}%</div>
                <div style="color:#6b7280;font-size:13px;margin-top:4px;">Attendance</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Subject Table -->
        <tr><td style="padding:0 40px;">
          <h3 style="color:#111827;font-size:15px;margin-bottom:12px;">Subject Breakdown</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:12px 14px;text-align:left;font-size:13px;color:#6b7280;font-weight:600;">Subject</th>
                <th style="padding:12px 14px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;">CA</th>
                <th style="padding:12px 14px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;">Mid</th>
                <th style="padding:12px 14px;text-align:center;font-size:13px;color:#6b7280;font-weight:600;">End</th>
              </tr>
            </thead>
            <tbody>${subjectRows}</tbody>
          </table>
        </td></tr>
        <!-- AI Summary -->
        ${
          report.aiSummary
            ? `<tr><td style="padding:24px 40px 0;">
            <div style="background:#ede9fe;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:0 8px 8px 0;">
              <p style="color:#5b21b6;font-size:13px;margin:0;line-height:1.7;"><strong>🤖 AI Advisor Note:</strong><br/>${report.aiSummary}</p>
            </div>
          </td></tr>`
            : ""
        }
        <!-- Footer -->
        <tr><td style="padding:32px 40px;text-align:center;border-top:1px solid #f3f4f6;margin-top:24px;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">This is an automated report generated by your institution's academic platform.</p>
          <p style="color:#9ca3af;font-size:12px;margin:6px 0 0;">Please do not reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────────
// Main Email Sender
// ──────────────────────────────────────────────────────────────
export async function sendParentReport(
  student: StudentRecord,
  report: ReportData
): Promise<{ messageId?: string }> {
  const emailPayload = new Brevo.SendSmtpEmail();

  emailPayload.sender = {
    name: process.env.SENDER_NAME || "Academic Portal",
    email: process.env.SENDER_EMAIL || "reports@yourcollege.com",
  };
  emailPayload.to = [{ email: student.parentEmail, name: student.parentName }];
  emailPayload.subject = `Academic Report — ${student.name} | Semester ${report.semester}`;
  emailPayload.htmlContent = generateEmailHTML(student, report);

  // Attach PDF if available
  if (report.pdfBase64) {
    emailPayload.attachment = [
      {
        content: report.pdfBase64,
        name: `${student.name.replace(/\s+/g, "_")}_Sem${report.semester}_Report.pdf`,
      },
    ];
  }

  const result = await apiInstance.sendTransacEmail(emailPayload);
  console.log(`[Brevo] Email sent to ${student.parentEmail} — ID: ${result.body?.messageId}`);
  return result.body || {};
}
