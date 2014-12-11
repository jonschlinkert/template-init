'use strict';

var should = require('should');
var through = require('through2');
var assemble = require('assemble');
var gulp = require('gulp');
var render = require('assemble-render')(assemble);
var init = require('../')(assemble);

describe('assemble-init', function () {
  it('should init files from gulp.src', function (done) {
    var stream = gulp.src('test/fixtures/*.hbs')
      .pipe(init());

    stream.on('data', function (file) {
        file.contents.toString().should.eql('test: {{ msg }}');
      })
      .on('error', done)
      .on('end', done);
  });

  it('should init files from gulp.src and assemble.pages', function (done) {
    assemble.pages({
      one: { path: 'one.hbs', content: '---\nmsg: hello one\n---\n1: {{ msg }}' },
      two: { path: 'two.hbs', content: '---\nmsg: hello two\n---\n2: {{ msg }}' },
      three: { path: 'three.hbs', content: '---\nmsg: hello three\n---\n3: {{ msg }}' },
      four: { path: 'four.hbs', content: '---\nmsg: hello four\n---\n4: {{ msg }}' }
    });

    var count = 0;
    gulp.src('test/fixtures/*.hbs')
      .pipe(init())
      .on('data', function (file) {
        count++;
        switch (file.path) {
          case 'one.hbs':
            file.contents.toString().should.eql('1: {{ msg }}');
            break;
          case 'two.hbs':
            file.contents.toString().should.eql('2: {{ msg }}');
            break;
          case 'three.hbs':
            file.contents.toString().should.eql('3: {{ msg }}');
            break;
          case 'four.hbs':
            file.contents.toString().should.eql('4: {{ msg }}');
            break;
        }
      })
      .on('error', done)
      .on('end', function () {
        count.should.eql(5);
        done();
      });
  });
});
