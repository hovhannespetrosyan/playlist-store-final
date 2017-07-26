const server = require('./app/server');
const passport = require('./app/passport');
server.listen('8080');
console.log("server is created and listens on 8080");
console.log(passport);
