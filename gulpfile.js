const gulp = require('gulp');
const browsersync = require('browser-sync');
const del = require('del');
const fileinclude = require('gulp-file-include');

const dist = './dist';

function browserSync(done){
    browsersync.init({
        server: {
            baseDir: dist
        },
        port: 8888,
        startPath: "/",
        middleware: function(req, res, next) {
            if (/\.json|\.txt|\.html/.test(req.url) && req.method.toUpperCase() == 'POST') {
                // console.log('[POST => GET] : ' + req.url);
                req.method = 'GET';
            }
            next();
        }
    });
    done();
}

function browserSyncReload(done){
    browsersync.reload();
    done();
}

function clean(){
    return del("./dist/**");
}

function publics(){
    return gulp.src(["public/**", "!public/css/*", "!public/js/**/*"])
    .pipe(fileinclude({
        prefix: '@@',
        basepath: 'public/'
    }))
    .pipe(gulp.dest(dist + "/"));
}

function styles(){
    return gulp.src("public/css/*")
    .pipe(gulp.dest(dist + "/css/"));
}

function script(){
    return gulp.src("public/js/**")
    .pipe(gulp.dest(dist + "/js/"));
}

function watchFiles(){
    gulp.watch(["public/**/*", "!public/css/*", "!public/js/**/*"], gulp.series(publics, browserSyncReload));
    gulp.watch("public/css/*", gulp.series(styles, browserSyncReload));
    gulp.watch("public/js/**/*", gulp.series(script, browserSyncReload));
}

const build = gulp.series(clean, gulp.parallel(publics, styles, script));
const watch = gulp.parallel(watchFiles, browserSync);

exports.build = build;
exports.watch = watch;
exports.default = watch;