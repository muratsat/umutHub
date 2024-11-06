const express = require('express');
const http = require('http');
const router = express.Router();
const Discussion = require('../models/discussion.model');
const jwt = require('jsonwebtoken');
const app = express();
const Message = require('../models/message.model');
const School = require('../models/school.model');
const authMiddleware = require('../middlewares/authMiddleware');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server,{
  path: '/socket',
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});
const UserModel = require('../models/user.model');



server.listen(3400, () => {
  console.log('listening on *:3400');
});


// Middleware для аутентификации WebSocket соединений
io.use( async (socket, next) => {
  // Здесь должна быть ваша логика аутентификации
  // Например, проверка токена из query параметров
  const token = socket.handshake.query.token;
  // Проверьте token и установите socket.user
  // Если аутентификация не удалась, вызовите next(new Error('Authentication error'));


  try {
    const decoded = jwt.verify(token, 'secret');
    const user = await UserModel.findById(decoded.userId);

    socket.user = user;  
    next();
  } catch (error) {
    console.error(error);
  }
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

  socket.on('join discussion', async (discussionId) => {
    try {
      socket.join(discussionId);
      
      // Получаем старые сообщения
      const messageList = await Message.find({ discussionId })
        .sort({ createdAt: 1 })
        .lean(); // преобразуем в простой объект

        const messages = await Promise.all(messageList.map(async (message) => {
          var author=await UserModel.findById(message.author);
          var schoolItem=await School.findById(author.schoolId).select('name');
          
          return {
            message: message,
            author: {
              _id: author._id,
              name: author.name,
              imagePath: author.photo.path,
              school : schoolItem.name
            }
          }


      }));
      
      // Отправляем старые сообщения только присоединившемуся пользователю
      socket.emit('load messages', messages);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      socket.emit('error', { message: 'Error loading messages' });
    }
  });

  socket.on('new message', async (data) => {
    const { discussionId, content } = data;
    const newMessage = new Message({
      discussionId,
      content,
      author: socket.user._id
    });
    await newMessage.save();
    console.log('message saved'+ newMessage);
    
    const imagePath = socket.user.photo.path;
    const school = await School.findById(socket.user.schoolId).select('name');
    // Отправьте сообщение всем участникам обсуждения
    io.to(discussionId).emit('new message', {
      message: newMessage,
      author: {
        _id: socket.user._id,
        name: socket.user.name,
        imagePath: imagePath,
        school : school.name
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
    const querySchool = { isActive: true, schoolId : req.user.schoolId };
    const queryGlobal = { isActive: true,  isGlobal: true };

    const discussionsSchool = await Discussion.find(querySchool)
      .sort({ createdAt: -1 })
      .select('title description');

      const discussionsGlobal = await Discussion.find(queryGlobal)
      .sort({ createdAt: -1 })
      .select('title description');
    res.json({
      schoolDiscussions : discussionsSchool,
      globalDiscussions : discussionsGlobal
    });
  } catch (error) {
    res.status(400).json({ message: 'Ошибка при получении обсуждений', error: error.message });
  }
});

module.exports= router;