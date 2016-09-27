'use strict';

/******************************
 *                             *
 *          VARIABLEs          *
 *                             *
 ******************************/

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    redis = require('connect-redis'),
    models = require('../models'),
    RedisStore = redis(session);

/******************************
 *                             *
 *       SET functions         *
 *                             *
 ******************************/

app.set('views', './views');
app.set('view engine', 'pug');

/******************************
 *                             *
 *       USE functions         *
 *                             *
 ******************************/

app.use(cookieParser());

app.use(session({
    secret: 'Shhhhh!',
    resave: false,
    saveUninitialized: true,
    store: new RedisStore()
}));

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static('public'));

app.use(function(request, response, next) {
    if (request.session.flash_message) {
        response.locals.flash_message = request.session.flash_message;
        delete request.session.flash_message;
        request.session.save(function() {
            next();
        });
    } else {
        next();
    }
});

app.use(function(request, response, next) {
    if (request.session.user_id) {
        response.locals.user_id = request.session.user_id;
        request.session.save(function() {
            next();
        });
    } else {
        next();
    }
});

/******************************
 *                             *
 *    helper functions         *
 *                             *
 ******************************/

function redirectToTask(response, task) {
    response.redirect('/tasks/' + task.id);
}

/******************************
 *                             *
 *       GET functions         *
 *                             *
 ******************************/

app.get('/', function(request, response) {
    response.render('index');
});

app.get('/tasks', function(request, response) {
    models.Task.findAll()
        .then(function(tasks) {
            response.render('tasks/tasks', {
                tasks: tasks
            });
        });
});

app.get('/tasks/:task_id', function(request, response) {
    console.log(request.session);
    models.Task.findById(request.params.task_id)
        .then(function(task) {
            response.render('tasks/task', {
                task: task
            });
        });
});

app.get('/users/register', function(request, response) {
    response.render('register');
});

app.get('/users/login', function(request, response) {
    response.render('login');
});

app.get('/users/logout', function(request, response) {
    request.session.user_id = '';
    request.session.flash_message = 'You have successfully logged out!';
    response.redirect('/');
});

app.get('/users/:user_id', function(request, response) {
    var user_id = request.params.user_id;
    if (request.session.user_id == user_id) {
        response.render('login_landing', {
            user_id: user_id
        });
    } else {
        response.end('You must be logged in to see this.');
    }
});

/******************************
 *                             *
 *      POST functions         *
 *                             *
 ******************************/

app.post('/tasks', function(request, response) {
    if (request.body.todo) {
        models.Task.create({
                name: request.body.todo
            })
            .then(function(task) {
                request.session.flash_message = '';
                response.redirect('/');
            });
    } else {
        request.session.flash_message = 'ERROR: "Todo" field must not be blank!';
        response.redirect('/');
    };
});

app.post('/tasks/:task_id', function(request, response) {
    models.Task.findById(request.params.task_id)
        .then(function(task) {
            task.name = request.body.todo;
            return task.save();
        }).then(function(task) {
            request.session.flash_message = 'Updated successfully!';
            redirectToTask(response, task);
        });
});

app.post('/users/login', function(request, response) {
    var user_id = request.body.user_id,
        password = request.body.password;
    models.User.findOne({
            where: {
                user_id: user_id,
                password: password
            }
        })
        .then(function(user) {
            if (user == null) {
                request.session.flash_message = 'Oops! Wrong username or password. Try again.';
                response.redirect('/users/login');
            } else {
                request.session.flash_message = '';
                request.session.user_id = user.user_id;
                response.redirect('/users/' + user.user_id);
            }
        });
});

app.post('/users/register', function(request, response) {
    models.User.create({
            user_id: request.body.user_id,
            password: request.body.password
        })
        .then(function(task) {
            request.session.flash_message = 'Successfully registered! Please login now.';
            response.redirect('/users/login');
        });
});

// allow other modules to use the server
module.exports = app;
