const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const router = express.Router();
const Discussion = require('../models/discussion.model');
const Message = require('../models/message.model');
const authMiddleware = require('../middlewares/authMiddleware');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware для аутентификации WebSocket соединений
io.use((socket, next) => {
  // Здесь должна быть ваша логика аутентификации
  // Например, проверка токена из query параметров
  const token = socket.handshake.query.token;
  // Проверьте token и установите socket.user
  // Если аутентификация не удалась, вызовите next(new Error('Authentication error'));
  next();
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join discussion', async (discussionId) => {
    socket.join(discussionId);
    // Добавьте пользователя к участникам обсуждения в базе данных
    await Discussion.findByIdAndUpdate(discussionId, {
      $addToSet: { participants: socket.user._id }
    });
  });

  socket.on('leave discussion', async (discussionId) => {
    socket.leave(discussionId);
    // Удалите пользователя из участников обсуждения в базе данных
    await Discussion.findByIdAndUpdate(discussionId, {
      $pull: { participants: socket.user._id }
    });
  });

  socket.on('new message', async (data) => {
    const { discussionId, content } = data;
    const newMessage = new Message({
      discussionId,
      content,
      author: socket.user._id
    });
    await newMessage.save();
    
    // Отправьте сообщение всем участникам обсуждения
    io.to(discussionId).emit('new message', {
      message: newMessage,
      author: {
        _id: socket.user._id,
        name: socket.user.name
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Создание нового обсуждения (только для админа)
router.post('/createDiscussion', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { title, description, isGlobal, schoolId } = req.body;
    const discussion = new Discussion({
      title,
      description,
      isGlobal,
      schoolId: isGlobal ? null : schoolId,
      createdBy: req.user._id
    });
    await discussion.save();
    res.status(201).json(discussion);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при создании обсуждения', error: error.message });
  }
});

// Получение списка обсуждений
router.get('/list', authMiddleware.auth, async (req, res) => {
  try {
    const { schoolId } = req.body;
    const query = { isActive: true };
    if (schoolId) {
      query.$or = [{ isGlobal: true }, { schoolId: schoolId }];
    } else {
      query.isGlobal = true;
    }
    const discussions = await Discussion.find(query)
      .sort({ createdAt: -1 })
      .populate('title',"description");
    res.json(discussions);
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при получении обсуждений', error: error.message });
  }
});

module.exports= router;