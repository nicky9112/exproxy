var express = require('express'),
  bodyParser = require('body-parser'),
  supertest = require('supertest'),

  config = require('./config'),
  proxy = require('../');

describe('proxy()', function () {

  var app = express(),
    router = express.Router(),
    dataServer = express(),
    otherServer = express();

  before(function () {
    dataServer.use(bodyParser.json());
    dataServer.use(bodyParser.urlencoded({extended: true}));
    dataServer.listen(5000);

    dataServer.get('/', function (req, res) {
      return res.json({success: true});
    });
    dataServer.get('/users/:id', function (req, res) {
      return res.json({
        id: req.params.id,
        name: 'xxxxx',
        age: 12
      });
    });
    dataServer.post('/users', function (req, res) {
      return res.json(req.body);
    });

    otherServer.listen(6000);

    otherServer.get('/books/:id', function (req, res) {
      return res.json({
        id: req.params.id,
        isbn: 'xxxx-xxx',
        name: 'xxx-story',
        price: 12
      });
    });

    proxy = proxy(router, {config: config});

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(proxy);
  });

  it('should response success', function (done) {
    supertest(app)
      .get('/')
      .expect(200, done);
  });

  it('should response user info', function (done) {
    supertest(app)
      .get('/users/123')
      .expect({
        id: '123',
        name: 'xxxxx',
        age: 12
      }, done);
  });

  it('should response all body params', function (done) {
    supertest(app)
      .post('/users')
      .send({name: 'Nicky', age: 25})
      .expect({
        name: 'Nicky',
        age: 25
      }, done);
  });

  it('should 404 without routes', function (done) {
    supertest(app)
      .get('/xxx')
      .expect(404, done);
  });

  it('should response book info', function (done) {
    supertest(app)
      .get('/books/12345')
      .expect({
        id: 12345,
        isbn: 'xxxx-xxx',
        name: 'xxx-story',
        price: 12
      }, done);
  });
});
