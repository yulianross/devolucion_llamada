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
        socket.emit('connected', 'holaa');
        console.log(`client is connected`);
        socket.on('notifier', (id) => {
            /*
              TokenSchema.findOne({notifierId: id}, (err, elementFound) => {
                console.log(elementFound);
                if (elementFound !== null && elementFound !== undefined) {
                  socket.emit('elementFound', elementFound);
                }
              });
              */
            TokenSchema.find({
                notifierId: id
            }).sort({
                date: 'desc'
            }).exec((err, elements) => {
                if (err) throw err;

                if (elements !== null && elements !== undefined && elements !== [] && elements[0] && elements[0].notifierId) {
                    socket.emit(elements[0].notifierId, elements[0]);
                }
            });
        });
    });

    app.get('/', (req, res) => {
        console.log(`lee el GET`);
    });

    app.get(['/facebook', '/instagram'], (req, res) => {
        if (
            req.param('hub.mode') == 'subscribe' &&
            req.param('hub.verify_token') == config.HUB_VERIFY_TOKEN) {
            res.send(req.param('hub.challenge'));
        } else {
            res.sendStatus(400);
        }
    });

    app.post('/facebook', (req, res) => {
        if (req && req.body && req.body.entry && req.body.entry[0] && req.body.entry[0].id) {
          console.log(req.body.entry[0]);
            TokenSchema.find({
                id: req.body.entry[0].id
            }).sort({
                date: 'desc'
            }).exec((err, elements) => {
                if (err) throw err;
                console.log(elements[0]);
                if (elements !== null && elements !== undefined && elements !== [] && elements[0] && elements[0].notifierId) {
                    const params = {
                        fields: 'country_page_likes'
                    };
                    graph.setAccessToken(elements[0].extendedToken);
                    graph.get(elements[0].id, params, function(err, res) {
                      console.log(res);
                      ioApp.emit(elements[0].notifierId, res.country_page_likes);
                    });
                }
            });
        }
        res.sendStatus(200);
    });

    app.post('/token', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (req.body.token) {
            graph.extendAccessToken({
                "access_token": req.body.token,
                "client_id": config.APP_ID,
                "client_secret": config.APP_SECRET
            }, (err, tokenRes) => {
                if (err) throw err;

                const pageInfo = {
                    page: req.body.page,
                    id: req.body.id,
                    extendedToken: tokenRes.access_token,
                    notifierId: req.body.notifierId
                };

                TokenSchema.findOneAndUpdate({
                    notifierId: req.body.notifierId
                }, pageInfo, {
                    new: true
                }, (err, elementFound) => {
                    console.log(elementFound);
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
