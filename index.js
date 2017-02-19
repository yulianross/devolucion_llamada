'use strict'
/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const bodyParser = require('body-parser');
const express = require('express');
const db = require('./model/db');
const app = express();
const xhub = require('express-x-hub');
const ioApp = require('./router');
let token = null;

app.set('port', (process.env.PORT || 5000));
app.use(xhub({ algorithm: 'sha1', secret: process.env.APP_SECRET }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

db.addMongooseEvents();
db.connectMongoose()
  .then(() => {
    ioApp(app);
    console.log('conectado');
  })
  .catch(() => {
    console.log('error al conectarse a la base de datos');
  });
