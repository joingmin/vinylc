/*!
 * @module vcui.helper.InviewScroll
 * @license MIT License
 * @description InviewScroll 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/inviewScroll', ['jquery', 'vcui'], function ($, core) {
    "use strict";

    var getRect = core.dom.getRect;

    var Watcher = core.BaseClass.extend({
        initialize: function initialize(elements, options) {
            var self = this;
            var opt;

            self.elements = elements;
            self.options = opt = core.extend(true, {
                allowInScroll: false,
                delay: 200,
                offset: { top: 0, left: 0, right: 0, bottom: 0 },
                threshold: 0 // 0, 0.5, 1
            }, options);

            self.handlers = { enter: [], move: [], leave: [] };
            self.singles = { enter: [], move: [], leave: [] };

            if (opt.throttle !== false) {
                if (opt.delay && !opt.throttle) {
                    self.check = core.delayRun(self.check, opt.delay, self);
                } else if (!opt.delay && opt.throttle) {
                    self.check = core.throttle(self.check, opt.throttle, self);
                }
            }

            self._bindEvents();
        },
        _bindEvents: function _bindEvents() {
            var self = this;
            var opt = self.options;

            if (opt.on) {
                core.each(opt.on, function (handler, name) {
                    self.on(name, handler);
                });
            }

            if (opt.once) {
                core.each(opt.once, function (handler, name) {
                    self.once(name, handler);
                });
            }
        },
        clear: function clear() {
            this.handlers.enter = this.handlers.move = this.handlers.leave = [];
            this.singles.enter = this.handlers.move = this.singles.leave = [];
        },
        on: function on(name, handler) {
            var self = this;

            self.handlers[name].push(handler);

            return self;
        },
        once: function once(name, handler) {
            var self = this;

            self.singles[name].push(handler);

            return self;
        },
        emit: function emit(name, el, top) {
            var self = this,
                args = [].slice.call(arguments, 1);

            self.handlers[name].forEach(function (handler) {
                handler.apply(self, args);
            });

            while (self.singles[name].length) {
                self.singles[name].pop().apply(self, args);
            }

            return self;
        },
        check: function check() {
            var self = this;

            self.elements.forEach(function (el) {
                var status = el.getAttribute('data-inview-state');
                if (self.inview(el)) {
                    self.emit('move', el, getRect(el));
                    if (status !== 'in') {
                        el.setAttribute('data-inview-state', 'in');
                        self.emit('enter', el);
                    }
                } else {
                    if (status === 'in') {
                        el.setAttribute('data-inview-state', 'out');
                        self.emit('leave', el);
                    }
                }
            });
        },
        is: function is(el) {
            return this.inview(el);
        },
        inview: function inview(el) {
            var self = this;
            var options = self.options;

            var _core$dom$getDimensio = core.dom.getDimensions(el),
                top = _core$dom$getDimensio.top,
                right = _core$dom$getDimensio.right,
                bottom = _core$dom$getDimensio.bottom,
                left = _core$dom$getDimensio.left,
                width = _core$dom$getDimensio.width,
                height = _core$dom$getDimensio.height;

            var scrollTop = core.dom.getScrollTop();

            var intersection = {
                top: bottom,
                right: window.innerWidth - left,
                bottom: window.innerHeight - top,
                left: right
            };

            var threshold = {
                x: options.threshold * width,
                y: options.threshold * height
            };

            return (scrollTop > top && options.allowInScroll || intersection.top > options.offset.top + threshold.y) && intersection.right > options.offset.right + threshold.x && intersection.bottom > options.offset.bottom + threshold.y && intersection.left > options.offset.left + threshold.x;
        }
    });

    var watchers = [];
    var started = false;

    function watching() {
        watchers.forEach(function (watcher) {
            watcher.check();
        });
    }

    function startWatch() {
        $(window).on('resize.inview scroll.inview load.inview', function () {
            watching();
        });
    }

    var InviewScroll = core.ui('InviewScroll', {
        bindjQuery: 'inviewScroll',
        defaults: {
            start: false
        },
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            if (!started) {
                started = true;
                startWatch();
            }

            self.start();

            if (self.options.start) {
                watching();
            }
        },
        start: function start() {
            var self = this;
            var opt = self.options;
            var elements = [self.el];

            watchers.push(self.watcher = new Watcher(elements, self.options));
        },
        clear: function clear() {
            this.watcher.clear();
        },
        destroy: function destroy() {
            core.array.remove(watchers, this.watcher);
            this.watcher.clear();
        }
    });

    return InviewScroll;
});