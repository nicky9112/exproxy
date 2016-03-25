var gulp = require('gulp'),
  mocha = require('gulp-mocha'),
  istanbul = require('gulp-istanbul'),

  testSrc = [
    'test/**/*.js'
  ];

gulp.task('default', ['test'], function () {

  process.exit(0);
});

// mocha test and unit test coverage
gulp.task('test', function (cb) {

  gulp.src('index.js')
    .pipe(istanbul()) // Covering files
    .pipe(istanbul.hookRequire()) // Force `require` to return covered files
    .on('finish', function () {

      gulp.src(testSrc)
        .pipe(mocha({
          reporter: 'spec',
          timeout: 5000
        }))
        .pipe(istanbul.writeReports()) // Creating the reports after tests runned
        .on('end', cb);
    });
});
