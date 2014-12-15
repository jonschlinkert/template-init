/*!
 * template-init <https://github.com/assemble/template-init>
 *
 * Copyright (c) 2014 Brian Woodward, contributors.
 * Licensed under the MIT license.
 */

'use strict';

/**
 * Module dependencies.
 */

var tutils = require('template-utils');
var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var _ = require('lodash');

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

module.exports = function initPlugin (app) {

  /**
   * Create a stream that will initialize files for an app pipeline.
   *
   * ```js
   * var init = initPlugin(app);
   * gulp.task('build-posts', function () {
   *   gulp.src('*.hbs')
   *     .pipe(init())
   *     .pipe(render())
   *     .pipe(gulp.dest('_gh_pages'));
   * });
   * ```
   *
   * @param  {Object} `options` Additional options to use.
   * @return {Stream} Stream compatible with Assemble, Verb, or Gulp pipelines
   * @name  init
   * @api public
   */

  return function init (options) {

    var session = app.session;
    var opts = _.extend({}, app.options, options);

    /**
     * Custom template loader for custom template type.
     * Loader generates a key based on the `template.path` and pushs the object through.
     *
     * @param  {Object} `template` File object to add to the template cache/
     * @param  {Function} `next` Callback function to indicate when the loader is finished.
     */

    var loader = function (template) {
      var key = path.basename(template.path, path.extname(template.path));
      var obj = {};
      obj[key] = template;
      return obj;
    };

    var taskName = session.get('task name');
    var templateType = 'page';

    // create a custom template type based on the task name to keep
    // source templates separate.
    if (taskName) {
      templateType = '__task__' + taskName;
      session.set('template type', templateType);
      app.create(templateType, { isRenderable: true }, [loader]);
    }
    var plural = app.collection[templateType];

    /**
     * Init stream used in a pipeline.
     *
     * @param  {Object} `file` Vinyl File Object from `app.src`
     * @param  {Object} `enc` `file.contents` encoding.
     * @param  {Function} `cb` Callback to indicate when the transform function is complete.
     */

    return through.obj(function (file, enc, cb) {

      if (file.isStream()) {
        var err = new gutil.PluginError('template-plugin:init', 'Streaming is not supported.');
        this.emit('error', err);
        return cb();
      }

      // Convert vinyl file into an app template.
      var template = tutils.toTemplate(file);

      // Add templates to template cache
      app[templateType](template);

      // let the stream know we're done
      cb();
    }, function (cb) {
      // push all the templates on the current templateType cache into the stream
      // this lets other plugins do processing on the templates before rendering.
      tutils.stream.pushToStream(app.views[plural], this);
      cb();
    });
  };
};
