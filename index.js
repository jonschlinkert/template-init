'use strict';

var PluginError = require('plugin-error');
var through = require('through2');
var init = function () {
  return require('init-file-loader');
};

module.exports = function (app) {
  return function initPlugin() {
    var id = app.getTask();

    // create a template type for vinyl files and assign a loader
    if (!app.hasOwnProperty(id)) {
      // lazy-load the init-file-loader if it's not already registered
      if (!app.loaders.sync.hasOwnProperty('task')) {
        app.loader('task', init());
      }
      app.create(id, ['task']);
    }

    var stream = through.obj(function (file, enc, cb) {
      if (file.isNull()) {
        this.push(file);
        return cb();
      }
      if (file.isStream()) {
        this.emit('error', new PluginError('init-plugin', 'Streaming is not supported.'));
        return cb();
      }

      // Convert vinyl file to app template and add to collection
      app[id](file);
      cb();
    }, function (cb) {
      app.pushToStream(id, this);
      cb();
    });

    // bind the stream to the session context to ensure
    // context is available inside the stream.
    app.session.bindEmitter(stream);
    return stream;
  };
};
