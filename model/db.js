'use strict'

const mongoose = require('mongoose');
const config = require('../config.js');
const dbURI = config.DB_URL;

const addMongooseEvents = () => {
  mongoose.connection.on('connected', () => {
    console.log(`Mongoose connected to ${dbURI}`);
  });

  mongoose.connection.on('error', (err) => {
    console.log(`Mongoose connection error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
  });

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log('Mongoose disconnected through app termination');
      process.exit(0);
    });
  });
};

const connectMongoose = () => {
  return new Promise((resolve, reject) => {

    mongoose.connect(dbURI, (err, res) => {
      if (err) {
        throw err;
        reject();
      }
      resolve();
    });
  });
};

module.exports = {
  addMongooseEvents: addMongooseEvents,
  connectMongoose: connectMongoose
};
