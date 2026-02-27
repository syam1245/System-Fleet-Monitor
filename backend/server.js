require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

// Configure io on app so routes can access it
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Frontend client connected via WebSocket:', socket.id);
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const telemetryRoutes = require('./routes/telemetry');
const deviceRoutes = require('./routes/devices');

app.use('/api/telemetry', telemetryRoutes);
app.use('/api/devices', deviceRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        // Start server
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
    });
