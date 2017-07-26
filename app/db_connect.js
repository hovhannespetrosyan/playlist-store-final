'use strict';

const Sequelize = require('sequelize');
const config = require('../config/config');

const sequelize = new Sequelize(config.database.name,config.database.username,config.database.password,{
    host:   config.database.host,
    dialect:    'mysql',
    port:    config.database.port,
    pool:   {
        max: 5,
        min: 0,
        idle: 10000
    },
    define: {
        timestamps: false
    }
});
sequelize.authenticate()
.then(() => {console.log("db's response: OK")})
.catch(err => {
    console.error('Unable to connect to the database:',err)
});

module.exports = sequelize;