var path = require('path'),
  express = require('express'),
  bodyParser = require('body-parser'),
  supertest = require('supertest'),

  exproxy = require('../');

var app = express(),
  router = express.Router(),
  dataServer = express(),
  otherServer = express(),
  config = {
    routePath: path.resolve('./test/router') + '/**.js*',
    apiMap: {
      data: "http://127.0.0.1:5000",
      other: "http://127.0.0.1:6000"
    },
    header: /X-*/,
    mock: true, // enable mock
    mockRoutePath: path.resolve('./test/mock-router') + '/**.js*'
  };

before(function () {
  dataServer.use(bodyParser.json());
  dataServer.use(bodyParser.urlencoded({extended: true}));
  dataServer.listen(5000);

  dataServer.get('/', function (req, res) {
    return res.json({success: true});
  });

  dataServer.get('/me', function (req, res) {

    return res.json({id: 'xxx-xxx-xxx', token: req.get('X-Token')});
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

  dataServer.get('/users/:id/cart', function (req, res) {
    return res.json({
      bookList: [
        {
          isbn: 'xxxx-xxx00',
          name: 'xxx-story-00',
          price: 12
        },
        {
          isbn: 'xxxx-xxx01',
          name: 'xxx-story-01',
          price: 18
        }
      ],
      totalPrice: 30
    });
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
  otherServer.get('/users/:id/order', function (req, res) {
    return res.json({
      id: 'xxx-xxx-xxx',
      username: 'xxxxx',
      price: 30
    });
  });

  app.set('views', __dirname + '/view');
  app.set('view engine', 'ejs');
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(exproxy(router, config));
});

describe('proxy test', function () {

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
      .set('X-Token', 'ajlfjflajfjl')
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

  it('should response cart', function (done) {
    supertest(app)
      .get('/users/123/cart')
      .expect({
        bookList: [
          {
            isbn: 'xxxx-xxx00',
            name: 'xxx-story-00',
            price: 12
          },
          {
            isbn: 'xxxx-xxx01',
            name: 'xxx-story-01',
            price: 18
          }
        ],
        totalPrice: 30
      }, done);
  });

  it('should response order', function (done) {
    supertest(app)
      .get('/users/123/order')
      .expect({
        id: 'xxx-xxx-xxx',
        username: 'xxxxx',
        price: 30
      }, done);
  });
});

describe('mock test', function () {

  it('should response mock data', function (done) {
    supertest(app)
      .get('/users/123/other')
      .expect({
        user: true
      }, done);
  });
});

describe('view test', function () {

  it('should response html', function (done) {
    supertest(app)
      .get('/users/123/page')
      .expect('Content-Type', 'text/html; charset=utf-8', done);
  });
});

describe('custom header test', function () {

  it('should response header what they send', function (done) {
    supertest(app)
      .get('/me')
      .set('X-Token', '123456789')
      .expect({
        id: 'xxx-xxx-xxx',
        token: '123456789'
      }, done);
  });
});
