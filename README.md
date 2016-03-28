# exproxy

[![Build Status](https://travis-ci.org/nicky9112/exproxy.svg?branch=master)](https://travis-ci.org/nicky9112/exproxy)

exproxy is designed to be the simplest way possible to make proxy http calls.
It build from express router and just need some config file you will make proxy server.

# Install

```bash
npm i nicky9112@exproxy --save
```

# Usage

### config.js or config.json

```javascript
module.exports = {
  "router_path": "YOUR ROUTER JSON CONFIG FILE PATH", // eg: ./route
  "api": {
    "data": "YOUR TARGET PROXY SERVER", // eg: http://127.0.0.1:3000
    "other": "YOUR ANOTHER PROXY SERVER" // eg: http://host/path
    // ... more proxy server
  }
};
```

### *.json

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
  }
]
```

### app.js

```javascript
var express = require('express'),
    exproxy = require('exproxy'),
    
    config = require('./config'), // see above config.js/.json
    app = express(),
    router = express.Router();

// some other middlewares eg: body-parser ...

app.use(exproxy(router,{config: config}));

app.listen(3000);
```

exproxy will read `router-path` that in your `config.js/json` file, and loop every item in `*.json` to make a router.

now request your `app` server will forward `data` api that you declare in `*.json`.

# Licence

[MIT](LICENSE)
