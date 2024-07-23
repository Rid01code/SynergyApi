const { type } = require('express/lib/response')
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name :{
    type: String,
    required: true
  },
  profilePic: {
    type: String,
  },
  bio: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    sparse : true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  posts: {
    type: [mongoose.Types.ObjectId],
    ref: 'PostModel'
  }
})



const userModel = mongoose.model('userModel', userSchema)
module.exports = userModel