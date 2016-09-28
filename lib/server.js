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
    // puts the session flash message in a local variable
    // then deletes the session flash message
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
    // puts the session user id in a local variable
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
    // Render index.pug - Todo adder
    response.render('index', {title: 'Hello world!'});
});

app.get('/tasks', function(request, response) {
    // Render tasks/tasks.pug - Task List, and populate
    // with all tasks in the Task model
    models.Task.findAll()
        .then(function(tasks) {
            response.render('tasks/tasks', {
                tasks: tasks,
                title: 'Tasks'
            });
        });
});
locals.('tasks/task', {
                task: task,
                title: 'Task: ' + request.params.task_id
            });
        });
});

app.get('/users/register', function(request, response) {
    // Render register.pug - User registration page
    response.render('register', {title: 'Register'});
});

app.get('/users/login', function(request, response) {
    // Render login.pug - User login page
    response.render('login', {title: 'Login'});
});

app.get('/users/logout', function(request, response) {
    // Logout User and redirect to /
    request.session.user_id = null;
    request.session.flash_message = 'You have successfully logged out!';
    response.redirect('/');
});

app.get('/users/:user_id', function(request, response) {
    // Renders login_landing.pug - User landing page
    // This page is only visible to the user if they are logged in
    var user_id = request.params.user_id;
    if (request.session.user_id == user_id) {
        response.render('login_landing', {
            user_id: user_id,
            title: user_id + '\'s Home'
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
    // Creates a new task in the Task model
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
    // Update task by by task_id
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
    // Logs User in if user_id & password match in db
    var user_id = request.body.user_id.trim(),
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
    // Registers User in db if not already registered
    var user_id = request.body.user_id.trim(),
        password = request.body.password;
    models.User.findOne({
        where: {
            user_id: user_id
        }
    })
    .then(function(user) {
        console.log(user);
        if (user == null) {
            models.User.create({
                user_id: user_id,
                password: password
            })
            .then(function(task) {
                request.session.flash_message = 'Successfully registered! Please login now.';
                response.redirect('/users/login');
            });
        } else {
            request.session.flash_message = 'Username already exists.';
            response.redirect('/users/register');
        };
    });
});

// allow other modules to use the server
module.exports = app;
