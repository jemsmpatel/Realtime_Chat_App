require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Host and Port Configuration
const PORT = process.env.PORT || 9000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.static(path.resolve('./public')));

let messageHistory = [];

io.on('connection', (socket) => {
    console.log('New user connected', socket.id);

    // Send chat history
    socket.emit('history', messageHistory);

    // Join event
    socket.on('join', ({ name }) => {
        socket.data.name = name;
        console.log(`${name} joined`);
        socket.broadcast.emit('chat message', { name: 'Server', text: `${name} joined the chat`, ts: Date.now() });
    });

    // Chat message
    socket.on('chat message', (msg) => {
        const message = { ...msg, id: socket.id };
        messageHistory.push(message);
        socket.broadcast.emit('chat message', message);
    });

    // Typing indicator
    socket.on('typing', ({ name }) => {
        socket.broadcast.emit('typing', name);
    });

    // Disconnect event
    socket.on('disconnect', () => {
        if (socket.data.name) {
            io.emit('chat message', { name: 'Server', text: `${socket.data.name} left the chat`, ts: Date.now() });
        }
        console.log('User disconnected', socket.id);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.resolve('./public/index.html'));
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running at http://${HOST}:${PORT}  `);
});