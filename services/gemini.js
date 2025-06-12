import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Configuración mejorada para la API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ Advertencia: No se encontró GEMINI_API_KEY en .env');
  console.warn('El sistema usará respuestas simuladas');
}else{
   genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

export const generarRespuestaDebate = async (instruccion, historialDebate) => {

  try {
    // Configuración actualizada para la API
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
       generationConfig: {
        temperature: 0.7,
        topP: 0.9
      }
    });

    const prompt = `
${instruccion}

Contexto actual del debate:
${historialDebate}
Eres un experto en debates sobre superhéroes. Tu tarea es responder a los mensajes de los participantes de manera clara y persuasiva, manteniendo el enfoque filosófico o científico del personaje que representas. No repitas el contexto, responde directamente al tema en discusión.
Instrucciones:
- Proporciona una respuesta bien argumentada en español
- Responde directamente al tema en discusión sin repetir el contexto
- Utiliza un lenguaje accesible sin simplificar en exceso
- Limita tu respuesta a un máximo de 50 palabras
-enfatiza como un fanático de los superhéroes
-usa emojis para hacer la conversación más amena
-de nombres de superheores para explicar el tema



`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
   console.error('Error con Gemini API:', {
      message: error.message,
      status: error.status,
      stack: error.stack
    });
    throw new Error('Error al generar la respuesta del debate');
  }
};
