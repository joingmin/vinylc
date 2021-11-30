/*!
 * @module vcui.ui.SmoothScroll
 * @license MIT License
 * @description SmoothScroll 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/smoothScroll', ['jquery', 'vcui'], function ($, core) {
    "use strict";
    /*! iScroll v5.1.2 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license
     */
    var rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame || function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    var _elementStyle = document.createElement('div').style;
    var _vendor = function () {
        var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
            transform, i = 0,
            l = vendors.length;

        for (; i < l; i++) {
            transform = vendors[i] + 'ransform';
            if (transform in _elementStyle) {
                return vendors[i].substr(0, vendors[i].length - 1);
            }
        }

        return false;
    }();

    function _prefixStyle(style) {
        if (_vendor === false) return false;
        if (_vendor === '') return style;
        return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
    }

    var _transform = _prefixStyle('transform');

    var getTime = Date.now || function getTime() {
        return new Date().getTime();
    };

    var momentum = function momentum(current, start, time, lowerMargin,
                                     wrapperSize, deceleration) {
        var distance = current - start,
            speed = Math.abs(distance) / time,
            destination, duration;

        deceleration = deceleration === undefined ? 0.0006 : deceleration;

        destination =
            current + speed * speed / (2 * deceleration) * (distance < 0 ? -1 : 1);
        duration = speed / deceleration;

        if (destination < lowerMargin) {
            destination = wrapperSize ?
                lowerMargin - wrapperSize / 2.5 * (speed / 8) :
                lowerMargin;
            distance = Math.abs(destination - current);
            duration = distance / speed;
        } else if (destination > 0) {
            destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
            distance = Math.abs(current) + destination;
            duration = distance / speed;
        }

        return {
            destination: Math.round(destination),
            duration: duration
        };
    };

    var browser = {
        hasTransform: _transform !== false,
        hasPerspective: _prefixStyle('perspective') in _elementStyle,
        hasTouch: 'ontouchstart' in window,
        hasPointer: window.PointerEvent || window.MSPointerEvent, // IE10 is prefixed
        hasTransition: _prefixStyle('transition') in _elementStyle
    };

    var easingType = {
        quadratic: {
            style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fn: function fn(k) {
                return k * (2 - k);
            }
        },
        circular: {
            style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
            fn: function fn(k) {
                return Math.sqrt(1 - --k * k);
            }
        },
        back: {
            style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            fn: function fn(k) {
                var b = 4;
                return (k = k - 1) * k * ((b + 1) * k + b) + 1;
            }
        },
        bounce: {
            style: '',
            fn: function fn(k) {
                if ((k /= 1) < 1 / 2.75) {
                    return 7.5625 * k * k;
                } else if (k < 2 / 2.75) {
                    return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
                } else if (k < 2.5 / 2.75) {
                    return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
                } else {
                    return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
                }
            }
        },
        elastic: {
            style: '',
            fn: function fn(k) {
                var f = 0.22,
                    e = 0.4;

                if (k === 0) {
                    return 0;
                }
                if (k === 1) {
                    return 1;
                }

                return e * Math.pow(2, -10 * k) *
                    Math.sin((k - f / 4) * (2 * Math.PI) / f) +
                    1;
            }
        }
    };

    var eventType = {
        touchstart: 1,
        touchmove: 1,
        touchend: 1,

        mousedown: 2,
        mousemove: 2,
        mouseup: 2,

        pointerdown: 3,
        pointermove: 3,
        pointerup: 3,

        MSPointerDown: 3,
        MSPointerMove: 3,
        MSPointerUp: 3
    };

    var style = {
        transform: _transform,
        transitionTimingFunction: _prefixStyle('transitionTimingFunction'),
        transitionDuration: _prefixStyle('transitionDuration'),
        transitionDelay: _prefixStyle('transitionDelay'),
        transformOrigin: _prefixStyle('transformOrigin')
    };

    var $doc = $(document);

    var SmoothScroll = core.ui('SmoothScroll', {
        bindjQuery: 'smoothScroll',
        defaults: {
            startX: 0,
            startY: 0,
            scrollX: true,
            scrollY: true,
            directionLockThreshold: 5,
            mouseWheelSpeed: 20,
            notWheel: true,
            momentum: true,
            center: false,
            prevButton: '',
            nextButton: '',
            gapWidth: 0,
            toggleButton: 'show',
            bounce: true,
            bounceTime: 600,
            bounceEasing: '',

            preventDefault: false,
            preventDefaultException: {
                tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/i
            },

            HWCompositing: true,
            useTransition: true,
            useTransform: true,
            resizeRefresh: true
        },
        selectors: {
            scroller: '>*:first'
        },
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            var opts = self.options;

            self.$wrapper = self.$el.css('user-select', 'none');
            self.isBadAndroid = /Android /.test(window.navigator.appVersion) && !/Chrome\/\d/.test(window.navigator.appVersion);
            self.translateZ = opts.HWCompositing && browser.hasPerspective ? ' translateZ(0)' : '';
            opts.useTransition = browser.hasTransition && opts.useTransition;
            opts.useTransform = browser.hasTransform && opts.useTransform;
            opts.eventPassthrough = opts.eventPassthrough === true ? 'vertical' : opts.eventPassthrough;
            opts.preventDefault = !opts.eventPassthrough && opts.preventDefault;
            opts.scrollY = opts.eventPassthrough === 'vertical' ? false : opts.scrollY;
            opts.scrollX = opts.eventPassthrough === 'horizontal' ? false : opts.scrollX;
            opts.freeScroll = opts.freeScroll && !opts.eventPassthrough;
            opts.directionLockThreshold = opts.eventPassthrough ? 0 : opts.directionLockThreshold;
            opts.bounceEasing = typeof opts.bounceEasing === 'string' ? easingType[opts.bounceEasing] || easingType.circular : opts.bounceEasing;
            opts.resizePolling = opts.resizePolling === undefined ? 60 : opts.resizePolling;
            opts.invertWheelDirection = opts.invertWheelDirection ? -1 : 1;

            self.x = 0;
            self.y = 0;
            self.directionX = 0;
            self.directionY = 0;

            self.$el.css('overflow', 'hidden').addClass('ui_smoothscroll_initialized');
            self.scrollerStyle = self.$scroller[0].style;

            self._initEvents();
            self.refresh();
            self.enable();

            if ('autoCenterScroll' in opts) {
                opts.center = opts.autoCenterScroll;
            }

            if (opts.center) {
                setTimeout(function () {
                    self.scrollToActive(100);
                }, 100);
            } else {
                self.scrollTo(opts.startX, opts.startY);
            }

            self.triggerHandler('smoothscrollinit', this)
        },

        _calcScrollerWidth: function _calcScrollerWidth() {
            if (!this.$scroller) {
                return;
            }

            var self = this,
                opts = self.options,
                width = 0,
                paddingWidth = self.$scroller.outerWidth() - self.$scroller.width(),
                style = self.$scroller[0].style;

            style.setProperty('width', '100000px');
            self.$items = self.$scroller.children(); //
            self.$items.each(function () {
                width += $(this).outerWidth(true);
            });
            style.setProperty('width', 'auto', 'important');
            self.$scroller.css('min-width', width + paddingWidth + opts.gapWidth);
        },

        _activateButtons: function _activateButtons() {
            var self = this,
                opt = self.options;

            if (self.$prevButton) {
                self.$prevButton.prop('disabled', self.x === 0);
                if (self.x === 0) {
                    self.$prevButton.addClass('disabled');
                } else {
                    self.$prevButton.removeClass('disabled');
                }
            }

            if (self.$nextButton) {
                self.$nextButton.prop('disabled', self.x === self.maxScrollX);

                if (self.x === self.maxScrollX) {
                    self.$nextButton.addClass('disabled');
                } else {
                    self.$nextButton.removeClass('disabled');
                }
            }
        },

        enable: function enable() {
            this.enabled = true;
        },

        _initEvents: function _initEvents() {
            var self = this;
            var opt = self.options;

            if (opt.prevButton && opt.nextButton) {
                (self.$prevButton = $(opt.prevButton)).addClass('disabled')
                    .on('click' + self.eventNS, function (e) {
                        e.preventDefault();
                        self.prevPage();
                    });

                (self.$nextButton = $(opt.nextButton)).addClass('disabled')
                    .on('click' + self.eventNS, function (e) {
                        e.preventDefault();
                        self.nextPage();
                    });

                self.on('smoothscrollend',
                    function (e, data) {
                        self._activateButtons();
                    });
            }

            self._handle(self.$wrapper, 'mousedown');
            self._handle(self.$wrapper, 'touchstart');
            self._handle(self.$wrapper, 'focusin');
            self._handle(self.$wrapper, 'selectstart');
            self._handle(self.$wrapper, 'click');

            if (self.options.useTransition) {
                self._handle(self.$scroller, 'transitionend');
                self._handle(self.$scroller, 'webkitTransitionEnd');
            }

            if (!self.options.notWheel) {
                self._initWheel();
            }

            if (self.options.resizeRefresh) {
                self.winOn('resize', core.delayRun(function () {
                        if (self.el) {
                            self.refresh();
                        }
                    },
                    self.options.resizePolling));
            }

            self.winOne('load', function () {
                self._activateButtons();
            })
        },

        _initWheel: function _initWheel() {
            var self = this;

            self._handle(self.$wrapper, 'wheel');
            self._handle(self.$wrapper, 'mousewheel');
            self._handle(self.$wrapper, 'DOMMouseScroll');
        },

        moveFirst: function () {
            this.scrollTo(0, 0, 200);
        },

        moveLast: function () {
            this.scrollTo(this.maxScrollX, 0, 200);
        },

        /**
         * ���̺�Ʈ ó��
         * @param e
         * @private
         */
        _wheel: function _wheel(e) {
            var self = this;
            if (!self.enabled) {
                return;
            }

            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            e.stopPropagation ? e.stopPropagation() : e.cancalBubble = true;

            var wheelDeltaX, wheelDeltaY, newX, newY;

            if (self.wheelTimeout === undefined) {
                self.triggerHandler('smoothscrollstart', {
                    x: self.x,
                    y: self.y
                });
            }

            // Execute the scrollEnd event after 400ms the wheel stopped scrolling
            clearTimeout(self.wheelTimeout);
            self.wheelTimeout = setTimeout(function () {
                self.triggerHandler('smoothscrollend', {
                    x: self.x,
                    y: self.y,
                    isStart: self.x === 0,
                    isEnd: self.x === self.maxScrollX
                });
                self.wheelTimeout = undefined;
            }, 400);

            e = e.originalEvent || e;
            if ('deltaX' in e) {
                if (e.deltaMode === 1) {
                    wheelDeltaX = -e.deltaX * self.options.mouseWheelSpeed;
                    wheelDeltaY = -e.deltaY * self.options.mouseWheelSpeed;
                } else {
                    wheelDeltaX = -e.deltaX;
                    wheelDeltaY = -e.deltaY;
                }
            } else if ('wheelDeltaX' in e) {
                wheelDeltaX = e.wheelDeltaX / 120 * self.options.mouseWheelSpeed;
                wheelDeltaY = e.wheelDeltaY / 120 * self.options.mouseWheelSpeed;
            } else if ('wheelDelta' in e) {
                wheelDeltaX = wheelDeltaY =
                    e.wheelDelta / 120 * self.options.mouseWheelSpeed;
            } else if ('detail' in e) {
                wheelDeltaX = wheelDeltaY = -e.detail / 3 * self.options.mouseWheelSpeed;
            } else {
                return;
            }

            wheelDeltaX *= self.options.invertWheelDirection;
            wheelDeltaY *= self.options.invertWheelDirection;

            if (!self.hasVerticalScroll) {
                wheelDeltaX = wheelDeltaY;
                wheelDeltaY = 0;
            }

            newX = self.x + Math.round(self.hasHorizontalScroll ? wheelDeltaX : 0);
            newY = self.y + Math.round(self.hasVerticalScroll ? wheelDeltaY : 0);

            if (newX > 0) {
                newX = 0;
            } else if (newX < self.maxScrollX) {
                newX = self.maxScrollX;
            }

            if (newY > 0) {
                newY = 0;
            } else if (newY < self.maxScrollY) {
                newY = self.maxScrollY;
            }

            self.scrollTo(newX, newY, 0);
        },

        _handle: function _handle($el, eventName, isBind) {
            var self = this;
            if (isBind !== false) {
                $el.on(eventName + '.' + self.cid, self.handleEvent.bind(self));
            } else {
                $el.off(eventName + '.' + self.cid);
            }
        },

        handleEvent: function handleEvent(e) {
            var self = this;

            switch (e.type) {
                case 'mousedown':
                case 'touchstart':
                    self._start(e);
                    break;
                case 'selectstart':
                    e.preventDefault ? e.preventDefault : e.returnValue = false;
                    break;
                case 'mousemove':
                case 'touchmove':
                    self._move(e);
                    break;
                case 'focusin':
                    self._focusin(e);
                    break;
                case 'mouseup':
                case 'mousecancel':
                case 'touchend':
                case 'touchcancel':
                    self._end(e);
                    break;
                case 'transitionend':
                case 'webkitTransitionEnd':
                case 'oTransitionEnd':
                case 'MSTransitionEnd':
                    self._transitionEnd(e);
                    break;
                case 'wheel':
                case 'mousewheel':
                case 'DOMMouseScroll':
                    self._wheel(e);
                    break;
                // case 'click':
                //    me._click(e);
                //    break;
            }
        },

        _focusin: function (e) {
            var self = this;
            var $target = $(e.target);

            self.$scroller.children().each(function () {
                if ($.contains(this, $target[0])) {
                    var pos = $target.position();
                    var itemLeft = Math.abs(self.x) + pos.left;
                    var width = $target.outerWidth(true);

                    if (itemLeft >= Math.abs(self.x) && itemLeft + width < Math.abs(self.x) + self.wrapperWidth) {
                        return;
                    }

                    self.scrollToElement(this, 200, self.options.center);
                    return false;
                }
            });
        },

        prevPage: function prevPage() {
            var self = this;

            self.scrollTo(Math.min(0, self.x + self.wrapperWidth), 0, 200);
        },

        nextPage: function nextPage() {
            var self = this;

            self.scrollTo(Math.max(self.maxScrollX, self.x - self.wrapperWidth), 0,
                200);
        },

        getPosition: function getPosition() {
            var matrix = this.scrollerStyle,
                x, y;

            if (this.options.useTransform) {
                matrix = matrix[style.transform].match(/-?[\d.]+/g);
                x = +matrix[0];
                y = +matrix[1];
            } else {
                x = +matrix.left.replace(/[^-\d.]/g, '');
                y = +matrix.top.replace(/[^-\d.]/g, '');
            }

            return {
                x: x,
                y: y
            };
        },

        _animate: function _animate(destX, destY, duration, easingFn) {
            var self = this,
                startX = this.x,
                startY = this.y,
                startTime = getTime(),
                destTime = startTime + duration;

            function step() {
                var now = getTime(),
                    newX, newY, easing;

                if (now >= destTime) {
                    self.isAnimating = false;
                    self._translate(destX, destY);

                    if (!self.resetPosition(self.options.bounceTime)) {
                        self.triggerHandler('smoothscrollend', {
                            x: self.x,
                            y: self.y,
                            isStart: self.x === 0,
                            isEnd: self.x === self.maxScrollX
                        });
                    }

                    return;
                }

                now = (now - startTime) / duration;
                easing = easingFn(now);
                newX = (destX - startX) * easing + startX;
                newY = (destY - startY) * easing + startY;
                self._translate(newX, newY);

                if (self.isAnimating) {
                    rAF(step);
                }
            }

            this.isAnimating = true;
            step();
        },

        _transitionTime: function _transitionTime(time) {
            time = time || 0;

            this.scrollerStyle[style.transitionDuration] = time + 'ms';

            /*if ( !time && utils.isBadAndroid ) {
             this.scrollerStyle[style.transitionDuration] = '0.001s';
             }*/
        },

        _transitionTimingFunction: function _transitionTimingFunction(easing) {
            this.scrollerStyle[style.transitionTimingFunction] = easing;
        },

        _translate: function _translate(x, y) {
            var self = this;

            if (self.options.useTransform) {
                self.scrollerStyle[style.transform] =
                    'translate(' + x + 'px,' + y + 'px)' + self.translateZ;
            } else {
                x = Math.round(x);
                y = Math.round(y);
                self.scrollerStyle.left = x + 'px';
                self.scrollerStyle.top = y + 'px';
            }

            self.x = x;
            self.y = y;
            self.triggerHandler('smoothscrollmove', {
                x: self.x,
                y: self.y
            });
        },

        resetPosition: function resetPosition(time) {
            var self = this,
                x = self.x,
                y = self.y;

            time = time || 0;

            if (!self.hasHorizontalScroll || self.x > 0) {
                x = 0;
            } else if (self.x < self.maxScrollX) {
                x = self.maxScrollX;
            }

            if (!self.hasVerticalScroll || self.y > 0) {
                y = 0;
            } else if (self.y < self.maxScrollY) {
                y = self.maxScrollY;
            }

            if (x == self.x && y == self.y) {
                return false;
            }

            self.scrollTo(x, y, time, self.options.bounceEasing);
            return true;
        },

        scrollTo: function scrollTo(x, y, time, easing) {
            var self = this;
            easing = easing || easingType.circular;

            self.isInTransition = self.options.useTransition && time > 0;

            if (!time || self.options.useTransition && easing.style) {
                self._transitionTimingFunction(easing.style);
                self._transitionTime(time);
                self._translate(x, y);
                self.triggerHandler('smoothscrollend', {
                    x: self.x,
                    y: self.y,
                    isStart: self.x === 0,
                    isEnd: self.x === self.maxScrollX
                });
            } else {
                self._animate(x, y, time, easing.fn);
            }
        },

        scrollToElement: function scrollToElement(el, time, offsetX, offsetY,
                                                  easing) {
            var self = this;
            el = el.nodeType ? el : self.$scroller.find(el);

            if (!el) {
                return;
            }

            var $el = $(el);
            var xy = core.dom.getTranslateXY(self.$scroller[0]);
            var pos = $el.position();
            var maxX = Math.abs(self.maxScrollX);
            var maxY = Math.abs(self.maxScrollY);
            var width = $el.outerWidth();
            var itemLeft = Math.abs(self.x) + pos.left;

            if (!self.options.center && itemLeft >= Math.abs(self.x) && itemLeft + width < Math.abs(self.x) + self.wrapperWidth) {
                return;
            }

            pos.left += Math.abs(xy.x);
            pos.top += Math.abs(xy.y);

            pos.left -= parseInt($el.parent().css('paddingLeft'), 10);
            pos.top -= parseInt($el.parent().css('paddingTop'), 10);

            if (offsetX === true) {
                offsetX = Math.round(el.offsetWidth / 2 - self.$wrapper[0].offsetWidth / 2);
            }
            if (offsetY === true) {
                offsetY = Math.round(el.offsetHeight / 2 - self.$wrapper[0].offsetHeight / 2);
            }

            pos.left += offsetX || 0;
            pos.top += offsetY || 0;
            pos.left = Math.min(maxX, pos.left < 0 ? 0 : pos.left);
            pos.top = Math.min(maxY, pos.top < 0 ? 0 : pos.top);

            time = time === undefined || time === null || time === 'auto' ? Math.max(Math.abs(self.x - pos.left), Math.abs(self.y - pos.top)) : time;

            self.scrollTo(-pos.left, -pos.top, time, easing);


        },

        scrollToActive: function (time, easing) {
            var $item = this.$scroller.children().filter('.on');
            if ($item.length) {
                this.scrollToElement($item[0], time == undefined ? 200 : time, this.options.center);
            }
        },


        preventDefaultException: function preventDefaultException(el) {
            var self = this;

            if (el && el.tagName &&
                self.options.preventDefaultException.tagName.test(el.tagName)) {
                return true;
            } else {
                return false;
            }
        },

        /***
         _isDownable: function(el){
            if(el && el.tagName &&
        this.options.preventDefaultException.tagName.test(el.tagName)){
                return true;
            } else {
                return false;
            }
        },
         _click: function(e) {
            var me = this,
                point = e.touches ? e.touches[0] : e;
              if(!(me.downX === point.pageX && me.downY === point.pageY)) {
                console.log('prevent click', me.downX, me.downY, e.pageX, e.pageY);
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
            }
        },
         ***/
        _start: function _start(ev) {
            var self = this;
            var opt = self.options;
            var e = ev.originalEvent || ev;

            if (eventType[e.type] != 1) {
                if (e.button !== 0) {
                    return;
                }
            }

            if (!self.enabled ||
                self.initiated && eventType[e.type] !== self.initiated) {
                return;
            }

            if (/*!self.isBadAndroid && */self.preventDefaultException(e.target)) {
                e.preventDefault();
            }

            var point = e.touches ? e.touches[0] : e,
                pos;

            /***if(!me._isDownable($(e.target).closest(':focusable').get(0))) {
                e.preventDefault ? e.preventDefault() : e.returnValue = false;
            }***/
            self._handle(self.$wrapper, 'mousemove');
            self._handle(self.$wrapper, 'touchmove');
            self._handle($doc, 'touchend');
            self._handle($doc, 'mouseup');
            self._handle($doc, 'mousecancel');
            self._handle($doc, 'tocuchcancel');

            self.initiated = eventType[e.type];
            self.moved = false;
            self.distX = 0;
            self.distY = 0;
            self.directionX = 0;
            self.directionY = 0;
            self.directionLocked = 0;

            self._transitionTime();

            self.startTime = getTime();
            if (opt.useTransition && self.isInTransition) {
                self.isInTransition = false;
                pos = self.getPosition();
                self._translate(Math.round(pos.x), Math.round(pos.y));
                self.triggerHandler('smoothscrollend', {
                    x: self.x,
                    y: self.y,
                    isStart: self.x === 0,
                    isEnd: self.x === self.maxScrollX
                });
            } else if (!opt.useTransition && self.isAnimating) {
                self.isAnimating = false;
                self.triggerHandler('smoothscrollend', {
                    x: self.x,
                    y: self.y,
                    isStart: self.x === 0,
                    isEnd: self.x === self.maxScrollX
                });
            }

            self.startX = self.x;
            self.startY = self.y;
            self.absStartX = self.x;
            self.absStartY = self.y;
            self.pointX = self.downX = point.pageX;
            self.pointY = self.downY = point.pageY;
        },

        _move: function _move(ev) {
            var self = this;
            var opt = self.options;
            var e = ev.originalEvent || ev;

            if (!self.enabled || eventType[e.type] !== self.initiated) {
                return;
            }

            if (opt.preventDefault) {
                // increases performance on Android? TODO: check!
                e.preventDefault ? e.preventDefault() : e.defaultValue = false;
            }

            var point = e.touches ? e.touches[0] : e,
                deltaX = point.pageX - self.pointX,
                deltaY = point.pageY - self.pointY,
                timestamp = getTime(),
                newX, newY,
                absDistX, absDistY;

            self.pointX = point.pageX;
            self.pointY = point.pageY;

            self.distX += deltaX;
            self.distY += deltaY;
            absDistX = Math.abs(self.distX);
            absDistY = Math.abs(self.distY);

            // We need to move at least 10 pixels for the scrolling to initiate
            if (timestamp - self.endTime > 300 && absDistX < 10 && absDistY < 10) {
                return;
            }

            // If you are scrolling in one direction lock the other
            if (!self.directionLocked && !opt.freeScroll) {
                if (absDistX > absDistY + opt.directionLockThreshold) {
                    self.directionLocked = 'h'; // lock horizontally
                } else if (absDistY >= absDistX + opt.directionLockThreshold) {
                    self.directionLocked = 'v'; // lock vertically
                } else {
                    self.directionLocked = 'n'; // no lock
                }
            }

            if (self.directionLocked == 'h') {
                if (opt.eventPassthrough == 'vertical') {
                    e.preventDefault ? e.preventDefault() : e.defaultValue = false;
                } else if (opt.eventPassthrough == 'horizontal') {
                    self.initiated = false;
                    return;
                }

                deltaY = 0;
            } else if (self.directionLocked == 'v') {
                if (opt.eventPassthrough == 'horizontal') {
                    e.preventDefault ? e.preventDefault() : e.defaultValue = false;
                } else if (opt.eventPassthrough == 'vertical') {
                    self.initiated = false;
                    return;
                }

                deltaX = 0;
            }

            deltaX = self.hasHorizontalScroll ? deltaX : 0;
            deltaY = self.hasVerticalScroll ? deltaY : 0;

            newX = self.x + deltaX;
            newY = self.y + deltaY;

            // Slow down if outside of the boundaries
            if (newX > 0 || newX < self.maxScrollX) {
                newX =
                    opt.bounce ? self.x + deltaX / 3 : newX > 0 ? 0 : self.maxScrollX;
            }
            if (newY > 0 || newY < self.maxScrollY) {
                newY =
                    opt.bounce ? self.y + deltaY / 3 : newY > 0 ? 0 : self.maxScrollY;
            }

            self.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            self.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            if (!self.moved) {
                self.triggerHandler('smoothscrollstart', {
                    x: self.x,
                    y: self.y
                });
            }
            self.moved = true;
            self._translate(newX, newY);

            if (timestamp - self.startTime > 300) {
                self.startTime = timestamp;
                self.startX = self.x;
                self.startY = self.y;
            }
        },

        _end: function _end(e) {
            var self = this;

            if (!self.enabled || eventType[e.type] !== self.initiated) {
                return;
            }

            var $doc = $(document),
                opt = self.options,

                // point = e.changedTouches ? e.changedTouches[0] : e,
                momentumX, momentumY, duration = getTime() - self.startTime,
                newX = Math.round(self.x),
                newY = Math.round(self.y),

                // distanceX = Math.abs(newX - me.startX),
                // distanceY = Math.abs(newY - me.startY),
                time = 0,
                easing = '';

            $doc.off('.' + self.cid);

            self.isInTransition = 0;
            self.initiated = 0;
            self.endTime = getTime();

            // reset if we are outside of the boundaries
            if (self.resetPosition(self.options.bounceTime)) {
                return;
            }

            self.scrollTo(newX, newY); // ensures that the last position is rounded

            if (!self.moved) {
                return;
            }

            // start momentum animation if needed
            if (opt.momentum && duration < 300) {
                momentumX =
                    self.hasHorizontalScroll ?
                        momentum(self.x, self.startX, duration, self.maxScrollX,
                            opt.bounce ? self.wrapperWidth : 0, opt.deceleration) : {
                            destination: newX,
                            duration: 0
                        };
                momentumY = self.hasVerticalScroll ?
                    momentum(self.y, self.startY, duration, self.maxScrollY,
                        opt.bounce ? self.wrapperHeight : 0,
                        opt.deceleration) : {
                        destination: newY,
                        duration: 0
                    };
                newX = momentumX.destination;
                newY = momentumY.destination;
                time = Math.max(momentumX.duration, momentumY.duration);
                self.isInTransition = 1;
            }

            if (newX != self.x || newY != self.y) {
                // change easing function when scroller goes out of the boundaries
                if (newX > 0 || newX < self.maxScrollX || newY > 0 ||
                    newY < self.maxScrollY) {
                    easing = easingType.quadratic;
                }

                self.scrollTo(newX, newY, time, easing);
                return;
            }

            self.triggerHandler('smoothscrollend', {
                x: self.x,
                y: self.y,
                isStart: self.x === 0,
                isEnd: self.x === self.maxScrollX
            });
        },

        refresh: function refresh() {
            // var rf = this.$wrapper[0].offsetHeight;           // Force reflow
            var self = this;

            self.update();
            self.triggerHandler('smoothscrollrefresh', self);
        },

        update: function () {
            var self = this;
            var opt = self.options;

            self._calcScrollerWidth();

            self.wrapperWidth = opt.getWrapperWidth ? opt.getWrapperWidth.call(self) : self.$wrapper.innerWidth();
            self.wrapperHeight = opt.getWrapperHeight ? opt.getWrapperHeight.call(self) : self.$wrapper.innerHeight();

            var style = window.getComputedStyle ?
                getComputedStyle(self.$wrapper[0], null) :
                self.$wrapper[0].currentStyle;
            self.wrapperWidth -= ((parseInt(style.paddingLeft) || 0) +
                (parseInt(style.paddingRight) || 0));
            self.wrapperHeight -= ((parseInt(style.paddingTop) || 0) +
                (parseInt(style.paddingBottom) || 0));
            self.wrapperOffset = self.$wrapper.offset();

            self.scrollerWidth = opt.getScrollerWidth ? opt.getScrollerWidth.call(self) : self.$scroller.innerWidth();
            self.scrollerHeight = opt.getScrollerHeight ?
                opt.getScrollerHeight.call(self) :
                self.$scroller.innerHeight();

            self.maxScrollX = self.wrapperWidth - self.scrollerWidth;
            self.maxScrollY = self.wrapperHeight - self.scrollerHeight;

            self.hasHorizontalScroll = opt.scrollX && self.maxScrollX < 0;
            self.hasVerticalScroll = opt.scrollY && self.maxScrollY < 0;

            if (!self.hasHorizontalScroll) {
                self.maxScrollX = 0;
                self.scrollerWidth = self.wrapperWidth;
            }

            if (!self.hasVerticalScroll) {
                self.maxScrollY = 0;
                self.scrollerHeight = self.wrapperHeight;
            }

            self.endTime = 0;
            self.directionX = 0;
            self.directionY = 0;

            self.resetPosition();
            self._activateButtons();
            self.triggerHandler('smoothscrollupdate');
        },

        _transitionEnd: function _transitionEnd(e) {
            if (e.target != this.$scroller[0] || !this.isInTransition) {
                return;
            }

            this._transitionTime();
            if (!this.resetPosition(this.options.bounceTime)) {
                this.isInTransition = false;
                this.triggerHandler('smoothscrollend', {
                    x: this.x,
                    y: this.y,
                    isStart: this.x === 0,
                    isEnd: this.x === this.maxScrollX
                });
            }
        },

        getMaxScrollX: function getMaxScrollX() {
            return this.maxScrollX;
        },
        getMaxScrollY: function getMaxScrollY() {
            return this.maxScrollY;
        },
        destroy: function destroy() {
            var self = this;

            if (self.$prevButton) {
                self.$prevButton.off(self.eventNS);
            }
            if (self.$nextButton) {
                self.$nextButton.off(self.eventNS);
            }

            self.$el.removeClass('ui_smoothscroll_initialized');

            self._handle(self.$wrapper, 'mousemove', false);
            self._handle(self.$wrapper, 'touchmove', false);
            self._handle(self.$wrapper, 'mousedown', false);
            self._handle(self.$wrapper, 'touchstart', false);
            self._handle(self.$wrapper, 'focusin', false);
            self._handle(self.$wrapper, 'selectstart', false);
            self._handle(self.$wrapper, 'click', false);
            self._handle($doc, 'touchend', false);
            self._handle($doc, 'mouseup', false);
            self._handle($doc, 'mousecancel', false);
            self._handle($doc, 'tocuchcancel', false);
            self._handle(self.$scroller, 'transitionend', false);
            self._handle(self.$scroller, 'webkitTransitionEnd', false);
            self.winOff('resize');

            this.supr();
        }
    });

    return SmoothScroll;
});