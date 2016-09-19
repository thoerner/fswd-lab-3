'use strict';

var express = require('express'),
    app = express();

app.use(express.static('public'));

app.set('views', './views');
app.set('view engine', 'pug');

app.get("/", function(request, response) {
    response.render('index', {
        name: 'world',
        title: 'Hello World'
    });
});

app.get("/random", function(request, response) {
    var randNum = Math.floor(Math.random() * 10) + 1;
    response.render('random', {
        number: randNum,
        title: 'Random Number Generator'
    });
})

app.get('/:name', function(request, response) {
    response.render('name.pug', {
            name: request.params.name,
            title: 'Hello World'
        })
        // response.end('Hello, ' + request.params.name + '!');
});

app.post('/:name', function(request, response) {
    response.end('POSTED: Hello, ' + request.params.name + '!');
})

// allow other modules to use the server
module.exports = app;
