const express = require('express')
const cors = require('cors')
const path = require('path')
const socketIo = require('socket.io')
require('./Connection/conn')
const usersApi = require('./Routes/users')
const postApi = require('./Routes/post')
const chatApi = require('./Routes/chatMessage.js')
require('dotenv').config();

const app = express()
const port = process.env.PORT || 5000

app.use(cors());

app.use('/app/user', usersApi)
app.use('/app/post', postApi)
app.use('/app/chat', chatApi)

app.get('/' , (req, res) => {
  res.send('Hello World!')
})

app.use(express.static(path.join(__dirname, '../front-end/.next')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname , '../front-end/.next' , 'index.html'))
})

const server = app.listen(port,() => {
  console.log(`Listening on port ${port}`)
})

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Replace with your frontend URL
    methods: ["GET", "POST"],
    credentials: true
  }
})

chatApi.initializeSocket(io);