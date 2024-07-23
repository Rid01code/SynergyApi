const express = require('express')
const router = express.Router()
const chatMessageModel = require('../Models/chatMessage')
const authenticateToken = require('../Auth/auth')

router.use(express.json());

let io;

router.initializeSocket = (socketIo) => {
  io = socketIo

  io.on('connection', (socket) => {
    console.log("New Client Connected")

    socket.on('join', (userId) => {
      socket.join(userId)
    });

    socket.on('sendMessage', async ({ senderId, recipientId, message }) => {
      try {
        const newMessage = new chatMessageModel({
          sender: senderId,
          recipient: recipientId,
          message: message
        })
        await newMessage.save()

        io.to(recipientId).emit('newMessage', newMessage);
        io.to(senderId).emit('messageSent', newMessage);
      } catch (error) {
        console.log(error)
      }
    })
  })
}


//Get chat history
router.get('/history/:recipientId', authenticateToken, async (req, res) => {
  try {
    const senderId = req.headers.id;
    const { recipientId } = req.params;

    const messages = await chatMessageModel.find({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId }
      ]
    }).sort('timestamp');

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;