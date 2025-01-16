// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const Question = require('./models/question');
const Student = require('./models/student'); // Import the Student model
const config = require('./config/config');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(config.mongodbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Could not connect to MongoDB...', err);
});

// Serve static files (if any)
app.use(express.static('public'));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('register-student', async ({ name }) => {
    console.log(name)
    const student = new Student( {name} );
    try {
      // Register the new student without checking for name uniqueness
      await student.save();
      socket.emit('registration-success', { message: 'Registration successful.' });
      console.log(`Student registered: ${name}`);
    } catch (err) {
      console.error('Error during student registration:', err);
      socket.emit('registration-failed', { message: 'Registration failed due to server error.' });
    }
  });

  // Handle new question from the teacher
  socket.on('new-question', async (questionData) => {
    console.log(questionData)
    const question = new Question(questionData);
    try {
      await question.save();
      io.emit('new-question', question);
    } catch (err) {
      console.error('Error saving question:', err);
      socket.emit('question-error', { message: 'Failed to save the question.' });
    }
  });

  // Handle student response submission
  socket.on('submit-response', async ({ studentId, selectedOption }) => {
    try {
      // Find the current active question
      const currentQuestion = await Question.findOne().sort({ _id: -1 }).exec();
      if (!currentQuestion) {
        socket.emit('response-error', { message: 'No active question found.' });
        return;
      }
      console.log(currentQuestion)
      console.log(currentQuestion.question)
      console.log(currentQuestion.options)
      console.log(currentQuestion.responses)
      // Check if the student has already responded
      const existingResponseIndex = currentQuestion.responses.findIndex(
        (response) => response.studentId === studentId
      );

      if (existingResponseIndex !== -1) {
        // Update existing response
        currentQuestion.responses[existingResponseIndex].selectedOption = selectedOption;
      } else {
        // Add new response
        currentQuestion.responses.push({ studentId, selectedOption });
      }

      // Save the updated question
      await currentQuestion.save();

      // Broadcast updated responses to all clients
      io.emit('update-responses', currentQuestion.responses);
    } catch (err) {
      console.error('Error submitting response:', err);
      socket.emit('response-error', { message: 'Failed to submit response.' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// REST endpoint
app.get('/poll', async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching poll data.');
  }
});

// REST endpoint to get the list of students
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).send('Error fetching students.');
  }
});


// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
