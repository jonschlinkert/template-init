'use strict';

module.exports = function (app, config, options) {
  var loader = require('base-file-loader');
  var extend = require('extend-shallow');
  var tutils = require('template-utils');

  var opts = extend({}, app.options, options);
  var session = app.session;

  // create a custom template type based on the task name to keep
  // source templates separate from files added via `.src()`
  config.taskName = session.get(config.name);
  if (config.taskName) {
    config.templateType = config.prefix + config.taskName;
    session.set('template type', config.templateType);
    app.create(config.templateType, { isRenderable: true }, [loader]);
  }

  var templateType = config.templateType;
  return function (file, next) {
    if (file.isStream && file.isStream()) {
      var err = new gutil.PluginError('template-init', 'Streaming is not supported.');
      return next(err);
    }
    // Convert vinyl file to templates and add to cache
    app[templateType](tutils.toTemplate(file), opts);
    next();
  };
};
