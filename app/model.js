'use strict';
const sq = require('sequelize');
const sqlz = require("./db_connect");

const Users = sqlz.define('users',   {
    id: {  type: sq.INTEGER,primaryKey: true,  autoIncrement:  true },
    googleID:   { type: sq.STRING, unique: true },
    accessToken: sq.TEXT,
    refreshToken:   sq.TEXT,
    photos: sq.TEXT,
    displayName: sq.TEXT,
    pay_username: sq.TEXT,
    pay_password: sq.TEXT
});
const Messages = sqlz.define('messages',{
        id: {  type: sq.INTEGER,primaryKey: true,  autoIncrement:  true },
    sender: sq.TEXT,
    receiver: sq.TEXT,
    message: sq.TEXT,
    status: { type: sq.STRING, defaultValue: "unread"}
});
const Orders = sqlz.define('orders',   {
    id: {  type: sq.INTEGER,  primaryKey: true,  autoIncrement:  true },
    playlistID: sq.TEXT,
    ownerID:   sq.STRING
});

const Sales = sqlz.define('sales',   {
    id: {  type: sq.INTEGER,  primaryKey: true,  autoIncrement:  true },
    playlistID:   { type: sq.STRING,     unique: true },
    googleID: sq.STRING,
    price: sq.FLOAT
});

const Playlists = sqlz.define('playlists', {
  id: {type: sq.INTEGER, primaryKey: true, autoIncrement: true},
  title: sq.TEXT,
  description: sq.TEXT,
  youtubeID: {type: sq.STRING(35), unique: true},
  status: {type: sq.STRING(9), defaultValue: "youtube"},
  videos: sq.TEXT,
  thumbnail: sq.TEXT,
  photos: sq.TEXT,
  userID: sq.STRING(22)
});

const Copies = sqlz.define('copies',{
    id:{type: sq.INTEGER, primaryKey: true, autoIncrement: true},
    playlistID: sq.STRING(35),
    copy_playlistID: sq.STRING(35)
});
Users.sync();
Sales.sync();
Orders.sync();
Playlists.sync();
Messages.sync();
Copies.sync();
module.exports = {Users,Orders,Sales,Playlists,Messages,Copies};


