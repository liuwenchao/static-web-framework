'use strict';

// Include Gulp & Tools We'll Use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var pagespeed = require('psi');
var reload = browserSync.reload;

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

var paths = {
  scripts: ['src/js/**/*.js', '!src/js/vendor/**/*.js'],
  images: 'src/img/**/*',
  fonts: 'src/font/**',
  configs: ['src/*','!src/*.html'],
  html: 'src/**/*.html'
};

// Lint JavaScript
gulp.task('jshint', function () {
  return gulp.src(paths.scripts)
    .pipe(reload({stream: true, once: true}))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

// Optimize Images
gulp.task('images', function () {
  return gulp.src(paths.images)
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/img'))
    .pipe($.size({title: 'images'}));
});

// Copy All Config Files At The Root Level (src)
gulp.task('configs', function () {
  return gulp.src(paths.configs, {dot: true})
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}));
});

// Copy Web Fonts To Dist
gulp.task('fonts', function () {
  return gulp.src(paths.fonts)
    .pipe(gulp.dest('dist/font'))
    .pipe($.size({title: 'font'}));
});


// Automatically Prefix CSS
gulp.task('styles:css', function () {
  return gulp.src('src/css/**/*.css')
    .pipe($.changed('src/css'))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('src/css'))
    .pipe($.size({title: 'styles:css'}));
});

// Compile Any Sass Files You Added (src/scss)
// gulp.task('styles:scss', function () {
//   return gulp.src(['src/css/**/*.scss'])
//     .pipe($.rubySass({
//       style: 'expanded',
//       precision: 10,
//       loadPath: ['src/css']
//     }))
//     .on('error', console.error.bind(console))
//     .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
//     .pipe(gulp.dest('.tmp/css'))
//     .pipe($.size({title: 'styles:scss'}));
// });

// Output Final CSS Styles
gulp.task('styles', [
  // 'styles:scss', 
  'styles:css'
]);

// Scan Your HTML For Assets & Optimize Them
gulp.task('html', function () {
  return gulp.src('src/**/*.html')
    .pipe($.useref.assets())
    // Concatenate And Minify JavaScript
    .pipe($.if('*.js', $.uglify()))
    // Remove Any Unused CSS
    .pipe($.if('*.css', $.uncss({
      html: [
        'src/index.html'
      ],
      // CSS Selectors for UnCSS to ignore
      ignore: []
    })))
    // Concatenate And Minify Styles
    .pipe($.if('*.css', $.csso()))
    .pipe($.useref.restore())
    .pipe($.useref())
    // Minify Any HTML
    .pipe($.if('*.html', $.minifyHtml()))
    // Output Files
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Clean Output Directory
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Watch Files For Changes & Reload
gulp.task('serve', function () {
  browserSync({
    notify: false,
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: ['.tmp', 'src']
    }
  });

  gulp.watch(['src/**/*.html'], reload);
  // gulp.watch(['src/scss/**/*.scss'], ['styles:scss']);
  gulp.watch(['{.tmp,src}/css/**/*.css'], ['styles:css', reload]);
  gulp.watch(['src/js/**/*.js'], ['jshint']);
  gulp.watch(['src/img/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function () {
  browserSync({
    notify: false,
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: 'dist'
    }
    
  });
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  runSequence('styles', ['jshint', 'html', 'images', 'fonts', 'configs'], cb);
});

// Run PageSpeed Insights
// Update `url` below to the public URL for your site
gulp.task('pagespeed', pagespeed.bind(null, {
  // By default, we use the PageSpeed Insights
  // free (no API key) tier. You can use a Google
  // Developer API key if you have one. See
  // http://goo.gl/RkN0vE for info key: 'YOUR_API_KEY'
  url: 'https://example.com',
  strategy: 'mobile'
}));

// Load custom tasks from the `tasks` directory
try { require('require-dir')('tasks'); } catch (err) {}
