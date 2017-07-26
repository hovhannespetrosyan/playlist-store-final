
'use strict';

const config = {
    port: 8080,
    koaSecret: '',
    google: {
        clientID:"",
        clientSecret:"",
        callbackURL: 'http://localhost:8080/auth/google/callback',
        accessType: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/youtube']
    },
    ilpServer: "ilp.tumo.org",
    database: {
        name: 'db',
        username: '',
        password: '',
        host: 'localhost',
        port: 3307
    }
};

module.exports = config;

