const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
// const babel = require('gulp-babel');

const compileJS = () => gulp.src('src/**/*.js')
  .pipe(sourcemaps.init())
  // .pipe(babel({
  //   presets: ['@babel/preset-env'],
  //   modules: 'systemjs',
  //   targets: {
  //     esmodules: true,
  //   },
  // }))
  .pipe(uglify())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('build'));

const copyJS = () => gulp.src('build/*').pipe(gulp.dest('www'));

const watchJS = () => gulp.watch(['src/**/*.js'], gulp.series(compileJS, copyJS));

exports.default = gulp.series(compileJS, copyJS);
exports.watch = watchJS;
