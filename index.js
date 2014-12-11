/*!
 * assemble-init <https://github.com/assemble/assemble-init>
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
 * Assemble init plugin used to add templates from a source to the template cache.
 *
 * ```js
 * var assemble = require('assemble');
 * var initPlugin = require('assemble-init');
 * ```
 *
 * @name  initPlugin
 * @api public
 */

module.exports = function initPlugin (assemble) {

  /**
   * Create a stream that will initialize files for an assemble pipeline.
   *
   * ```js
   * var init = initPlugin(assemble);
   * gulp.task('build-posts', function () {
   *   gulp.src('*.hbs')
   *     .pipe(init())
   *     .pipe(render())
   *     .pipe(gulp.dest('_gh_pages'));
   * });
   * ```
   *
   * @param  {Object} `options` Additional options to use.
   * @return {Stream} Stream compatible with Assemble pipelines
   * @name  init
   * @api public
   */

  return function init (options) {

    var session = assemble.session;
    var opts = _.extend({}, assemble.options, options);

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
      assemble.create(templateType, { isRenderable: true }, [loader]);
    }
    var plural = assemble.collection[templateType];

    /**
     * Init stream used in a pipeline.
     *
     * @param  {Object} `file` Vinyl File Object from `assemble.src`
     * @param  {Object} `enc` `file.contents` encoding.
     * @param  {Function} `cb` Callback to indicate when the transform function is complete.
     */

    return through.obj(function (file, enc, cb) {

      if (file.isStream()) {
        var err = new gutil.PluginError('assemble-plugin:init', 'Streaming is not supported.');
        this.emit('error', err);
        return cb();
      }

      // Convert vinyl file into an assemble template.
      var template = tutils.toTemplate(file);

      // Add templates to template cache
      assemble[templateType](template);

      // let the stream know we're done
      cb();
    }, function (cb) {
      // push all the templates on the current templateType cache into the stream
      // this lets other plugins do processing on the templates before rendering.
      var stream = this;
      tutils.stream.pushToStream(assemble.views[plural], stream);

      // if the current templatetype is not `page` (e.g. dynamically created)
      // push the pages collection through the stream
      if (templateType !== 'page') {
        tutils.stream.pushToStream(assemble.views.pages, stream);
      }

      cb();
    });
  };
};
