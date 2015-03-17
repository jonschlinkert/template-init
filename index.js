/*!
 * template-init <https://github.com/assemble/template-init>
 *
 * Copyright (c) 2014 Brian Woodward, contributors.
 * Licensed under the MIT license.
 */

'use strict';

/**
 * Template init plugin used to add templates from a source to the template cache.
 *
 * ```js
 * var app = require('assemble');
 * var initPlugin = require('template-init');
 * ```
 *
 * @name  initPlugin
 * @api public
 */

module.exports = function initPlugin (app, config) {
  var middleware = require('./lib/middleware');
  var extend = require('extend-shallow');
  var through = require('through2');

  config = extend({
    prefix: '__task__',
    name: 'task name',
    templateType: 'page'
  });

  return function init (options) {
    var opts = extend({}, app.options, options);

    var stream = null;
    var onInit = opts.onInit;
    var postInit = opts.postInit;
    var transform = function () {
      return middleware.transform.apply(middleware, arguments);
    };

    var flush = function () {
      return middleware.flush.apply(middleware, arguments);
    };

    if (typeof onInit === 'boolean') {
      // init is turned off, so break out
      if (!onInit) {
        stream = through.obj();
        app.session.bindEmitter(stream);
        return stream;
      }
    } else if (typeof onInit === 'function') {
      transform = onInit;
    } else {
      // figure out if `onInit` is a route and
      // has any handlers
      if (app.onInit) {
        console.log('has onInit', app.onInit);
      }
    }

    // postInit is the flush function
    if (typeof postInit === 'boolean') {
      if (!postInit) {
        flush = require('./lib/flush-noop');
      }
    } else if (typeof postInit === 'function') {
      flush = postInit;
    } else {
      // figure out if `postInit` is a route and
      // has any handlers
      if (app.postInit) {
        console.log('has postInit', app.postInit);
      }
    }

    var stream = through.obj(transform(app, config, options), flush(app, config, options));

    // bind the stream to the session context to ensure
    // context is available inside the stream.
    app.session.bindEmitter(stream);
    return stream;
  };
};
