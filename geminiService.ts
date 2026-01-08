
import { GoogleGenAI, Type } from "@google/genai";

// Fixed: Initializing with process.env.API_KEY directly as per SDK requirements
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const summarizeCaseTimeline = async (timeline: any[]) => {
  const prompt = `Analiza el siguiente historial de eventos de un expediente judicial y proporciona un resumen ejecutivo estructurado con los hitos más importantes y el estado actual sugerido:
  
  ${JSON.stringify(timeline, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un asistente experto para abogados en España. Tu tono es profesional, conciso y técnico.",
        temperature: 0.2
      }
    });
    // Fixed: Using .text property instead of method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al generar el resumen de la IA.";
  }
};

export const suggestLegalStrategy = async (caseInfo: any) => {
  const prompt = `Basado en la siguiente información de expediente, sugiere posibles pasos a seguir o precauciones legales:
  ${JSON.stringify(caseInfo, null, 2)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres un consultor legal senior. Analiza la situación y ofrece consejos estratégicos basados en el procedimiento judicial español.",
        temperature: 0.5
      }
    });
    // Fixed: Using .text property instead of method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "No se pudo obtener una sugerencia estratégica en este momento.";
  }
};
