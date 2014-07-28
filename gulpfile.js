var fs = require('fs');

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')(); // Load all gulp plugins
                                              // automatically and attach
                                              // them to the `plugins` object
var template = require('lodash').template;

var pkg = require('./package.json');
var dirs = pkg['h5bp-configs'].directories;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

gulp.task('clean', function () {
    return gulp.src(template('<%= dist %>', dirs), {
        read: false // Prevent gulp from reading the content of
                    // the files in order to make this task faster
    }).pipe(plugins.rimraf());
});

gulp.task('copy', [
    'copy:.htaccess',
    'copy:index.html',
    'copy:jquery',
    'copy:main.css',
    'copy:misc',
    'copy:normalize'
]);

gulp.task('copy:.htaccess', function () {
    return gulp.src('node_modules/server-configs-apache/src/.htaccess')
               .pipe(plugins.replace(/# ErrorDocument/g, "ErrorDocument"))
               .pipe(gulp.dest(template('<%= dist %>', dirs)));
});

gulp.task('copy:index.html', function () {
    return gulp.src(template('<%= src %>/index.html', dirs))
               .pipe(plugins.replace(/{{JQUERY_VERSION}}/g, pkg.devDependencies.jquery))
               .pipe(gulp.dest(template('<%= dist %>', dirs)));
});

gulp.task('copy:jquery', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js'])
               .pipe(plugins.rename('jquery-' + pkg.devDependencies.jquery + '.min.js'))
               .pipe(gulp.dest(template('<%= dist %>/js/vendor', dirs)));
});

gulp.task('copy:main.css', function () {

    var banner = '/*! HTML5 Boilerplate v' + pkg.version +
                    ' | ' + pkg.license.type + ' License' +
                    ' | ' + pkg.homepage + ' */\n\n';

    return gulp.src(template('<%= src %>/css/main.css', dirs))
               .pipe(plugins.header(banner))
               .pipe(gulp.dest(template('<%= dist %>/css', dirs)));

});


gulp.task('copy:misc', function () {
    return gulp.src([

        // Copy all files
        template('<%= src %>/**/*', dirs),

        // Exclude the following files
        // (other tasks will handle the copying of these files)
        template('!<%= src %>/css/main.css', dirs),
        template('!<%= src %>/index.html', dirs)

    ], {

        // Include hidden files by default
        dot: true

    }).pipe(gulp.dest(template('<%= dist %>', dirs)));
});

gulp.task('copy:normalize', function () {
    return gulp.src('node_modules/normalize.css/normalize.css')
               .pipe(gulp.dest(template('<%= dist %>/css', dirs)));
});

gulp.task('jshint', function () {
    return gulp.src(template('<%= src %>/js/*.js', dirs))
               .pipe(plugins.jshint())
               .pipe(plugins.jshint.reporter('jshint-stylish'))
               .pipe(plugins.jshint.reporter('fail'));
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

gulp.task('archive', function (done) {

    var archiveName = pkg.name + '_v' + pkg.version + '.zip';
    var archiver = require('archiver')('zip');
    var output = fs.createWriteStream(archiveName);

    output.on('close', done);

    archiver.bulk([{
        cwd: template('<%= dist %>', dirs),
        dot: true,
        expand: true,
        src: ['**']
    }]);

    archiver.pipe(output);
    archiver.finalize();

    archiver.on('error', function (error) {
        done();
        throw error;
    });

});

gulp.task('build', ['clean', 'jshint'], function () {
    gulp.start('copy');
});

gulp.task('default', ['build']);
