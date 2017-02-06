var fs = require('fs'),
  path = require('path'),

  glob = require('glob'),
  request = require('request'),
  pathToRegexp = require('path-to-regexp'),
  _ = require('lodash');

// 1. validate config attribute
// 2. load routePath/routeFiles
// 3. get all router definition from routeFiles
// 4. structure express router by router define
module.exports = function (router, config) {

  if (!config) {

    throw new Error('exproxy config was required');
  }

  var routePath = config.routePath,
    routeFiles = config.routeFiles,
    mockRoutePath = config.mockRoutePath,
    mockRouteFiles = config.mockRouteFiles,
    apiMap = config.apiMap,
    enableMock = config.mock,
    globalHeaeder = config.header,
    timeout = config.timeout || 10000,
    spaceStr = ' ',
    routeDefArray = [], mockRouteDefArray = [], mockRouteDefMap = {};

  if (!routePath && !routeFiles) {

    throw new Error('exproxy config.routePath was required');
  }

  if (!apiMap) {

    throw new Error('exproxy config.apiMap was required');
  }

  if (timeout && timeout <= 1000) {

    throw new Error('exproxy timeout is number of milliseconds');
  }

  // routePath should be an absolute path like /app_dir/**.js or /app_dir/**/**.json
  routeFiles = routeFiles ? routeFiles : glob.sync(routePath);

  if (!routeFiles.length) {

    throw new Error('exproxy router files was not found');
  }

  // enable mock ?
  if (enableMock) {

    if (!mockRoutePath && !mockRouteFiles) {

      throw new Error('exproxy mock enabled but mockRoutePath/mockRouteFiles not found');
    }

    mockRouteFiles = mockRouteFiles ? mockRouteFiles : glob.sync(mockRoutePath);

    mockRouteFiles.forEach(function (mockRouterFile) {

      var mockRouterDef = require(mockRouterFile);

      if (!Array.isArray(mockRouterDef)) {

        throw new Error('router file ' + mockRouterFile + 'was not corrent');
      }

      mockRouteDefArray = mockRouteDefArray.concat(mockRouterDef);
    });

    mockRouteDefArray.forEach(function (mockRouteDef) {

      var url = mockRouteDef.url,
        method = mockRouteDef.method,
        mockData = mockRouteDef.mockData;

      if (!url) {

        throw new Error('exproxy mock route url was required');
      }

      if (!method) {

        throw new Error('exproxy mock route ' + url + ' method was required');
      }

      if (!mockData) {

        throw new Error('exproxy mock route ' + url + ' mockData was required');
      }

      method = method.toLocaleLowerCase();

      mockRouteDefMap[method + spaceStr + url] = mockData;
    });
  }

  // loop router files and concat all router definition
  routeFiles.forEach(function (routerFile) {

    var routerDef = require(routerFile);

    if (!Array.isArray(routerDef)) {

      throw new Error('router file ' + routerFile + 'was not corrent');
    }

    routeDefArray = routeDefArray.concat(routerDef);
  });

  // loop all router definition
  routeDefArray.forEach(function (routerItem) {

    var url = routerItem.url,
      target = routerItem.target,
      targetApi = routerItem.api,
      method = routerItem.method ? routerItem.method.toLowerCase() : 'get',
      view = routerItem.view,

      targetUrl, requestOption;

    if (!url) {

      throw new Error('exproxy router url was required');
    }

    if (view) {

      router[method](url, function (req, res) {

        return res.render(view);
      });

      return;
    }

    if (!target) {

      throw new Error('exproxy router ' + url + ' target was required');
    }

    if (!targetApi) {

      throw new Error('exproxy router ' + url + ' api was required');
    }

    targetUrl = pathToRegexp.compile(routerItem.target);
    targetApi = apiMap[routerItem.api];
    requestOption = {
      method: method,
      json: true
    };

    if (!targetApi) {

      throw new Error('exproxy route ' + url + ' api was unmaped');
    }

    if (enableMock) {

      if (mockRouteDefMap[method + spaceStr + url]) {

        router[method](url, function (req, res) {

          return res.json(mockRouteDefMap[method + spaceStr + url]);
        });
      } else {

        router[method](url, handler);
      }
    } else {

      router[method](url, handler);
    }

    // handle request
    function handler(req, res, next) {

      var rawHeaders = {}, customHeader = {};

      // ['encoding', 'UTF-8', 'k', 'v'] => {encoding: 'UTF-8', k: v}
      _.forEach(req.rawHeaders, function (item, index, headers) {

        if (index % 2 === 0) {

          rawHeaders[item] = headers[index + 1];
        }
      });

      if (globalHeaeder) {

        _.keys(rawHeaders).filter(function (item) {

          return globalHeaeder.test(item);
        }).forEach(function (item) {

          customHeader[item] = rawHeaders[item];
        });
      }

      requestOption.url = targetApi + targetUrl(req.params);
      requestOption.qs = req.query;
      requestOption.body = req.body;
      requestOption.headers = customHeader;
      requestOption.timeout = timeout;

      // forward request
      request(requestOption, function (err, resp) {
        if (err) {
          return next(err);
        }
        return res.json(resp.body);
      });
    }
  });

  return router;
};
