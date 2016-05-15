//=== set up ===

var express        = require('express');
var app            = express();
var http           = require('http');
var path           = require('path');
var route          = require('./routes/routes');
var logger         = require('morgan');
var session        = require('express-session');
var bodyParser     = require('body-parser');
var mongostore     = require('connect-mongo')(session);
var cookieParser   = require('cookie-parser');
var dbSessionConn  = require('./module/dbSessionConn');
var methodOverride = require('method-override');

//=== configuration ===

app.use(express.static(path.join(__dirname, 'public')));    //> static files path
app.set('views', path.join(__dirname, 'public/views')); //> view files path
app.set('view engine', 'ejs');  //> set view engine to ejs
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

//> use session and store in mongodb
app.use(session({
    secret: 'miniERP',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7    //> 7 days
    },
    store: new mongostore({
        mongooseConnection: dbSessionConn
    })
}));

//=== route ===

route(app);

//=== listen ===

//> Get port from environment and store in Express.
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

//> Create HTTP server.
var server = http.createServer(app);

//> Listen on provided port, on all network interfaces.
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

//> Normalize a port into a number, string, or false
function normalizePort(val)
{
    var port = parseInt(val, 10);

    if(isNaN(port))
    {
        // named pipe
        return val;
    }

    if(port >= 0)
    {
        // port number
        return port;
    }

    return false;
}

//> Event listener for HTTP server "error" event.
function onError(error)
{
    if(error.syscall !== 'listen')
    {
        throw error;
    }

    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    //> handle specific listen errors with friendly messages
    switch (error.code)
    {
    case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
    case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
    default:
        throw error;
    }
}

//> Event listener for HTTP server "listening" event
function onListening()
{
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}
