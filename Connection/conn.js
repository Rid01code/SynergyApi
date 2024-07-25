const mongoose = require('mongoose')
require('dotenv').config()

const mongo_uri = process.env.MONGO_URI
console.log(mongo_uri)

const connection = async () => {
  try {
    await mongoose.connect(mongo_uri, {
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
    });
    console.log('Connection with MongoDB established');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:'+ err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

connection();