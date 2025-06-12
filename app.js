import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Configuración de rutas
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Importación de rutas
import connectDB from './database/db.js';
import debateRoutes from './routes/debate.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
connectDB();

// Rutas
app.use('/api/debate', debateRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);

});