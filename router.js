'use strict'

const io = require('socket.io');
const graph = require('fbgraph');
const TokenSchema = require('./model/token-schema');
const config = require('./config');

module.exports = (app) => {

  const ioApp = io.listen(app.listen(app.get('port'), () => {
    console.log(`app corriendo en el puerto ${app.get('port')}`);
  }));

  ioApp.on('connection', (socket) => {
    console.log(`client is connected`);
  });

  app.get('/', (req, res) => {
    console.log(`cliente conectado`);
    ioApp.emit('evento', 'mensaje del evento');
  });

  app.get(['/facebook', '/instagram'], (req, res) => {
    if (
      req.param('hub.mode') == 'subscribe' &&
      req.param('hub.verify_token') == config.HUB_VERIFY_TOKEN) {
      res.send(req.param('hub.challenge'));
      ioApp.emit('success', '/facebook success');
    } else {
      res.sendStatus(400);
      ioApp.emit('failed', '/facebook failed');
    }
  });

  app.post('/facebook', (req, res) => {
    ioApp.emit(req.body.entry[0].id, req.body.entry[0]);
    res.sendStatus(200);
  });

  app.post('/token', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin','*');

    if (req.body.token) {
      graph.extendAccessToken({
        "access_token": req.body.token,
        "client_id": config.APP_ID,
        "client_secret": config.APP_SECRET
      }, (err, tokenRes) => {
          if (err) throw err;

          const pageInfo = {
            page: req.body.page,
            pageId: req.body.id,
            extendedToken: tokenRes.access_token,
            notifierId: req.body.notifierId
          };

          TokenSchema.findOneAndUpdate({ notifierId: req.body.notifierId }, pageInfo, { new: true }, (err, elementFound) => {
            //console.log(elementFound);
            if (elementFound === null) {
                // guardar por primera vez
              const tokenSchema = new TokenSchema(pageInfo);

              tokenSchema.save((err, pageStored) => {
              console.log('page stored');
              })
            }
          });
        });
        res.status(200).send();
    } else {
     res.status(400).send();
   }
  });

  app.post('/instagram', (req, res) => {
    console.log('Instagram request body:');
    console.log(req.body);
    // Process the Instagram updates here
    res.sendStatus(200);
  });
};
