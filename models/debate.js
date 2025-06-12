import mongoose from 'mongoose';

const DebateSchema = new mongoose.Schema({
  participante: {
    type: String,
    required: true,
    enum: ['Marvel', 'DC', 'Moderador']
  },
  mensaje: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['Marvel', 'DC', 'moderador'],
    required: true
  }
}, { timestamps: true });

const Debate = mongoose.model('Debate', DebateSchema);

export default Debate;