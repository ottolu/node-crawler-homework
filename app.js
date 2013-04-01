/**
 * Module dependencies.
 */

var express = require('express'),
  routes = require('./routes'),
  user = require('./routes/user'),
  http = require('http'),
  path = require('path'),
  Server = require('./src/server.js').Server;

var app = express(),
  server = new Server();

// data obj struct {name, href, picurl, price, sellnum, review, rvurl, from}

var handler = function(data) {
  var str = '';

  for (var i = data.length - 1; i >= 0; i--) {
    str += (dataRow[i]['name'] + '<br/>' + dataRow[i]['href'] + '<br/>' + dataRow[i]['picurl'] +
      '<br/>' + dataRow[i]['price'] + '<br/>' + dataRow[i]['sellnum'] + '<br/>' + dataRow[i]['review'] + '<br/>' + dataRow[i]['rvurl'] + '<br/>' + dataRow[i]['from'] + '<br/><br/>');
  }

  return str;
};

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.compress());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/search', routes.search);
app.get(/^\/result\?keyword=(.*)/, function(req, res) {
  server.search(req.params[0], function(data) {
    res.render('search', {
      title: 'Express Search',
      data: data
    });
  });
});
app.get('/result_test/:kw', function(req, res) {
  console.log(req.params.kw);
  server.search(req.params.kw, 1, function(data) {
    var dataStr = handler(data);
    res.render('search', {
      title: 'Express Result',
      data: dataStr
    });
  });
});
app.get('/result/:kw/:page', function(req, res) {
  console.log(req.params.kw, req.params.page);
  server.search(req.params.kw, req.params.page, function(data) {
    res.json(data);
  });
});
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});