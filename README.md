# exproxy

[![Build Status](https://travis-ci.org/nicky9112/exproxy.svg?branch=master)](https://travis-ci.org/nicky9112/exproxy)[![Coverage Status](https://coveralls.io/repos/github/nicky9112/exproxy/badge.svg?branch=master)](https://coveralls.io/github/nicky9112/exproxy?branch=master)

exproxy is designed to be the simplest way possible to make proxy http calls.
It build from express router and just need some config file you will make proxy server.

## Install

### yarn

```bash
yarn add @nicky9112/exproxy
```

### npm

```bash
npm i @nicky9112/exproxy --save
```

## Usage

### app.js

```javascript
var express = require('express'),
    exproxy = require('@nicky9112/exproxy'),
    
    app = express(),
    router = express.Router(),
    config = {
		// eg: path.resolve('./proxy-router') + '/**.json'
		routePath: '$YOUR_ROUTER_PATH/**.js*', 
		// or
		routeFiles: [
			'/$YOUR_ROUTER_PATH/xx.js',
			'/$YOUR_ROUTER_PATH/xxx.json'
		],
		mock: true, // enable mock if true mockRouterPath parameter is require
		// eg: path.resolve('./proxy-router-mock') + '/**.json'
		mockRoutePath: '$YOUR_MOCK_ROUTER_PATH/**.js*',
		apiMap: { // required
      		data: 'http://127.0.0.1:5000',
      		other: 'http://127.0.0.1:6000'
    	}
	};

// some other middlewares eg: body-parser ...

app.use(exproxy(router, config));

app.listen(3000);
```

### proxy router *.json or *.js

```json
[
  {
    "url": "/users/:id",
    "target": "/users/:id",
    "api": "data",
    "method": "GET",
    "desc": "user detail"
  },
  {
    "url": "/users",
    "target": "/users",
    "api": "data",
    "method": "POST",
    "desc": "add user"
  },
  {
    "url": "/users/:id/other",
    "target": "/users/:id/other",
    "api": "data",
    "method": "GET",
    "desc": "user detail"
  }
]
```

### mock proxy router *.js or *.json

```javascript
module.exports = [
  {
    url: '/users/:id/other', // should mapping proxy route url
    method: 'GET',
    mockData: { // everything you like
      user: true
    }
  }
];
```

exproxy will read `routePath` or `routeFiles` and concat each item to make a express route.

now request your `app` server will forward `data` api that you declare in `*.js*`.

## Licence

[MIT](LICENSE)
