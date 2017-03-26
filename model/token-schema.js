'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tokenSchema = Schema({
  extendedToken: String,
  page: String,
  notifierId: String,
  id: String
});

module.exports = mongoose.model('tokenSchema', tokenSchema);
