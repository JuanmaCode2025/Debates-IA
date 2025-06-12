import Debate from '../models/debate.js';
import { generarRespuestaDebate } from '../services/gemini.js';

const EXPERTOS = {
  Marvel: {
    nombre: "Marvel",
    instruccion: `Eres un experto en Marvel. Defiende por qué Marvel es mejor que DC. Sé técnico pero accesible. Responde en español en menos de 100 palabras.`
  },
  DC: {
    nombre: "DC",
    instruccion: `Eres un experto en DC. Defiende por qué DC es mejor que Marvel. Sé técnico pero accesible. Responde en español en menos de 100 palabras.`
  }
};

export const iniciarDebate = async (req, res) => {
  const { tema } = req.body;

  if (!tema) {
    return res.status(400).json({ 
      exito: false,
      mensaje: 'Debes proporcionar un tema válido' 
    });
  }

  try {
    // Limpiar debates anteriores
    await Debate.deleteMany({});
    
    const nuevoMensaje = await Debate.create({
      participante: 'Moderador',
      mensaje: `Tema del debate: ${tema}`,
      rol: 'moderador'
    });

    res.status(201).json({ 
      exito: true,
      mensaje: 'Debate iniciado correctamente',
      datos: nuevoMensaje 
    });
  } catch (error) {
    console.error('Error en iniciarDebate:', error);
    res.status(500).json({ 
      exito: false,
      mensaje: 'Error en el servidor al iniciar debate',
      error: error.message 
    });
  }
};

export const obtenerHistorial = async (req, res) => {
  try {
    const historial = await Debate.find().sort({ createdAt: 1 });
    res.status(200).json({
      exito: true,
      datos: historial
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: "Error al obtener historial",
      error: error.message
    });
  }
};

export const respuestaExperto = async (req, res) => {
  const { tipo } = req.params;
  const experto = EXPERTOS[tipo];
  
  if (!experto) {
    return res.status(400).json({
      exito: false,
      mensaje: "Tipo de experto no válido"
    });
  }

  try {
    const historial = await Debate.find().sort({ createdAt: 1 });
    
    if (!historial || historial.length === 0) {
      return res.status(400).json({
        exito: false,
        mensaje: "No hay debate iniciado. Primero establece un tema."
      });
    }
    
    const contexto = historial.map(m => `${m.participante}: ${m.mensaje}`).join('\n');
    const respuestaGenerada = await generarRespuestaDebate(experto.instruccion, contexto);
    
    if (!respuestaGenerada) {
      throw new Error("No se pudo generar una respuesta");
    }
    
    const nuevoMensaje = await Debate.create({
      participante: experto.nombre,
      mensaje: respuestaGenerada,
      rol: tipo
    });

    res.status(201).json({
      exito: true,
      datos: nuevoMensaje
    });
  } catch (error) {
    console.error('Error al generar respuesta:', error);
    res.status(500).json({
      exito: false,
      mensaje: error.message,
      error: error.message
    });
  }
};

export const limpiarDebate = async (req, res) => {
  try {
    const result = await Debate.deleteMany({});
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No había debates para limpiar'
      });
    }
    
    res.json({
      exito: true,
      mensaje: `Se eliminaron ${result.deletedCount} mensajes del debate`
    });
  } catch (error) {
    console.error('Error al limpiar historial:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al limpiar historial',
      error: error.message
    });
  }
};

export const descargarDebate = async (req, res) => {
  try {
    const historial = await Debate.find().sort({ createdAt: 1 });
    
    if (!historial || historial.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No hay mensajes en el debate para generar PDF'
      });
    }

    const PDFDocument = (await import('pdfkit')).default;
    const documento = new PDFDocument();
    const fecha = new Date();
    const nombreArchivo = `debate_${fecha.toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    
    documento.pipe(res);

    documento
      .fillColor('#333333')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Historial del Debate', { align: 'center' })
      .moveDown(0.5);

    documento
      .fontSize(10)
      .font('Helvetica')
      .text(`Generado el: ${fecha.toLocaleString()}`, { align: 'center' })
      .moveDown(1.5);

    const temaDebate = historial.find(m => m.rol === 'moderador')?.mensaje || 'Tema no especificado';
    
    documento
      .fontSize(14)
      .fillColor('#2c3e50')
      .text(temaDebate, { align: 'center', underline: true })
      .moveDown(1);

    historial.forEach((mensaje, indice) => {
      if (mensaje.rol !== 'moderador') {
        const color = mensaje.rol === 'Marvel' ? '#e53935' : '#1e88e5';
        const icono = mensaje.rol === 'Marvel' ? '♦ ' : '♢ ';
        
        documento
          .fontSize(12)
          .fillColor(color)
          .text(icono + mensaje.participante + ':', { continued: true })
          .fillColor('#333333')
          .text(` ${mensaje.mensaje}`);
        
        documento
          .fontSize(8)
          .fillColor('#7f8c8d')
          .text(`→ ${new Date(mensaje.createdAt).toLocaleString()}`)
          .moveDown(0.5);
      }

      if (indice < historial.length - 1) {
        documento
          .moveTo(50, documento.y)
          .lineTo(550, documento.y)
          .lineWidth(0.5)
          .strokeColor('#ecf0f1')
          .stroke()
          .moveDown(0.5);
      }
    });

    documento
      .fontSize(8)
      .fillColor('#7f8c8d')
      .text('Debate generado automáticamente con Gemini AI', { 
        align: 'center',
        width: 500
      });

    documento.end();
  } catch (error) {
    console.error('Error al generar PDF:', error);
    
    if (res.headersSent) {
      return res.end();
    }
    
    res.status(500).json({
      exito: false,
      mensaje: 'Error al generar el PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};