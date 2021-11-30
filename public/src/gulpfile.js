var gulp = require('gulp');
var beautify = require('gulp-js-beautify');
var concat = require('gulp-concat');
var rimraf = require('gulp-rimraf');
var watch = require('gulp-watch');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var through = require("through2");

var noop = function () {
    return through.obj();
};

var paths = {
    ui: ['./ui/*.js'],
    bases: ['./vcui.js', './vinylc.site.js'],
    common_ui: ['./helper/*.js', './ui/common/*.js']
};

var tasks = {};

/**
 * ui 모듈 복사
 * @param bUglify 압축화할것인지 여부
 * @return {NodeJS.WritableStream | *}
 */
tasks.copy = function (bUglify) {
    return gulp.src(paths.ui)
        .pipe(beautify())
        .pipe(bUglify ? uglify() : noop())
        .pipe(gulp.dest('../js/ui/'));
};

/**
 * /src/vcui.js -> 코드최적화 & 압축 -> /js/vcui.js 복사
 * @param bUglify 압축화할것인지 여부
 * @return {NodeJS.WritableStream | *}
 */
tasks.corecopy = function (bUglify) {
    return gulp.src('./vcui.js')
        .pipe(beautify())
        //.pipe(bUglify ? uglify() : noop())
        .pipe(uglify())
        .pipe(gulp.dest('../js/'));
};

/**
 * /src/vinylc.site.js -> 코드최적화 & 압축 -> /js/vinylc.site.js 복사
 * @param bUglify 압축화할것인지 여부
 * @return {NodeJS.WritableStream | *}
 */
tasks.commoncopy = function (bUglify) {
    return gulp.src('./vinylc.site.js')
        // .pipe(beautify())
        .pipe(bUglify ? uglify() : noop())
        .pipe(gulp.dest('../js/'));
};

/**
 * /src/ui/*.js + /src/helper/*.js -> 병합 & 코드최적화 & 압축 -> /js/vcui.common-ui.js 복사
 * @param bUglify 압축화할것인지 여부
 * @return {NodeJS.WritableStream | *}
 */
tasks.concat = function (bUglify) {
    return gulp.src(paths.common_ui)
        .pipe(beautify())
        .pipe(bUglify ? uglify() : noop())
        .pipe(concat('vcui.common-ui.js'))
        .pipe(gulp.dest('../js/'));
}

// 기존 결과물 삭제
gulp.task('remove', function () {
    return gulp.src([
        '../js/*.js',
        '../js/ui/*'])
        .pipe(rimraf({force: true}))
});

// 만약 개별 ui모듈의 파일들을 /에 복사하고 싶다면 이 태스크를 사용
gulp.task('copy', function () {
    return tasks.copy(true);
});

gulp.task('_copy', function () {
    return tasks.copy(false);
});

gulp.task('corecopy', function () {
    return tasks.corecopy(true);
});

gulp.task('_corecopy', function () {
    return tasks.corecopy(false);
});

gulp.task('commoncopy', function () {
    return tasks.commoncopy(true);
});

gulp.task('_commoncopy', function () {
    return tasks.commoncopy(false);
});

gulp.task('concat', function () {
    return tasks.concat(true);
});

gulp.task('_concat', function () {
    return tasks.concat(false);
});

// 코드 압축
gulp.task('uglify', function (cb) {
    var gulpSequence = require('gulp-sequence');
    gulpSequence('remove', 'corecopy', 'commoncopy', 'concat', cb);
});

// 기본 처리
gulp.task('default', function (cb) {
    var gulpSequence = require('gulp-sequence');
    gulpSequence('remove', '_corecopy', '_commoncopy', '_concat', cb);
});

// 개발시에 실행해놓으면 (>> gulp watch)
// src아래에 있는 코드가 변경될 때 자동으로 번들처리해서 /js 에 복사해준다.
gulp.task('watch', ['default'], function () {
    gulp.watch(paths.ui, ['_copy']);
    gulp.watch(paths.bases, ['_corecopy', '_commoncopy']);
    gulp.watch(paths.common_ui, ['_concat']);
});
