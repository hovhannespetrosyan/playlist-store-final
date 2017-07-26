const Koa = require('koa');
const server = new Koa();
const config =require('../config/config');
const render = require('koa-ejs');
const router = require('./router');
const passport = require('./passport');
const session = require('koa-session');
const bodyParser = require('koa-bodyparser');
const path = require('path');

server.keys = [config.koaSecret];
render(server, {
    root: path.join(__dirname ,'../view'),
    layout: false,
    viewExt: 'html',
    cache: false,
    debug: true
});

server.use(require('koa-static')('public'));
server.use(session({},server));
server.use(passport.initialize());
server.use(passport.session());
server.use(router.routes());
server.use(router.allowedMethods());
server.use(bodyParser());

module.exports = server;


//console.log("ok");
