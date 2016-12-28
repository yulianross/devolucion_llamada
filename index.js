/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const xhub = require('express-x-hub');
const io = require('socket.io');

app.set('port', (process.env.PORT || 5000));
//app.listen(app.get('port'));

app.use(xhub({ algorithm: 'sha1', secret: process.env.APP_SECRET }));
app.use(bodyParser.json());

const ioApp = io.listen(app.listen(app.get('port'), () => {
  console.log(`app corriendo en el puerto ${app.get('port')}`);
}));

ioApp.on('connection', (socket) => {
  console.log(`client is connected`);
});

app.get('/', (req, res) => {
  console.log(`cliente conectado`);
  ioApp.emit('evento', 'mensaje del evento');
  res.send('hola');
});

app.get(['/facebook', '/instagram'], (req, res) => {
  if (
    req.param('hub.mode') == 'subscribe' &&
    req.param('hub.verify_token') == 'ddbd71499e5f5b2bab7fa5151744f8ae') {
    res.send(req.param('hub.challenge'));
  } else {
    res.sendStatus(400);
  }
});

app.post('/facebook', (req, res) => {
  console.log('Facebook request body:');

  if (req.isXHub) {
    console.log('request header X-Hub-Signature found, validating');
    if (req.isXHubValid()) {
      console.log('request header X-Hub-Signature validated');
      res.send('Verified!\n');
      console.log(req.body);
      ioApp.emit('success', 'mensaje del evento');
    }
  }
  else {
    console.log('Warning - request header X-Hub-Signature not present or invalid');
    res.send('Failed to verify!\n');

    ioApp.emit('failed', 'ha fallado');
    // recommend sending 401 status in production for non-validated signatures
    // res.sendStatus(401);
  }
  console.log(req.body);

  // Process the Facebook updates here
  res.sendStatus(200);
});

app.post('/instagram', (req, res) => {
  console.log('Instagram request body:');
  console.log(req.body);
  // Process the Instagram updates here
  res.sendStatus(200);
});
