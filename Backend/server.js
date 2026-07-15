const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseroutes');
const departmentRoutes = require('./routes/departmentRoutes');
const unitRoutes = require('./routes/unitRoutes');
const noteRoutes = require('./routes/notesRoutes');
const catRoutes = require('./routes/catRoutes');
const liveClassRoutes = require('./routes/liveClassRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

connectDB();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/cats', catRoutes);
app.use('/api/liveclass', liveClassRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/', (req, res) => {
  res.send('Educore API is running');
});

// Socket.io signaling logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit('user-joined', socket.id);
  });

  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', { sdp: data.sdp, from: socket.id });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', { sdp: data.sdp, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});