import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseGradeCard(base64Data: string, mimeType: string, pageLimit: number = 1) {
  const prompt = `
    You are a high-precision Academic Data Extractor. 
    Analyze the provided document (Tabulation Register or Grade Card).
    
    CRITICAL INSTRUCTION:
    - This document may contain multiple pages. 
    - You MUST process the FIRST ${pageLimit} PAGES of the document.
    - You MUST extract EVERY SINGLE STUDENT record found on these ${pageLimit} pages.
    - Do NOT skip students. Do NOT truncate the list. 
    - If there are 5 students per page, I expect roughly ${5 * pageLimit} entries in the final JSON.

    DATA EXTRACTION RULES:
    1. Student Info: Extract Name, Registration Number (RegNo), Semester, and Examination.
    2. Subjects: For each course, extract Code, Name, Credits, Grade. 
    3. Point Calculation (NEP Standard): 
       - If a 'CG' or 'EGP' (Earned Grade Points) column exists, use that value divided by 'Credits' to find the numeric point.
       - Fallback Grade Scale: O/A+=10, A=9, B+=8, B=7, C+=6, C=5, D/P=4, F=0.
       - Ensure 'points' in the JSON represents the Grade Point (e.g., 9.0), NOT the EGP.
    4. Performance Summary: Extract the printed SGPA, CGPA, Total EGP (Earned Grade Points), and Total Credits.

    If the output is becoming too large, prioritize accuracy for each student.
    Return the data strictly as JSON matching the provided schema.
  `;

  // Using high-performance model for complex multi-page extraction
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { 
      parts: [
        { text: prompt },
        { inlineData: { data: base64Data, mimeType } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isAcademicDocument: { 
            type: Type.BOOLEAN, 
            description: "True if the document is a Tabulation Register or Grade Card, false otherwise." 
          },
          extractionError: { 
            type: Type.STRING, 
            description: "If isAcademicDocument is false, explain why." 
          },
          students: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                studentName: { type: Type.STRING },
                registrationNo: { type: Type.STRING, description: "Extract the unique ID like Reg No, Roll No, etc." },
                semester: { type: Type.STRING },
                examination: { type: Type.STRING },
                subjects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      code: { type: Type.STRING },
                      name: { type: Type.STRING },
                      credits: { type: Type.NUMBER },
                      grade: { type: Type.STRING },
                      points: { type: Type.NUMBER }
                    },
                    required: ["code", "credits", "grade"]
                  }
                },
                summary: {
                  type: Type.OBJECT,
                  properties: {
                    sgpa: { type: Type.NUMBER },
                    cgpa: { type: Type.NUMBER },
                    totalEgp: { type: Type.NUMBER },
                    totalCredits: { type: Type.NUMBER },
                    totalMarks: { type: Type.NUMBER },
                    maxMarks: { type: Type.NUMBER },
                    percentage: { type: Type.NUMBER }
                  }
                }
              },
              required: ["studentName", "subjects", "summary"]
            }
          }
        },
        required: ["isAcademicDocument", "students"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Extraction engine returned empty result.");
  }

  const result = JSON.parse(text);
  
  if (result.isAcademicDocument === false) {
    throw new Error(result.extractionError || "This document does not appear to be a Tabulation Register or Grade Card.");
  }

  return result;
}
