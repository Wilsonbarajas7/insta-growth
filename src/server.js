const http = require('http');
const cors = require('cors');
const express = require('express');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const routes = require('./routes/routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static('./frontend/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);

io.on('connection', (socket) => {
    socket.on('addNewPost', (body) => {
        console.log(body)
        socket.broadcast.emit('addNewPost', body);
    });

    socket.on('postComment', (body) => {
        console.log(body)
        socket.broadcast.emit('postComment', body);
    });

    socket.on('giveLike', (body) => {
        console.log(body)
        socket.broadcast.emit('giveLike', body);
    });

    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});


server.listen(5000, () => {
    console.log('Server runing on http://localhost:5000')
});