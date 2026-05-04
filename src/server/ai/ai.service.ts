import { GoogleGenAI } from "@google/genai";

// ---------------------------------------------------------
// MODEL AGNOSTIC AI STRATEGY PATTERN
// ---------------------------------------------------------

export interface AIProvider {
  generateStudentInsight(academicData: any): Promise<string>;
  mapDataHeaders(fileHeaders: string[], targetSchema: string[]): Promise<any>;
}

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async generateStudentInsight(academicData: any): Promise<string> {
    const prompt = `
      You are an academic advisor AI for an educational institution.
      Analyze this student's data and provide:
      1. A 2-sentence summary of performance.
      2. Identified risks (attendance/grades).
      3. 2 actionable recommendations for the parent.
      Data: ${JSON.stringify(academicData)}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return response.text || "Insight generation failed.";
    } catch (e) {
      console.error("Gemini failed, falling back to basic rules...", e);
      return this.fallbackRules(academicData);
    }
  }

  async mapDataHeaders(fileHeaders: string[], targetSchema: string[]): Promise<any> {
    const prompt = `
      Map the following user-uploaded CSV headers to our system schema.
      User Headers: ${fileHeaders.join(", ")}
      System Schema: ${targetSchema.join(", ")}
      Return ONLY a JSON object mapping. Example: {"UploadHeader": "system_schema_field"}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      // Parse JSON from text block
      const rawText = response.text || "{}";
      const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "");
      return JSON.parse(cleaned);
    } catch (e) {
      return {}; // Fallback mapping handled in controller
    }
  }

  private fallbackRules(data: any): string {
    if (data.attendance < 75) return "Warning: Attendance is below 75%. Immediate attention required.";
    return "Student is performing adequately on track.";
  }
}

// Factory to swap providers (e.g., adding ClaudeProvider, OpenAIProvider later)
export class AIServiceFactory {
  static getProvider(): AIProvider {
    // Can map to process.env.AI_PROVIDER to dynamically switch
    return new GeminiProvider();
  }
}
