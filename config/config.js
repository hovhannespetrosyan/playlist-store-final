
'use strict';

const config = {
    port: 8080,
    koaSecret: '123',
    google: {
        clientID:"850597829111-llamlkelg2bovp9oged3n7smnt4or9ei.apps.googleusercontent.com",
        clientSecret:"8_g9Drx_xA7pPS4Y6x_z9HvY",
        callbackURL: 'http://localhost:8080/auth/google/callback',
        accessType: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/youtube']
    },
    ilpServer: "ilp.tumo.org",
    database: {
        name: 'db',
        username: 'root',
        password: 'usbw',
        host: 'localhost',
        port: 3307
    }
};

module.exports = config;

