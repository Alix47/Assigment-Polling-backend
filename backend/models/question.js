const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  option: { type: String, required: true },
  isCorrect: { type: Number, required: true }
});
const responseSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  selectedOption: { type: Number, required: true }
});

const questionSchema = new mongoose.Schema({
  question: String,
  options: [optionSchema],
  // timer: { type: Number, default: 30 }, // Timer for each question
  responses: [responseSchema],
});

module.exports = mongoose.model('Question', questionSchema);
