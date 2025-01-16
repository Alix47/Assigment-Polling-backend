const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  studentId: String,
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  selectedOption: Number,
});

module.exports = mongoose.model('Response', responseSchema);
