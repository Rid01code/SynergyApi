const mongoose = require('mongoose')
require('dotenv').config()

const mongo_uri = process.env.MONGO_URI

const connection = async () => {
  try {
    const response = await mongoose.connect(mongo_uri)
    if (response) {
      console.log('Connection with MongoDB established')
    }
  } catch (error) {
    console.log(error)
  }
}

connection()