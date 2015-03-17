'use strict';

var tutils = require('template-utils');

module.exports = {

  transform: function (app, config, options) {
    var loader = require('base-file-loader');
    var extend = require('extend-shallow');
    var gutil = require('gulp-util');
    var session = app.session;

    var opts = extend({}, app.options, options);

    // create a custom template type based on the task name to keep
    // source templates separate from files added via `.src()`
    config.taskName = session.get(config.name);
    if (config.taskName) {
      config.templateType = config.prefix + config.taskName;
      session.set('template type', config.templateType);
      app.create(config.templateType, { isRenderable: true }, [loader]);
    }

    var templateType = config.templateType;

    return function (file, enc, cb) {
      var self = this;

      if (file.isStream && file.isStream()) {
        var err = new gutil.PluginError('template-init', 'Streaming is not supported.');
        return next(err);
      }

      try {
        // Convert vinyl file to templates and add to cache
        app[templateType](tutils.toTemplate(file), opts);
      } catch (err) {
        self.emit('error', new gutil.PluginError('template-init', err));
        return cb();
      }
      cb();
    };
  },

  flush: function (app, config, options) {
    var plural = app.collection[config.templateType];
    return function (cb) {
      // push all the templates on the current templateType cache into the stream
      // this lets other plugins do processing on the templates before rendering.
      tutils.pushToStream(app.views[plural], this);
      cb();
    };
  }
};
