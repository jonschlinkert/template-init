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
  var tutils = require('template-utils');
  var extend = require('extend-shallow');
  var through = require('through2');
  var gutil = require('gulp-util');

  config = extend({prefix: '__task__', name: 'task name', templateType: 'page'});

  return function init (options) {
    var opts = extend({}, app.options, options);
    var methods = opts['router methods'] || [];
    if (!methods.length) {
      methods.push('onInit');
    }

    // get the correct middleware to use
    var middleware =  opts.onInit || require('./lib/middleware')(app, config, options);
    var plural = app.collection[config.templateType];

    var stream = through.obj(function (file, enc, cb) {
      var self = this;

      // assign middleware for this file
      setMiddleware(file.path, middleware, methods);

      // handle middleware for this file
      app.handle('onInit', file, function (err) {
        if (err) {
          self.emit('error', new gutil.PluginError('template-init', err));
          return cb();
        }
        cb();
      });

    }, function (cb) {
      // push all the templates on the current templateType cache into the stream
      // this lets other plugins do processing on the templates before rendering.
      tutils.pushToStream(app.views[plural], this);
      cb();
    });

    // bind the stream to the session context to ensure
    // context is available inside the stream.
    app.session.bindEmitter(stream);
    return stream;
  };

  // setup a middleware call for this file if `onInit` exists
  function setMiddleware (path, fn, methods) {
    var router = app.constructor.super_.Router({
      methods: methods
    });
    if (router.onInit) {
      router.onInit(path, fn);
      app.use(router);
    }
  }

};
