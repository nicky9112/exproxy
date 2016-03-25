var fs = require('fs'),
  path = require('path'),
  glob = require('glob'),
  request = require('request'),
  pathToRegexp = require('path-to-regexp');

module.exports = function (router, opt) {

  var options = opt || {},
    config = options.config,
    routerArray = [],
    routerPath, files;

  if (!config) {
    throw new Error('in opt params config was required');
  }

  routerPath = path.resolve(config.router_path);

  files = glob.sync(routerPath + '/**/*.json');

  if (!files.length) {
    throw new Error('files in ' + routerPath + ' was empty');
  }

  // concat all router
  files.forEach(function (file) {
    var routerDef = JSON.parse(fs.readFileSync(file));

    if (!Array.isArray(routerDef)) {
      throw new Error(file + ' was not correct');
    }

    routerArray = routerArray.concat(routerDef);
  });

  // loop array build express router
  routerArray.forEach(function (routerItem) {

    var url = routerItem.url,
      toPath = pathToRegexp.compile(routerItem.target),
      host = config.api[routerItem.api],
      method = routerItem.method.toLocaleLowerCase(),
      opt = {
        method: method,
        json: true
      };

    router[method](url, handler);

    // handle request
    function handler(req, res, next) {

      opt.url = host + toPath(req.params);
      opt.qs = req.query;
      opt.body = req.body;

      // forward request
      request(opt, function (err, resp) {
        if (err) {
          return next(err);
        }
        return res.json(resp.body);
      });
    }
  });

  return router;
};
