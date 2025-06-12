import express from 'express';
import {
  iniciarDebate,
  obtenerHistorial,
  respuestaExperto,
  limpiarDebate,
  descargarDebate
} from '../controllers/debate.js';

const router = express.Router();

router.post('/iniciar', iniciarDebate);
router.get('/historial', obtenerHistorial);
router.post('/respuesta/:tipo', respuestaExperto);
router.delete('/limpiar', limpiarDebate);
router.get('/descargar', descargarDebate);

export default router;