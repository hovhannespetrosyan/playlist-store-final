'use strict';
const passport = require('koa-passport');
const Strategy = require('passport-google-oauth20').Strategy;
const config = require('../config/config');

const strategyConfig = {
    clientID:   config.google.clientID,
    clientSecret:   config.google.clientSecret,
    callbackURL:    config.google.callbackURL
};

passport.use(new Strategy(strategyConfig,function (accessToken,refreshToken,profile,done)
{
    const user = {
        name:   profile.name,
        displayName: profile.displayName,
        id: profile.id,
        photos: profile.photos,
        accessToken: accessToken,
        refreshToken:   refreshToken
    };
    return done(null,user);
}));
passport.serializeUser(function (user,done){
    done(null,user);
});
passport.deserializeUser(function (user,done){
    done(null,user);
});
module.exports = passport;