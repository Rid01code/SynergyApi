const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Types.ObjectId,
    ref: "userModel",
    required : true
  },
  recipient: {
    type: mongoose.Types.ObjectId,
    ref: "userModel",
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
})

const chatMessageModel = mongoose.model('chatMessageModel', chatSchema)

module.exports = chatMessageModel