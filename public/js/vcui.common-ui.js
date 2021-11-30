/*!
 * @module vcui.helper.BreakpointDispatcher
 * @bechmark https://github.com/paulirish/matchMedia.js
 * @license MIT License
 * @description 반응형 분기점을 지날때마다 이벤트를 발생시켜주는 헬퍼
 * @copyright VinylC UID Group
 */
define('helper/breakpointDispatcher', ['jquery', 'vcui'], function($, core) {
    "use strict";

    window.matchMedia || (window.matchMedia = function() {
        "use strict";

        var styleMedia = (window.styleMedia || window.media);
        if (!styleMedia) {
            var style = document.createElement('style'),
                script = document.getElementsByTagName('script')[0],
                info = null;

            style.type = 'text/css';
            style.id = 'matchmediajs-test';

            if (!script) {
                document.head.appendChild(style);
            } else {
                script.parentNode.insertBefore(style, script);
            }

            info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

            styleMedia = {
                matchMedium: function(media) {
                    var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

                    if (style.styleSheet) {
                        style.styleSheet.cssText = text;
                    } else {
                        style.textContent = text;
                    }

                    return info.width === '1px';
                }
            };
        }

        return function(media) {
            return {
                matches: styleMedia.matchMedium(media || 'all'),
                media: media || 'all'
            };
        };
    }());

    (function() {
        if (window.matchMedia && window.matchMedia('all').addListener) {
            return false;
        }

        var localMatchMedia = window.matchMedia,
            hasMediaQueries = localMatchMedia('only all').matches,
            isListening = false,
            timeoutID = 0, // setTimeout for debouncing 'handleChange'
            queries = [], // Contains each 'mql' and associated 'listeners' if 'addListener' is used
            handleChange = function(evt) {
                // Debounce
                clearTimeout(timeoutID);

                timeoutID = setTimeout(function() {
                    for (var i = 0, il = queries.length; i < il; i++) {
                        var mql = queries[i].mql,
                            listeners = queries[i].listeners || [],
                            matches = localMatchMedia(mql.media).matches;

                        if (matches !== mql.matches) {
                            mql.matches = matches;

                            for (var j = 0, jl = listeners.length; j < jl; j++) {
                                listeners[j].call(window, mql);
                            }
                        }
                    }
                }, 30);
            };

        window.matchMedia = function(media) {
            var mql = localMatchMedia(media),
                listeners = [],
                index = 0;

            mql.addListener = function(listener) {

                if (!hasMediaQueries) {
                    return;
                }

                if (!isListening) {
                    isListening = true;
                    window.addEventListener('resize', handleChange, true);
                }

                if (index === 0) {
                    index = queries.push({
                        mql: mql,
                        listeners: listeners
                    });
                }

                listeners.push(listener);
            };

            mql.removeListener = function(listener) {
                for (var i = 0, il = listeners.length; i < il; i++) {
                    if (listeners[i] === listener) {
                        listeners.splice(i, 1);
                    }
                }
            };

            return mql;
        };
    }());

    /**
     * @class
     * @name vcui.helper.BreakpointDispatcher
     */
    var BreakpointDispatcher = core.helper.BreakpointDispatcher = /** @lends  vcui.helper.BreakpointDispatcher */ vcui.BaseClass.extend({
        $singleton: true,
        initialize: function(options) {
            var self = this;

            self.options = core.extend({
                matches: {}
            }, options);
        },
        /**
         *
         */
        start: function() {
            var self = this,
                data;

            core.each(self.options.matches, function(item, key) {
                var mq = window.matchMedia(key);

                mq.addListener(item);
                item(mq);
            });
        }
    });

    return BreakpointDispatcher;
});
/*!
 * @module vcui.helper.Gesture
 * @license MIT License
 * @description 제스처 헬퍼
 * @copyright VinylC UID Group
 */
define('helper/gesture', ['jquery', 'vcui'], function($, core) {
    "use strict";

    function makeEventNS(name, ns) {
        return core.array.reduce(name.split(/\s+/g), function(prev, cur) {
            return prev + ' ' + cur + ns;
        }, '').trim();
    }

    // 벨생되는 이벤트
    // - gesturestart : 터치가 시작될 때
    // - gesturemove : 터치한 체 움직일 때
    // - gestureend : 터치가 끝났을 때
    // - gesturecancel : 터치가 취소됐을 때
    // - gestureup : 터치가 윗 방향으로 움직일 때
    // - gesturedown : 터치가 아랫방향으로 움직일 때
    // - gestureleft : 터치가 왼쪽으로 움직일 때
    // - gestureright : 터치가 오른쪽으로 움직일 때

    var Gesture = core.helper('Gesture', core.ui.View.extend({
        name: 'Gesture',
        defaults: {
            container: document, // move이벤트를 어디에 걸 것인가
            threshold: 50, // 움직임을 감지하기 위한 최소 크기
            direction: 'horizontal', // 'vertical', 'both' 중 택일
            gesture: null, // 모든 제스처에 의해 호출되는 콜백형식의 헨들러함수. 이벤트 랑 콜백방식 중에 아무거나 편한거 사용
            gestureStart: null, // 터치가 시작될 때 호출되는 핸들러. 이벤트 랑 콜백방식 중에 아무거나 편한거 사용
            gestureMove: null, // 터치가 움직일 때 호출되는 핸들러. 이벤트 랑 콜백방식 중에 아무거나 편한거 사용
            gestureEnd: null // 터치가 끝났을 때 호출되는 핸들러. 이벤트 랑 콜백방식 중에 아무거나 편한거 사용
        },
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            var direction = self.options.direction;

            self.isHoriz = direction === 'horizontal' || direction === 'both';
            self.isVerti = direction === 'vertical' || direction === 'both';
            self.$container = $(self.options.container);

            self._bindGestureEvents();
        },

        _getEventPoint: function _getEventPoint(ev, type) {
            var e = ev.originalEvent || ev;
            if (type === 'end' || ev.type === 'touchend') {
                e = e.changedTouches && e.changedTouches[0] || e;
            } else {
                e = e.touches && e.touches[0] || e;
            }
            return {
                x: e.pageX || e.clientX,
                y: e.pageY || e.clientY
            };
        },

        _getAngle: function _getAngle(startPoint, endPoint) {
            var x = startPoint.x - endPoint.x;
            var y = endPoint.y - startPoint.y;
            var r = Math.atan2(y, x); //radians
            var angle = Math.round(r * 180 / Math.PI); //degrees
            if (angle < 0) angle = 360 - Math.abs(angle);
            return angle;
        },

        _getDirection: function _getDirection(startPoint, endPoint, direction) {
            var angle,
                isHoriz = !direction || direction === 'horizontal' || direction === 'both',
                isVert = !direction || direction === 'vertical' || direction === 'both';

            if (isHoriz != isVert) {
                if (isHoriz) {
                    if (startPoint.x > endPoint.x) {
                        return 'left';
                    } else if (startPoint.x == endPoint.x) {
                        return '';
                    } else {
                        return 'right';
                    }
                } else {
                    if (startPoint.y > endPoint.y) {
                        return 'up';
                    } else if (startPoint.y == endPoint.y) {
                        return '';
                    } else {
                        return 'down';
                    }
                }
            }

            angle = this._getAngle(startPoint, endPoint);
            if (angle <= 45 && angle >= 0) {
                return 'left';
            } else if (angle <= 360 && angle >= 315) {
                return 'left';
            } else if (angle >= 135 && angle <= 225) {
                return 'right';
            } else if (angle > 45 && angle < 135) {
                return 'down';
            } else {
                return 'up';
            }
        },

        _getDiff: function _getDiff(a, b) {
            return {
                x: a.x - b.x,
                y: a.y - b.y
            };
        },

        _bindGestureEvents: function _bindGestureEvents() {
            var self = this,
                opt = self.options,
                touchStart,
                downPos,
                isSwipe = false,
                isScroll = false,
                eventNS = '.gesture' + self.cid,
                $container = self.$container;

            //self.$el[0].onselectstart = function (){ return false; };
            //self.$el.attr('unselectable', 'on');

            self.$el.on(makeEventNS('mousedown touchstart', eventNS), function(downEvent) {
                if (downEvent.type === 'mousedown') {
                    downEvent.preventDefault();
                }
                downPos = touchStart = self._getEventPoint(downEvent);
                isSwipe = isScroll = false;

                $container.on(makeEventNS('mousemove touchmove', eventNS), function(moveEvent) {
                    var touch = self._getEventPoint(moveEvent),
                        diff,
                        slope,
                        swipeY,
                        swipeX;

                    if (!touchStart || isScroll) return;
                    diff = self._getDiff(touch, touchStart);

                    if (!isSwipe) {
                        swipeX = Math.abs(diff.y) / (Math.abs(diff.x) || 1);
                        swipeY = Math.abs(diff.x) / (Math.abs(diff.y) || 1);
                        if (swipeX < 1 && self.isHoriz || swipeY < 1 && self.isVerti) {
                            touch.event = moveEvent;
                            if (self._gestureCallback('start', touch) === false) {
                                return;
                            }
                            var ev = $.Event('gesturestart');
                            self.triggerHandler(ev, touch);
                            if (ev.isDefaultPrevented()) {
                                return;
                            }
                            isSwipe = true;
                            self.$el.on(makeEventNS('mousemove touchmove', eventNS), function(e) {
                                e.preventDefault();
                            });
                        } else {
                            if (self.isHoriz && swipeX > 1 || self.isVerti && swipeY > 1) {
                                isScroll = true;
                            }
                        }
                    }

                    if (isSwipe) {
                        moveEvent.stopPropagation();
                        moveEvent.preventDefault();

                        touch.diff = diff;
                        touch.direction = self._getDirection(touchStart, touch, opt.direction);
                        touch.event = moveEvent;

                        self._gestureCallback('move', touch);
                        self.triggerHandler('gesturemove', touch);
                    }
                }).on(makeEventNS('mouseup mousecancel touchend touchcancel', eventNS), function(upEvent) {
                    if (isSwipe && touchStart) {
                        var touch = self._getEventPoint(upEvent, 'end');
                        touch.diff = self._getDiff(touch, touchStart);

                        touch.direction = self._getDirection(touchStart, touch, opt.direction);
                        touch.event = upEvent;

                        self.$el.off(makeEventNS('mousemove touchmove', eventNS));

                        switch (touch.direction) {
                            case 'left':
                            case 'right':
                                if (Math.abs(touch.diff.x) > opt.threshold && self.isHoriz) {
                                    self._gestureCallback(touch.direction, touch);
                                    self.triggerHandler('gesture' + touch.direction, touch);
                                }
                                break;
                            case 'up':
                            case 'down':
                                if (Math.abs(touch.diff.y) > opt.threshold && self.isVerti) {
                                    self._gestureCallback(touch.direction, touch);
                                    self.triggerHandler('gesture' + touch.direction, touch);
                                }
                                break;
                        }

                        if (Math.abs(touch.diff.x) > opt.threshold || Math.abs(touch.diff.y) > opt.threshold) {
                            self._gestureCallback('end', touch);
                            self.triggerHandler('gestureend', touch);
                        } else {
                            self._gestureCallback('cancel', touch);
                            self.triggerHandler('gesturecancel', touch);
                        }
                    }

                    touchStart = null;
                    isScroll = false;
                    $container.off(eventNS);
                });
            }).on('click' + eventNS, 'a, button', function(e) {
                if (!downPos) {
                    return;
                }
                var pos = self._getEventPoint(e);
                if (downPos.x !== pos.x || downPos.y !== pos.y) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        },

        _gestureCallback: function _gestureCallback(type, data) {
            var self = this,
                ret;
            self.options['gesture' + type] && (ret = self.options['gesture' + type].call(self, data));
            self.options['gesture'] && (ret = self.options['gesture'].call(self, type, data));
            return ret;
        },

        destroy: function destroy() {
            var eventNS = '.gesture' + this.cid;
            this.$el.off(eventNS);
            this.$container.off(eventNS);
            this.supr();
        }
    }));

    core.ui.bindjQuery(Gesture, 'Gesture');

    return Gesture;
});
/*!
 * @module vcui.helper.Sharer
 * @license MIT License
 * @description Sharer 컴포넌트
 * @copyright VinylC UID Group
 */
define('helper/sharer', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var $doc = core.$doc,
        win = window,
        enc = encodeURIComponent;

    var detect = {
        PC: 1,
        MOBILE: 2,
        APP: 4
    };

    var defaultOption = {
        selector: '.ui-sharer',
        attr: 'data-service',
        metas: {
            title: {},
            description: {},
            image: {}
        },
        onBeforeShare: function() {},
        onShrered: function() {}
    };

    var Sharer = /** @lends axl.module.Sharer */ {
        support: detect,
        services: /** @lends axl.module.Sharer.services */ { //['facebook', 'twitter', 'kakaotalk', 'kakaostory'/* , 'googleplus'*/],
            'facebook': /** @lends axl.module.Sharer.services.facebook */ {
                name: '페이스북',
                support: detect.PC | detect.MOBILE,
                size: [500, 300],
                url: 'https://www.facebook.com/sharer.php?',
                makeParam: function makeParam(data) {
                    data.url = core.uri.addParam(data.url, {
                        '_t': +new Date()
                    });
                    return {
                        u: data.url,
                        t: data.title || ''
                    };
                }
            },
            'twitter': /** @lends axl.module.Sharer.services.twitter */ {
                name: '트위터',
                support: detect.PC | detect.MOBILE,
                size: [550, 300],
                url: 'https://twitter.com/intent/tweet?',
                makeParam: function makeParam(data) {
                    data.desc = data.desc || '';

                    var length = 140 - data.url.length - 6,
                        // ... 갯수
                        txt = data.title + ' - ' + data.desc;

                    txt = txt.length > length ? txt.substr(0, length) + '...' : txt;
                    return {
                        text: txt + ' ' + data.url
                    };
                }
            },
            'googleplus': /** @lends axl.module.Sharer.services.googleplus */ {
                name: '구글플러스',
                support: detect.PC | detect.MOBILE,
                size: [400, 420],
                url: 'https://plus.google.com/share?',
                makeParam: function makeParam(data) {
                    return {
                        url: data.url
                    };
                }
            },
            'pinterest': /** @lends axl.module.Sharer.services.pinterest */ {
                name: '핀터레스트',
                support: detect.PC | detect.MOBILE,
                size: [740, 740],
                url: 'https://www.pinterest.com/pin/create/button/?',
                makeParam: function makeParam(data) {
                    return {
                        url: data.url,
                        media: data.image,
                        description: data.desc
                    };
                }
            },
            'linkedin': {
                name: '링크드인',
                support: detect.PC | detect.MOBILE,
                url: 'https://www.linkedin.com/shareArticle?',
                makeParam: function(data) {
                    return {
                        url: data.url,
                        mini: true
                    };
                }
            },
            'kakaotalk': /** @lends axl.module.Sharer.services.kakaotalk */ {
                name: '카카오톡',
                support: detect.APP | detect.MOBILE,
                makeParam: function makeParam(data) {
                    return {
                        msg: data.title + "\n" + (data.desc || ''),
                        url: data.url,
                        appid: "common store",
                        appver: "0.1",
                        type: "link",
                        appname: data.title
                    };
                }
            },
            'kakaostory': /** @lends axl.module.Sharer.services.kakaostory */ {
                name: '카카오스토리',
                support: detect.APP | detect.MOBILE,
                makeParam: function makeParam(data) {
                    return {
                        post: data.title + "\n" + (data.desc || '') + "\n" + data.url,
                        appid: "axl.com",
                        appver: "1.0",
                        apiver: "1.0",
                        appname: data.title
                    };
                }
            },
            'line': /** @lends axl.module.Sharer.services.line */ {
                name: '라인',
                support: detect.APP | detect.MOBILE,
                appUrl: 'http://line.me/R/msg/text/',
                url: 'line://msg/text/',
                store: {
                    android: {
                        intentPrefix: "intent://msg/text/",
                        intentSuffix: "#Intent;scheme=line;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=jp.naver.line.android;end"
                    },
                    ios: "http://itunes.apple.com/jp/app/line/id443904275"
                },
                makeParam: function makeParam(data) {
                    return {};
                }
            },
            'copy_url': {
                support: detect.PC | detect.MOBILE,
                run: function(el) {

                }
            }
        },
        addService: function(name, options) {
            this.services[name] = options;
        },

        /**
         * 전송
         * @param {string} type facebook|twitter|line|kakaotalk|kakaostory|googleplus|pinterest
         * @param {Object} params
         * @param {string} params.url url 주소
         * @param {string} params.title 타이틀
         * @param {string} params.image 이미지
         * @param {string} params.desc 설명
         */
        share: function share(type, params) {
            var service = this.services[type];
            var sizeFeature = '';
            if (!service) {
                return;
            }

            if (service.support & (detect.PC | detect.MOBILE)) {
                if (core.isFunction(service.run)) {
                    service.run(params.target);
                } else {
                    params.url = (params.url + '').replace(/#$/g, '');
                    params.url = params.url || location.href.replace(/#$/g, '');
                    params.title = params.title || document.title;

                    if (service.size) {
                        sizeFeature += ', height=' + service.size[1] + ', width=' + service.size[0];
                    }
                    window.open(service.url + core.json.toQueryString(service.makeParam(params)),
                        type,
                        'menubar=no' + sizeFeature
                    );
                }
            } else if (service.support & detect.APP) {

            }
        },

        _getMetaInfo: function(type, service) {
            var metas = this.options.metas;
            var name = metas[type][service] || type;

            switch (type) {
                case 'title':
                case 'description':
                case 'image':
                    if (core.isFunction(name)) {
                        return name(type, service);
                    } else {
                        return $('head meta').filter('[name$="' + name + '"], ' +
                            '[property$="' + name + '"]').eq(0).attr('content') || '';
                    }
            }

            return '';
        },

        /**
         * 공유하기 실행
         * @param {jQuery|Element|string} el 버튼
         * @param {string} service sns벤더명
         */
        _share: function _share(el, service) {
            var $el = $(el),
                url = ($el.attr('href') || '').replace(/^#/, '') || $el.attr('data-url') || location.href,
                title = $el.attr('data-title') || this._getMetaInfo('title', service) || document.title,
                desc = $el.attr('data-desc') || this._getMetaInfo('description', service) || '',
                image = $el.attr('data-image') || this._getMetaInfo('image', service) || '',
                data;

            this.share(service, data = {
                target: el,
                url: url,
                title: title,
                desc: desc,
                image: image
            });

            data.service = service;
            //this.options.onShrered($el, data);
        },

        init: function init(options) {
            var self = this,
                services = core.object.keys(this.services);

            self.options = core.extend(true, defaultOption, options);

            function hasClass($el) {
                var service;
                core.each(self.services, function(item, svc) {
                    if ($el.hasClass(svc)) {
                        service = svc;
                        return false;
                    }
                });
                return service;
            }

            $(document).on('click.sharer', self.options.selector, function(e) {
                e.preventDefault();

                var $el = $(this),
                    service = '';

                if (self.options.attr === 'class') {
                    service = hasClass($el);
                } else {
                    service = $el.attr(self.options.attr);
                }

                if (self.options.onBeforeShare($el, {
                        service: service
                    }) === false) {
                    return;
                }

                if (!service || !core.array.include(services, service)) {
                    alert('공유할 SNS타입을 지정해주세요.');
                    return;
                }

                self._share($el.get(0), service);
            });
        }
    };

    return Sharer;
});
/*!
 * @module vcui.ui.Accordion
 * @license MIT License
 * @description 아코디온 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/accordion', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var ui = core.ui,
        name = 'accordion',
        eventBeforeCollapse = name + 'beforecollapse',
        eventCollapse = name + 'collapse',
        eventBeforeExpand = name + 'beforeexpand',
        eventExpand = name + 'expand';

    /**
     * @class
     * @description 아코디언 컴포넌트
     * @name vcui.ui.Accordion
     * @extends vcui.ui.View
     */
    var Accordion = ui('Accordion', /**@lends vcui.ui.Accordion# */ {
        $statics: {
            ON_BEFORE_COLLAPSE: eventBeforeCollapse,
            ON_COLLAPSE: eventCollapse,
            ON_BEFORE_EXPAND: eventBeforeExpand,
            ON_EXPAND: eventExpand
        },
        bindjQuery: name,
        defaults: {
            singleOpen: true,
            useAnimate: true,
            openIndex: null,
            duration: 200,
            easing: 'linear',
            autoScroll: false,
            scrollTopOffset: 0,
            activeClass: "active",
            itemClosest: '.ui_accordion_item',
            itemSelector: '>.ui_accordion_item',
            toggleSelector: ">.ui_accordion_toggle",
            contentSelector: ">.ui_accordion_content"
        },

        /**
         * 생성자
         * @param el 모듈 요소
         * @param {object} [options] 옵션(기본값: defaults 속성 참조)
         * @param {boolean} [options.singleOpen = false] 단일열림 / 다중열림 여부
         * @param {number} [options.duration = 200] 펼쳐지거나 닫혀지거나 할 때 애니메이션 속도
         * @param {string} [options.easing = 'linear'] 펼쳐지거나 닫혀지거나 할 때 애니메이션 easing 값
         * @param {string} [options.activeClass = 'active'] 활성화됐을 때 추가할 css 클래스명
         * @param {string} [options.selectedClass = 'on'] 버튼이 토글될 때 추가할 css 클래스명
         * @param {string} [options.itemClosest = 'li']
         * @param {string} [options.itemSelector = '>ul>li']
         * @param {string} [options.toggleSelector = '>.head>.ui_accord_toggle'] 토글버튼
         * @param {string} [options.contentSelector = '>.ui_accord_content'] 컨텐츠
         */
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self._buildARIA();
            self._bindEvent();

            var openIndex = self.options.openIndex;
            if (openIndex === 0 || openIndex) {
                if (openIndex === 'all') {
                    self.expandAll();
                } else {
                    self.collapseAll();
                    var indexes = [].concat(openIndex);
                    if (self.options.singleOpen) {
                        self.expand(indexes[0], false);
                    } else {
                        core.each(indexes, function(index) {
                            self.expand(index, false);
                        });
                    }
                }
            }
        },

        _buildARIA: function _buildARA() {
            var self = this;
            var o = self.options;

            self._updateSelectors();

            self.$el.attr('role', 'presentation');
            self.$items.each(function() {
                var $btn = $(this).find(o.toggleSelector);
                var $content = $(this).find(o.contentSelector);
                var id = core.string.random(10);

                $btn.attr({
                    'id': 'accrod_toggle_' + id,
                    'aria-controls': 'accord_content_' + id,
                    'aria-expanded': $btn.attr('aria-expanded') === 'true'
                }).parent().attr('role', 'presentation');

                $content.attr({
                    'id': 'accord_content_' + id,
                    'role': 'region',
                    'aria-labelledby': 'accord_toggle_' + id
                });
            });
        },

        update: function update() {
            this._buildARIA();
        },

        _updateSelectors: function _updateSelectors() {
            var self = this;
            var o = self.options;

            self.$items = self.$(o.itemSelector);
        },

        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvent: function _bindEvent() {
            var self = this,
                o = self.options;

            // 토글버튼 클릭됐을 때
            self.on("click dblclick", o.itemSelector + o.toggleSelector, function(e) {
                e.preventDefault();

                var $item = $(this).closest(o.itemClosest),
                    $items = self._findItems(),
                    index = $items.index($item);

                if ($item.hasClass(o.activeClass)) {
                    self.collapse(index, self.options.useAnimate);
                } else {
                    self.expand(index, self.options.useAnimate);
                }
            });

            if (o.accordGroup && o.singleOpen) {
                // 아코디언 요소가 따로 떨어져 있는 것을 data-accord-group속성을 묶고,
                // 하나가 열리면 그룹으로 묶여진 다른 아코디언에 열려진게 있으면 닫아준다.
                self.on(eventBeforeExpand, function(e) {
                    $('.ui_accordion[data-accord-group=' + o.accordGroup + '], ' +
                            '.ui_accordion_list[data-accord-group=' + o.accordGroup + ']')
                        .not(self.$el).vcAccordion('collapse')
                        .find(o.itemSelector).removeClass(o.activeClass);
                });
            }
        },

        _findSelected: function _findSelected() {
            return this.$items.filter('.' + self.options.activeClass);
        },

        // 재정의
        _findItems: function _findItems() {
            return this.$items;
        },

        _postCollapse: function _postCollapse(data) {
            var self = this;
        },
        _postExpand: function _postExpand(data) {
            var self = this,
                o = self.options;

            self._autoScroll(data);
        },

        _autoScroll: function _autoScroll(data) {
            var self = this,
                o = self.options,
                $con,
                scrollTop,
                top,
                sto;

            if (o.autoScroll) {
                if (o.autoScroll === true) {
                    $con = $('html, body');
                    scrollTop = $(data.header).offset().top;
                } else {
                    top = $(data.header).position().top;
                    $con = $(o.autoScroll);
                    scrollTop = top + $(o.autoScroll).scrollTop();
                }
                if (typeof o.scrollTopOffset === 'function') {
                    sto = o.scrollTopOffset();
                } else {
                    sto = o.scrollTopOffset;
                }
                $con.animate({
                    scrollTop: scrollTop + sto
                }, 'fast');
            }
        },
        /**
         * @param {number} index 인댁스
         * @param {boolean} isAni 애니메이션 여부
         * @param {function} callback 콜백함수
         * @fires vcui.ui,Accordion#accordion:beforeCollapse
         * @fires vcui.ui,Accordion#accordion:collapse
         */
        collapse: function collapse(index, isAni, cb) {
            var self = this,
                opts = self.options,
                data = {},
                // 애니메이션 시간
                $items = self._findItems(),
                oldItem, oldIndex;

            if (index == null) {
                // index가 안넘어보면 현재 활성화된 패널의 index를 갖고 온다.
                oldItem = $items.filter('.' + opts.activeClass);
                if (oldItem.length) {
                    oldIndex = oldItem.index();
                    index = oldIndex;
                } else {
                    index = oldIndex = -1;
                }
            } else {
                oldItem = $items.eq(index);
                oldIndex = index;
            }

            if (index < 0) {
                return;
            }

            data.index = index;
            data.oldIndex = oldIndex;
            if (oldIndex >= 0) {
                data.header = oldItem.find(opts.toggleSelector);
                data.content = oldItem.find(opts.contentSelector);
            } else {
                data.header = data.content = null;
            }

            /**
             * 닫히기 전에 발생하는 이벤트
             * @event vcui.ui.Accordion#accordionbeforecollapse
             * @type {object}
             * @property {number} index 접혀질 인덱스번호
             */
            var ev = $.Event(eventBeforeCollapse);
            self.$el.triggerHandler(ev, data);
            if (ev.isDefaultPrevented()) {
                return;
            }

            if (typeof isAni === 'undefined') {
                isAni = self.options.useAnimate;
            }

            /**
             * 닫힌 후에 발생하는 이벤트
             * @event vcui.ui.Accordion#accordioncollapse
             * @type {object}
             * @property {number} index 닫힌 인덱스 번호
             */
            if (isAni !== false) {
                // 애니메이션 모드
                //if(this.isAnimate) { return; }
                self._updateButton(index, false);
                data.content.slideUp(opts.duration, opts.easing, function() {
                    // 닫혀진 후에 이벤트 발생
                    self.trigger(eventCollapse, data);
                    self._postCollapse(data);
                    oldItem.removeClass(opts.activeClass);
                    cb && cb();
                });
            } else {
                // 일반 모드
                data.content.hide();
                // 닫혀진 후에 이벤트 발생
                self.trigger(eventCollapse, data);
                self._updateButton(index, false);
                self._postCollapse(data);
                oldItem.removeClass(opts.activeClass);
                cb && cb();
            }
        },

        /**
         * 확장시키기
         * @param {number} index 인댁스
         * @param {boolean} isAni 애니메이션 여부
         * @param {function} callback 콜백함수
         * @fires vcui.ui,Accordion#accordion:beforeExpand
         * @fires vcui.ui,Accordion#accordion:expand
         */
        expand: function expand(index, isAni, callback) {
            var self = this,
                opts = self.options,
                $items,
                oldItem,
                oldIndex,
                newItem,
                data;

            if (arguments.length === 0) {
                return;
            }

            $items = self._findItems();
            newItem = $items.eq(index);

            oldItem = $items.filter('.' + opts.activeClass);
            oldIndex = oldItem.index();

            if (index === oldIndex) {
                return;
            }

            data = {
                index: index,
                header: newItem,
                content: newItem.find(opts.contentSelector)
            };

            if (oldIndex >= 0) {
                data.oldHeader = oldItem.find(opts.toggleSelector);
                data.oldContent = oldItem.find(opts.contentSelector);
                data.oldIndex = oldIndex;
            }

            /**
             * 열리기 전에 이벤트 발생
             * @event vcui.ui.Accordion#accordionbeforeexpand
             * @type {object}
             * @property {number} index 열린 인덱스
             */
            var ev = $.Event(eventBeforeExpand);
            self.trigger(ev, data);
            if (ev.isDefaultPrevented()) {
                return;
            }

            if (typeof isAni === 'undefined') {
                isAni = self.options.useAnimate;
            }

            /**
             * @event vcui.ui.Accordion#accordionexpand
             * @type {object}
             * @property {number} index 열린 인덱스.
             */
            if (isAni !== false) {
                // 애니메이션 사용
                self.isAnimate = true;
                if (opts.singleOpen && data.oldHeader) {
                    // 하나만 열리는 모드
                    self._updateButton(data.oldIndex, false);
                    data.oldContent.slideUp(opts.duration, opts.easing, function() {
                        callback && callback();
                    });
                }
                self._updateButton(index, true);
                data.content.slideDown(opts.duration, opts.easing, function() {
                    self.isAnimate = false;
                    // 열려진 후에 이벤트 발생
                    self.trigger(eventExpand, data);
                    self._postExpand(data);
                    newItem.addClass(opts.activeClass);
                    callback && callback();
                });
            } else {
                // 에니메이션 미사용
                if (opts.singleOpen && data.oldHeader) {
                    // 하나만 열리는 모드
                    data.oldContent.hide();
                }
                data.content.show();

                // 열려진 후에 이벤트 발생
                self.trigger(eventExpand, data);
                self._updateButton(index, true);
                self._postExpand(data);
                newItem.addClass(opts.activeClass);
                callback && callback();
            }
        },

        getActivate: function getActivate() {
            var self = this,
                o = self.options,
                item = self._findItems().filter('.' + o.activeClass);

            if (item.length === 0) {
                return {
                    index: -1,
                    header: null,
                    content: null
                };
            } else {
                return {
                    index: item.index(),
                    header: item,
                    content: item.find(o.contentSelector)
                };
            }
        },

        /* _updateButton: function _updateButton(index, toggle) {
            var self = this,
            options = self.options,
            activeClass = options.activeClass,
            $item = self._findItems().eq(index),
            $btn = $item.find(options.toggleSelector);
            $item.toggleClass(activeClass, toggle);
            $btn.attr('aria-expanded', !!toggle).text(toggle ? core.i18n('close') : core.i18n('open'));
        }, */

        _updateButton: function _updateButton(index, toggle) {
            var options = this.options;
            var $item = this._findItems().eq(index);
            $item.toggleClass(options.activeClass, toggle);

            var $btn = $item.find(options.toggleSelector);
            if ($btn.is('a')) {
                if (toggle) {
                    $btn.find('.ui_accord_text').html(function() {
                        return $btn.attr('data-close-text');
                    });
                } else {
                    $btn.find('.ui_accord_text').html(function() {
                        return $btn.attr('data-open-text');
                    });
                }
            } else {
                if (toggle) {
                    $btn.find('.ui_accord_text').html(function() {
                        return $btn.attr('data-close-text');
                    });

                } else {
                    $btn.find('.ui_accord_text').html(function() {
                        return $btn.attr('data-open-text');
                    });
                }
            }

            $btn.attr('aria-expanded', !!toggle);
        },

        collapseAll: function collapseAll() {
            var self = this,
                count = self._findItems().length;

            self.collapseMode = 'all';
            for (var i = 0; i < count; i++) {
                self.collapse(i, false);
            }
            self.collapseMode = null;
        },

        expandAll: function expandAll() {
            if (this.options.singleOpen) {
                return;
            }
            var self = this,
                count = self._findItems().length;

            self.expandMode = 'all';
            for (var i = 0; i < count; i++) {
                self.expand(i, false);
            }
            self.expandMode = null;
        }
    });

    return Accordion;
});
$.fn.buildCommonUI = function() {
    // $('body').buildCommonUI()로 호출하면 해당요소 안에 있는
    // 아래에 기술된 모듈들이 한번에 빌드된다.(자주 쓰이는 UI모듈은 이렇게 하는게 효율적이다)
    vcui.require(['ui/accordion', 'ui/dropdown', 'ui/tab'], function() {
        // dropdown은 호출안해도 됨

        this.find('.ui_accordion').vcAccordion();
        this.find('.ui_tab').vcTab();
        this.find('.ui_dropdown').vcDropdown();
    }.bind(this));
    return this;
};
/*!
 Version: 1.7.1
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
/* global window, document, define, jQuery, setInterval, clearInterval */
/*!
 * @module vcui.ui.Carousel
 * @license MIT License
 * @description 캐로우셀 컴포넌트
 * @copyright VinylC UID Group.
 */
define('ui/carousel', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var prefixModule = 'ui_carousel_';
    var _N = 'carousel';
    var _V = {
        INDEX: prefixModule + 'index',
        ACTIVE: 'on', //'slick-active',
        ARROW: prefixModule + 'arrow',
        INITIALIZED: prefixModule + 'initialized',
        PLAY: prefixModule + 'play',
        HIDDEN: prefixModule + 'hidden',
        DISABLED: 'disabled',
        DOTS: prefixModule + 'dots',
        SLIDE: prefixModule + 'slide',
        SLIDER: prefixModule + 'slider',
        CLONED: prefixModule + 'cloned',
        TRACK: prefixModule + 'track',
        LIST: prefixModule + 'list',
        LOADING: prefixModule + 'loading',
        CENTER: prefixModule + 'center',
        VISIBLE: prefixModule + 'visible',
        CURRENT: prefixModule + 'current',
        SRONLY: 'sr_only',
        PREV: prefixModule + 'prev',
        NEXT: prefixModule + 'next',

        UNBUILD: 'unbuild'
    };

    function addEventNS(str) {
        var pairs = str.split(' ');
        for (var i = -1, item; item = pairs[++i];) {
            pairs[i] = item + '.' + _N;
        }
        return pairs.join(' ');
    }

    var REGEX_HTML = /^(?:\s*(<[\w\W]+>)[^>]*)$/;
    var instanceUid = 0;
    var componentInitials = {
        animating: false,
        dragging: false,
        autoPlayTimer: null,
        currentDirection: 0,
        currentLeft: null,
        currentSlide: 0,
        direction: 1,
        $dots: null,
        listWidth: null,
        listHeight: null,
        loadIndex: 0,
        $nextArrow: null,
        $prevArrow: null,
        $playButton: null,
        scrolling: false,
        slideCount: null,
        slideWidth: null,
        $slideTrack: null,
        $slides: null,
        sliding: false,
        slideOffset: 0,
        swipeLeft: null,
        swiping: false,
        $list: null,
        touchObject: {},
        transformsEnabled: false,
        unbuilded: false
    };

    var Carousel = core.ui('Carousel', {
        bindjQuery: _N,
        defaults: {
            activeClass: _V.ACTIVE, // 활성 css 클래스
            dotsSelector: '.' + _V.DOTS, // 인디케이터 셀렉터
            playSelector: '.' + _V.PLAY, // 재생 버튼 셀렉터
            carouselTitle: '', // 제목

            accessibility: true, // 접근성 속성(aria-)들을 붙일것인가
            adaptiveHeight: false, // 높이를 유동적으로 할것인가
            appendArrows: '.' + _V.ARROW, // 좌우 버튼을 넣을 요소
            appendDots: '.' + _V.DOTS, // 인디케이터를 넣을 요소
            arrows: true, // 좌우버튼을 표시할 것인가
            arrowsUpdate: 'disabled', // or 'toggle', 좌우버튼이 비활성화될 때 처리할 방식
            asNavFor: null, // 두 Carousel간에 연동할 때 다른 Carousel 객체
            prevArrow: '.' + _V.PREV, // 이전 버튼 셀렉터
            nextArrow: '.' + _V.NEXT, // 이후 버튼 셀렉터
            autoplay: false, // 자동 재생 여부
            autoplaySpeed: 5000, // 자동 재생 속도
            centerMode: false, // 활성화된 슬라이드를 가운데에 위치시킬 것인가...
            centerPadding: '50px', // centerMode가 true일 때 슬라이드간의 간격
            cssEase: 'ease', // css ease
            customPaging: function customPaging(carousel, i) { // 인디케이터 버튼 마크업
                return $('<button type="button" />').text(i + 1);
            },
            dots: true, // 인디케이터 사용 여부
            buildDots: true,

            dotsClass: _V.DOTS, // 인디케이터 css 클래스
            draggable: true, // 마우스로 슬라이드가 되도록 허용할 것인가
            easing: 'linear', // slide easing 타입
            edgeFriction: 0.35, // infinite:false일 때 끝에 다다랐을 때의 바운싱 효과 크기
            fade: false, // 슬라이딩이 아닌 fade in/out으로 할 것인가
            focusOnSelect: false, // 선택한 요소에 포커싱 사용
            focusOnChange: false, // 활성화후에 포커싱시킬 것인가
            infinite: true, // 무한루프 사용 여부
            initialSlide: 0, // 처음 로딩시에 활성화시킬 슬라이드 인덱스
            autoScrollActive: false, // 처음 로딘시 on클래스가 있는 슬라이드로 슬라이드 시킬 것인가
            lazyLoad: 'ondemand', // or progressive. 지연로딩 방식을 설정
            mobileFirst: false, // 반응형 모드일 때 모바일 사이즈를 우선으로 할 것인가
            pauseOnHover: true, // 마우스가 들어왔을 때 잠시 자동재생을 멈출 것인가
            pauseOnFocus: true, // 포커싱됐을 때 잠시 자동재생을 멈출 것인가
            pauseOnDotsHover: false, // 인디케이터 영역에 마우스가 들어왔을 때 잠시 자동재생을 멈출 것인가
            respondTo: 'window', // 반응형모드일 때 어느 요소의 사이즈에 맞출 것인가
            responsive: null, // 브레이크포인트에 따른 설정값들
            rows: 1, // 1보가 크면 그리드모양으로 배치된다.
            rtl: false, // right to left
            slide: '.' + _V.TRACK + '>*', // 슬라이드 셀렉터
            slidesPerRow: 1, // rows가 1보다 클 경우 행별 슬라이드 수
            slidesToShow: 1, // 표시할 슬라이드 수
            slidesToScroll: 1, // 슬라이딩될 때 한번에 움직일 갯수
            speed: 800, // 슬라이딩 속도
            swipe: true, // 스와이핑 허용 여부
            swipeToSlide: false, // 사용자가 slidesToScroll과 관계없이 슬라이드로 직접 드래그 또는 스 와이프 할 수 있도록 허용
            touchMove: true, // 터치로 슬라이드 모션 사용
            touchThreshold: 5, // 슬라이드를 진행하려면 사용자는 슬라이더의 너비 (1 / touchThreshold) * 너비를 스 와이프해야합니다
            useCSS: true, // CSS 전환 활성화 / 비활성화
            useTransform: true, // CSS 변환 활성화 / 비활성화
            variableWidth: false, // 가변 너비 슬라이드
            vertical: false, // 세로 슬라이드 모드
            verticalSwiping: false, // 수직 스 와이프 모드
            preventVertical: false, // 슬라이딩 할 때 수직으로 움직이는 걸 막을 것인가.
            waitForAnimate: true, // 애니메이션을 적용하는 동안 슬라이드를 앞으로 이동하라는 요청을 무시합니다.
            zIndex: 1000, // 슬라이드의 zIndex 값 설정, IE9 이하의 경우 유용함
            activeHover: false,
            additionWidth: 0 // 모듈이 내부 너비를 제대로 계산 못할 때 가감할 너비를 설정
        },
        initialize: function initialize(element, options) {

            var self = this;
            var $el = $(element);

            if ($el.find('.' + _V.TRACK + '>*').length <= 1) {
                $el.find('.' + _V.NEXT + ', .' + _V.PREV + ', .' + _V.DOTS + ', .' + _V.PLAY).hide();
                return;
            }

            if (self.supr(element, options) === false) {
                return;
            }

            core.extend(self, componentInitials);
            if (!self.options.activeClass) {
                self.options.activeClass = _V.ACTIVE;
            }

            self.activeBreakpoint = null;
            self.animType = null;
            self.animProp = null;
            self.breakpoints = [];
            self.breakpointSettings = [];
            self.cssTransitions = false;
            // self.focussed = false;
            self.inactive = false;
            self.interrupted = false;
            self.paused = true;
            self.positionProp = null;
            self.respondTo = null;
            self.rowCount = 1;
            self.shouldClick = true;
            self.$slider = $(element);
            self.$slidesCache = null;
            self.transformType = null;
            self.transitionType = null;
            self.hidden = 'hidden';
            self.visibilityChange = 'visibilitychange';
            self.windowWidth = 0;
            self.windowTimer = null;
            self.currentSlide = self.options.initialSlide;
            self.originalSettings = self.options;

            if (typeof document.mozHidden !== 'undefined') {
                self.hidden = 'mozHidden';
                self.visibilityChange = 'mozvisibilitychange';
            } else if (typeof document.webkitHidden !== 'undefined') {
                self.hidden = 'webkitHidden';
                self.visibilityChange = 'webkitvisibilitychange';
            }

            self.autoPlay = self.autoPlay.bind(self);
            self.autoPlayClear = self.autoPlayClear.bind(self);
            self.autoPlayIterator = self.autoPlayIterator.bind(self);
            self.changeSlide = self.changeSlide.bind(self);
            self.clickHandler = self.clickHandler.bind(self);
            self.selectHandler = self.selectHandler.bind(self);
            self.setPosition = self.setPosition.bind(self);
            self.swipeHandler = self.swipeHandler.bind(self);
            self.keyHandler = self.keyHandler.bind(self);

            self.instanceUid = instanceUid++;

            // A simple way to check for HTML strings
            // Strict HTML recognition (must start with <)
            // Extracted from jQuery v1.11 source
            self.htmlExpr = REGEX_HTML;
            self.$el.css('visibility', 'visible');

            self.registerBreakpoints();
            self.init(true);
        },
        activateADA: function activateADA(flag) {
            var self = this;
            var opt = self.options;

            self.$slideTrack.find('.' + opt.activeClass + ', .ui_carousel_current, .ui_carousel_center').attr({
                'aria-hidden': 'false'
            }).find('a, input, button, select').attr({
                'tabindex': ''
            });
        },
        addSlide: function addSlide(markup, index, addBefore) {

            var self = this;
            var opt = self.options;

            if (typeof index === 'boolean') {
                addBefore = index;
                index = null;
            } else if (index < 0 || index >= self.slideCount) {
                return false;
            }

            self.unload();

            if (typeof index === 'number') {
                if (index === 0 && self.$slides.length === 0) {
                    $(markup).appendTo(self.$slideTrack);
                } else if (addBefore) {
                    $(markup).insertBefore(self.$slides.eq(index));
                } else {
                    $(markup).insertAfter(self.$slides.eq(index));
                }
            } else {
                if (addBefore === true) {
                    $(markup).prependTo(self.$slideTrack);
                } else {
                    $(markup).appendTo(self.$slideTrack);
                }
            }

            self.$slides = self.$slideTrack.children(opt.slide);
            // comahead
            self.$slides.css('float', 'left');

            self.$slideTrack.children(opt.slide).detach();

            self.$slideTrack.append(self.$slides);

            self.$slides.each(function(index, element) {
                $(element).attr('data-' + _V.INDEX, index);
            });

            self.$slidesCache = self.$slides;

            self.reinit();
        },
        animateHeight: function animateHeight() {
            var self = this;
            var opt = self.options;

            if (opt.slidesToShow === 1 && opt.adaptiveHeight === true && opt.vertical === false) {
                var targetHeight = self.$slides.eq(self.currentSlide).outerHeight(true);
                self.$list.animate({
                    height: targetHeight
                }, opt.speed);
            }
        },
        animateSlide: function animateSlide(targetLeft, callback) {

            var animProps = {},
                self = this,
                opt = self.options;

            self.animateHeight();

            if (opt.rtl === true && opt.vertical === false) {
                targetLeft = -targetLeft;
            }
            if (self.transformsEnabled === false) {
                if (opt.vertical === false) {
                    self.$slideTrack.animate({
                        left: targetLeft
                    }, opt.speed, opt.easing, callback);
                } else {
                    self.$slideTrack.animate({
                        top: targetLeft
                    }, opt.speed, opt.easing, callback);
                }
            } else {

                if (self.cssTransitions === false) {
                    if (opt.rtl === true) {
                        self.currentLeft = -self.currentLeft;
                    }
                    $({
                        animStart: self.currentLeft
                    }).animate({
                        animStart: targetLeft
                    }, {
                        duration: opt.speed,
                        easing: opt.easing,
                        step: function step(now) {
                            now = Math.ceil(now);
                            if (opt.vertical === false) {
                                animProps[self.animType] = 'translate(' + now + 'px, 0px)';
                                self.$slideTrack.css(animProps);
                            } else {
                                animProps[self.animType] = 'translate(0px,' + now + 'px)';
                                self.$slideTrack.css(animProps);
                            }
                        },
                        complete: function complete() {
                            if (callback) {
                                callback.call();
                            }
                        }
                    });
                } else {

                    self.applyTransition();
                    targetLeft = Math.ceil(targetLeft);

                    if (opt.vertical === false) {
                        animProps[self.animType] = 'translate3d(' + targetLeft + 'px, 0px, 0px)';
                    } else {
                        animProps[self.animType] = 'translate3d(0px,' + targetLeft + 'px, 0px)';
                    }
                    self.$slideTrack.css(animProps);

                    if (callback) {
                        setTimeout(function() {

                            self.disableTransition();

                            callback.call();
                        }, opt.speed);
                    }
                }
            }
        },
        getNavTarget: function getNavTarget() {

            var self = this,
                opt = self.options,
                asNavFor = opt.asNavFor;

            if (asNavFor && asNavFor !== null) {
                asNavFor = $(asNavFor).not(self.$slider);
            }

            return asNavFor;
        },
        asNavFor: function asNavFor(index) {

            var self = this,
                asNavFor = self.getNavTarget();

            if (asNavFor !== null && (typeof asNavFor === 'undefined' ? 'undefined' : _typeof(asNavFor)) === 'object') {
                asNavFor.each(function() {
                    var target = $(this).vcCarousel('instance');
                    if (!target.unbuilded) {
                        target.slideHandler(index, true);
                    }
                });
            }
        },
        applyTransition: function applyTransition(slide) {

            var self = this,
                transition = {},
                opt = self.options;

            if (opt.fade === false) {
                transition[self.transitionType] = self.transformType + ' ' + opt.speed + 'ms ' + opt.cssEase;
            } else {
                transition[self.transitionType] = 'opacity ' + opt.speed + 'ms ' + opt.cssEase;
            }

            if (opt.fade === false) {
                self.$slideTrack.css(transition);
            } else {
                self.$slides.eq(slide).css(transition);
            }
        },
        autoPlay: function autoPlay() {

            var self = this;
            var opt = self.options;

            self.autoPlayClear();

            if (!self.options.autoplay) {
                return;
            }

            if (self.slideCount > opt.slidesToShow) {
                self.autoPlayTimer = setInterval(self.autoPlayIterator, opt.autoplaySpeed);
            }
        },
        autoPlayClear: function autoPlayClear() {

            var self = this;

            if (self.autoPlayTimer) {
                clearInterval(self.autoPlayTimer);
            }
        },
        autoPlayIterator: function autoPlayIterator() {

            var self = this,
                opt = self.options,
                slideTo = self.currentSlide + opt.slidesToScroll;

            if (!self.paused && !self.interrupted && self.inactive /*!self.focussed*/ ) {

                if (opt.infinite === false) {

                    if (self.direction === 1 && self.currentSlide + 1 === self.slideCount - 1) {
                        self.direction = 0;
                    } else if (self.direction === 0) {

                        slideTo = self.currentSlide - opt.slidesToScroll;

                        if (self.currentSlide - 1 === 0) {
                            self.direction = 1;
                        }
                    }
                }

                self.slideHandler(slideTo);
            }
        },
        buildArrows: function buildArrows() {

            var self = this,
                opt = self.options,
                $p,
                $n;

            if (opt.arrows === true) {
                $p = self.$prevArrow = self.$(opt.prevArrow).addClass(_V.ARROW).attr('title', '이전 슬라이드 보기');
                $n = self.$nextArrow = self.$(opt.nextArrow).addClass(_V.ARROW).attr('title', '다음 슬라이드 보기');

                if (self.slideCount > opt.slidesToShow) {

                    $p.removeClass(_V.HIDDEN).removeAttr('aria-hidden tabindex');
                    $n.removeClass(_V.HIDDEN).removeAttr('aria-hidden tabindex');

                    if (self.htmlExpr.test(opt.prevArrow)) {
                        $p.prependTo(opt.appendArrows);
                    }

                    if (self.htmlExpr.test(opt.nextArrow)) {
                        $n.appendTo(opt.appendArrows);
                    }

                    if (opt.infinite !== true) {
                        $p.addClass(_V.DISABLED)
                            .prop('disabled', true)
                            .attr('aria-disabled', 'true')
                            .attr('title', '더이상 이전 슬라이드가 없습니다.');
                    }
                } else {

                    $p.add($n).addClass(_V.HIDDEN).attr({
                        'aria-disabled': 'true',
                        'tabindex': '-1'
                    });
                }
            }
        },
        buildDots: function buildDots() {

            var self = this,
                opt = self.options,
                i,
                dots,
                dot,
                cloned;

            if (opt.dots === true) {

                //self.$slider.addClass(_V.DOTS);

                if (opt.dotsSelector) {
                    dots = self.$slider.find(opt.dotsSelector).show().addClass('ui_static');
                    if (opt.buildDots === false) {
                        self.$dots = dots;
                        dots.find('li').removeClass(opt.activeClass).first().addClass(opt.activeClass);
                        return;
                    }

                    if (dots.children().length || self.staticDot) {
                        if (self.staticDot) {
                            dot = self.staticDot;
                        } else {
                            dot = dots.children().first();
                            self.staticDot = dot;
                        }
                        dots.empty();
                        if (!opt.carouselTitle) {
                            opt.carouselTitle = dot.find('.' + _V.SRONLY).text();
                        }
                        for (i = 0; i <= self.getDotCount(); i += 1) {
                            dots.append(cloned = dot.clone().removeClass(opt.activeClass));
                            cloned.html(dot.html().replace(/{{no}}/, i + 1));
                        }
                        dot = null;
                    } else {
                        for (i = 0; i <= self.getDotCount(); i += 1) {
                            dots.append($('<li />').append(opt.customPaging.call(this, self, i)));
                        }
                    }
                } else {
                    dots = $('<ul />');
                    dots.addClass(opt.dotsClass);
                    dots.appendTo(opt.appendDots);
                    for (i = 0; i <= self.getDotCount(); i += 1) {
                        dots.append($('<li />').append(opt.customPaging.call(this, self, i)));
                    }
                }
                self.$dots = dots;
                dots.find('li').first().addClass(opt.activeClass);
            } else {
                self.$dots = $();
            }
        },
        buildOut: function buildOut() {

            var self = this,
                opt = self.options;

            self.$slides = self.$slider.find(opt.slide + ':not(' + _V.CLONED + ')').addClass(_V.SLIDE);
            // comahead
            self.$slides.css('float', 'left');

            self.slideCount = self.$slides.length;

            self.$slides.each(function(index, element) {
                $(element).attr('data-' + _V.INDEX, index).data('originalStyling', $(element).attr('style') || '');
            });

            self.$slider.attr('role', 'toolbar').addClass(_V.SLIDER);

            if ((self.$slideTrack = self.$slider.find('.' + _V.TRACK)).length === 0) {
                self.$slideTrack = self.slideCount === 0 ? $('<div class="' + _V.TRACK + '"/>').appendTo(self.$slider) : self.$slides.wrapAll('<div class="' + _V.TRACK + '"/>').parent();
            } else {
                self.$slideTrack.addClass('ui_static');
            }

            if ((self.$list = self.$slider.find('.' + _V.LIST)).length === 0) {
                self.$list = self.$slideTrack.wrap('<div class="' + _V.LIST + '"/>').parent();
            } else {
                self.$list.addClass('ui_static');
            }

            self.$list.css('overflow', 'hidden');
            self.$slideTrack /*.attr('role', 'listbox')*/ .css('opacity', 0);

            if (opt.centerMode === true || opt.swipeToSlide === true) {
                opt.slidesToScroll = 1;
            }

            $('img[data-lazy]', self.$slider).not('[src]').addClass(_V.LOADING);

            self.setupInfinite();

            self.buildArrows();

            self.buildDots();

            self.updateDots();

            self.setSlideClasses(typeof self.currentSlide === 'number' ? self.currentSlide : 0);

            if (opt.draggable === true) {
                self.$list.addClass('draggable');
            }
        },
        buildRows: function buildRows() {

            var self = this,
                opt = self.options,
                a,
                b,
                c,
                newSlides,
                numOfSlides,
                originalSlides,
                slidesPerSection;

            newSlides = document.createDocumentFragment();
            originalSlides = self.$slider.children();

            if (opt.rows > 1) {

                slidesPerSection = opt.slidesPerRow * opt.rows;
                numOfSlides = Math.ceil(originalSlides.length / slidesPerSection);

                for (a = 0; a < numOfSlides; a++) {
                    var slide = document.createElement('div');
                    for (b = 0; b < opt.rows; b++) {
                        var row = document.createElement('div');
                        for (c = 0; c < opt.slidesPerRow; c++) {
                            var target = a * slidesPerSection + (b * opt.slidesPerRow + c);
                            if (originalSlides.get(target)) {
                                row.appendChild(originalSlides.get(target));
                            }
                        }
                        slide.appendChild(row);
                    }
                    newSlides.appendChild(slide);
                }

                self.$slider.empty().append(newSlides);
                self.$slider.children().children().children().css({
                    'width': 100 / opt.slidesPerRow + '%',
                    'display': 'inline-block'
                });
            }
        },

        _getTargetBreakpoint: function _getTargetBreakpoint() {
            var self = this,
                b = self.breakpoints,
                breakpoint,
                respondToWidth,
                targetBreakpoint = null;

            switch (self.responseTo) {
                case 'carousel':
                    respondToWidth = self.$slider.width();
                    break;
                case 'min':
                    respondToWidth = Math.min(window.innerWidth || $(window).width(), self.$slider.width());
                    break;
                default:
                    respondToWidth = window.innerWidth || $(window).width();
                    break;
            }

            for (breakpoint in b) {
                if (b.hasOwnProperty(breakpoint)) {
                    if (self.originalSettings.mobileFirst === false) {
                        if (respondToWidth < b[breakpoint]) {
                            targetBreakpoint = b[breakpoint];
                        }
                    } else {
                        if (respondToWidth > b[breakpoint]) {
                            targetBreakpoint = b[breakpoint];
                        }
                    }
                }
            }
            return targetBreakpoint;
        },

        checkResponsive: function checkResponsive(initial, forceUpdate) {

            var self = this,
                opt = self.options,
                bs = self.breakpointSettings,
                targetBreakpoint,
                triggerBreakpoint = false;

            if (opt.responsive && opt.responsive.length) {

                targetBreakpoint = self._getTargetBreakpoint();

                if (targetBreakpoint !== null) {
                    if (self.activeBreakpoint !== null) {
                        if (targetBreakpoint !== self.activeBreakpoint || forceUpdate) {
                            self.activeBreakpoint = targetBreakpoint;
                            if (bs[targetBreakpoint] === _V.UNBUILD) {
                                self.unbuild(targetBreakpoint);
                            } else {
                                self.options = opt = $.extend({}, self.originalSettings, bs[targetBreakpoint]);
                                if (initial === true) {
                                    self.currentSlide = opt.initialSlide;
                                }

                                self.refresh(initial);
                            }
                            triggerBreakpoint = targetBreakpoint;
                        }
                    } else {
                        self.activeBreakpoint = targetBreakpoint;
                        if (bs[targetBreakpoint] === _V.UNBUILD) {
                            self.unbuild(targetBreakpoint);
                        } else {
                            self.options = $.extend({}, self.originalSettings, bs[targetBreakpoint]);
                            if (initial === true) {
                                self.currentSlide = opt.initialSlide;
                            }
                            self.refresh(initial);
                        }
                        triggerBreakpoint = targetBreakpoint;
                    }
                } else {
                    if (self.activeBreakpoint !== null) {
                        self.activeBreakpoint = null;
                        self.options = opt = self.originalSettings;
                        if (initial === true) {
                            self.currentSlide = opt.initialSlide;
                        }
                        self.refresh(initial);
                        triggerBreakpoint = targetBreakpoint;
                    }
                }

                // only trigger breakpoints during an actual break. not on initialize.
                if (!initial && triggerBreakpoint !== false) {
                    self.triggerHandler(_N + 'breakpoint', [self, triggerBreakpoint]);
                }
            }
        },
        changeSlide: function changeSlide(event, dontAnimate) {

            var self = this,
                opt = self.options,
                $target = $(event.currentTarget),
                indexOffset,
                slideOffset,
                unevenOffset;

            // If target is a link, prevent default action.
            if ($target.is('a')) {
                event.preventDefault();
            }

            // If target is not the <li> element (ie: a child), find the <li>.
            if (!$target.is('li')) {
                $target = $target.closest('li');
            }

            unevenOffset = self.slideCount % opt.slidesToScroll !== 0;
            indexOffset = unevenOffset ? 0 : (self.slideCount - self.currentSlide) % opt.slidesToScroll;

            switch (event.data.message) {

                case 'previous':
                    slideOffset = indexOffset === 0 ? opt.slidesToScroll : opt.slidesToShow - indexOffset;
                    if (self.slideCount > opt.slidesToShow) {
                        self.slideHandler(self.currentSlide - slideOffset, false, dontAnimate);
                    }
                    break;

                case 'next':
                    slideOffset = indexOffset === 0 ? opt.slidesToScroll : indexOffset;
                    if (self.slideCount > opt.slidesToShow) {
                        self.slideHandler(self.currentSlide + slideOffset, false, dontAnimate);
                    }
                    break;

                case 'index':
                    var index = event.data.index === 0 ? 0 : event.data.index || $target.index() * opt.slidesToScroll;

                    self.slideHandler(self.checkNavigable(index), false, dontAnimate);
                    //comahead: $target.children().trigger('focus');
                    break;

                default:
                    return;
            }
        },
        checkNavigable: function checkNavigable(index) {

            var self = this,
                opt = self.options,
                navigables,
                prevNavigable;

            navigables = self.getNavigableIndexes();
            prevNavigable = 0;
            if (index > navigables[navigables.length - 1]) {
                index = navigables[navigables.length - 1];
            } else {
                for (var n in navigables) {
                    if (index < navigables[n]) {
                        index = prevNavigable;
                        break;
                    }
                    prevNavigable = navigables[n];
                }
            }

            return index;
        },
        cleanUpEvents: function cleanUpEvents() {

            var self = this,
                opt = self.options;

            if (opt.dots && self.$dots !== null) {

                $('li', self.$dots).off('click.' + _N, self.changeSlide).off('mouseenter.' + _N).off('mouseleave.' + _N);

                if (opt.accessibility === true) {
                    self.$dots.off('keydown.' + _N, self.keyHandler);
                }
            }

            self.$slider.off('focus.' + _N + ' blur.' + _N);

            if (opt.arrows === true && self.slideCount > opt.slidesToShow) {
                self.$prevArrow && self.$prevArrow.off('click.' + _N, self.changeSlide);
                self.$nextArrow && self.$nextArrow.off('click.' + _N, self.changeSlide);
            }

            self.$list.off('touchstart.' + _N + ' mousedown.' + _N, self.swipeHandler);
            self.$list.off('touchmove.' + _N + ' mousemove.' + _N, self.swipeHandler);
            self.$list.off('touchend.' + _N + ' mouseup.' + _N, self.swipeHandler);
            self.$list.off('touchcancel.' + _N + ' mouseleave.' + _N, self.swipeHandler);

            self.$list.off('click.' + _N, self.clickHandler);

            $(document).off(self.visibilityChange, self.visibility);

            self.cleanUpSlideEvents();

            if (opt.accessibility === true) {
                self.$list.off('keydown.' + _N, self.keyHandler);
            }

            if (opt.focusOnSelect === true) {
                $(self.$slideTrack).children().off('click.' + _N, self.selectHandler);
            }

            $(window).off('orientationchange.' + _N + '-' + self.instanceUid, self.orientationChange);

            $(window).off('resize.' + _N + '-' + self.instanceUid, self.resize);

            $('[draggable!=true]', self.$slideTrack).off('dragstart', self.preventDefault);

            $(window).off('load.' + _N + '-' + self.instanceUid, self.setPosition);
            $(document).off('ready.' + _N + '-' + self.instanceUid, self.setPosition);
        },
        cleanUpSlideEvents: function cleanUpSlideEvents() {

            var self = this,
                opt = self.options;

            self.$list.off('mouseenter.' + _N);
            self.$list.off('mouseleave.' + _N);
        },
        cleanUpRows: function cleanUpRows() {

            var self = this,
                opt = self.options,
                originalSlides;

            if (opt.rows > 1) {
                originalSlides = self.$slides.children().children();
                originalSlides.removeAttr('style');
                self.$slider.empty().append(originalSlides);
            }
        },
        clickHandler: function clickHandler(event) {

            var self = this,
                opt = self.options;

            if (self.shouldClick === false) {
                event.stopImmediatePropagation();
                event.stopPropagation();
                event.preventDefault();
            }
        },
        destroy: function destroy(refresh) {

            var self = this,
                opt = self.options;

            self.autoPlayClear();

            self.touchObject = {};

            self.cleanUpEvents();

            $(_V.CLONED, self.$slider).detach();

            if (self.$dots) {
                if (self.$dots.hasClass('ui_static')) {
                    self.$dots.empty().removeClass('ui_static');
                } else {
                    self.$dots.remove();
                }
            }

            if (self.$prevArrow && self.$prevArrow.length) {

                self.$prevArrow.removeClass(_V.DISABLED + ' ' + _V.ARROW + ' ' + _V.HIDDEN).prop('disabled', false).removeAttr('aria-hidden aria-disabled tabindex').css('display', '');

                if (self.htmlExpr.test(opt.prevArrow)) {
                    self.$prevArrow.remove();
                }
            }

            if (self.$nextArrow && self.$nextArrow.length) {

                self.$nextArrow.removeClass(_V.DISABLED + ' ' + _V.ARROW + ' ' + _V.HIDDEN).prop('disabled', false).removeAttr('aria-hidden aria-disabled tabindex').css('display', '');

                if (self.htmlExpr.test(opt.nextArrow)) {
                    self.$nextArrow.remove();
                }
            }

            if (self.$slides) {

                var isMarkuped = self.$slideTrack.hasClass('ui_static');
                // comahead
                self.$slides.css('float', '');

                self.$slides.removeClass(_V.SLIDE + ' ' + opt.activeClass + ' ' + _V.CENTER + ' ' + _V.VISIBLE + ' ' + _V.CURRENT)
                    .removeAttr('aria-hidden data-' + _V.INDEX + ' tabindex role')
                    .each(function() {
                        $(this).attr('style', $(this).data('originalStyling'));
                    });

                if (isMarkuped) {
                    self.$list.off().removeClass('ui_static');
                    self.$slideTrack.attr('style', '').off().removeClass('ui_static');
                    self.$slideTrack.empty().append(self.$slides);
                } else {
                    self.$slideTrack.children(this.options.slide).detach();
                    self.$slideTrack.detach();
                    self.$list.detach();
                    self.$slider.append(self.$slides);
                }
            }

            self.cleanUpRows();

            self.$slider.removeClass(_V.SLIDER);
            self.$slider.removeClass(_V.INITIALIZED);
            //self.$slider.removeClass(_V.DOTS);

            self.unbuilded = true;

            if (!refresh) {
                self.triggerHandler('destroy', [self]);
            }
        },
        disableTransition: function disableTransition(slide) {

            var self = this,
                opt = self.options,
                transition = {};

            transition[self.transitionType] = '';

            if (opt.fade === false) {
                self.$slideTrack.css(transition);
            } else {
                self.$slides.eq(slide).css(transition);
            }
        },
        fadeSlide: function fadeSlide(slideIndex, callback) {

            var self = this,
                opt = self.options;

            if (self.cssTransitions === false) {

                self.$slides.eq(slideIndex).css({
                    zIndex: opt.zIndex
                });

                self.$slides.eq(slideIndex).animate({
                    opacity: 1
                }, opt.speed, opt.easing, callback);
            } else {

                self.applyTransition(slideIndex);

                self.$slides.eq(slideIndex).css({
                    opacity: 1,
                    zIndex: opt.zIndex
                });

                if (callback) {
                    setTimeout(function() {

                        self.disableTransition(slideIndex);

                        callback.call();
                    }, opt.speed);
                }
            }
        },
        fadeSlideOut: function fadeSlideOut(slideIndex) {

            var self = this,
                opt = self.options;

            if (self.cssTransitions === false) {

                self.$slides.eq(slideIndex).animate({
                    opacity: 0,
                    zIndex: opt.zIndex - 2
                }, opt.speed, opt.easing);
            } else {

                self.applyTransition(slideIndex);

                self.$slides.eq(slideIndex).css({
                    opacity: 0,
                    zIndex: opt.zIndex - 2
                });
            }
        },
        filterSlides: function filterSlides(filter) {

            var self = this,
                opt = self.options;

            if (filter !== null) {

                self.$slidesCache = self.$slides;

                self.unload();

                self.$slideTrack.children(this.options.slide).detach();

                self.$slidesCache.filter(filter).appendTo(self.$slideTrack);

                self.reinit();
            }
        },
        focusHandler: function focusHandler() {
            var self = this,
                opt = self.options,
                moveHandle;

            self.on('mousemove', moveHandle = function() {
                if (moveHandle) {
                    self.off('mousemove', moveHandle);
                    moveHandle = null;
                }
                self.$el.triggerHandler('carouselactive');
            });

            self.inactive = false;
            self.on('mouseenter mouseleave', function(e) {
                if (moveHandle) {
                    self.off('mousemove', moveHandle);
                    moveHandle = null;
                }

                switch (e.type) {
                    case 'mouseenter':
                        if (!self.inactive) {
                            self.autoPlay();
                            self.inactive = true;
                            self.triggerHandler('carouselactive');
                        }
                        break;
                    case 'mouseleave':
                        if (self.inactive) {
                            self.autoPlay();
                            self.inactive = false;
                            self.triggerHandler('carouseldeactive');
                        }
                        break;
                }
            });

            if (!self.options.pauseOnFocus) {
                return;
            }

            self.on('focusin focusout', function(e) {
                switch (e.type) {
                    case 'focusin':
                        if (moveHandle) {
                            self.off('mousemove', moveHandle);
                            moveHandle = null;
                        }

                        if (!self.inactive) {
                            //self.focussed = true;
                            self.autoPlay();
                            self.inactive = true;
                            self.triggerHandler('carouselactive');
                        }
                        break;
                    case 'focusout':
                        if (self.inactive && e.relatedTarget && !$.contains(self.$slider[0], e.relatedTarget)) {
                            //self.focussed = false;
                            self.autoPlay();
                            self.inactive = false;
                            self.triggerHandler('carouseldeactive');
                        }
                        break;
                }
            });

            /*var self = this,
                opt = self.options;

            self.$slider.off('focus.' + _N + ' blur.' + _N).on('focus.' + _N + ' blur.' + _N, '*', function (event) {

                // TODO: ?? event.stopImmediatePropagation();
            var $sf = $(this);
                console.log(event.type);
            setTimeout(function() {

              if (opt.pauseOnFocus) {
                self.focussed = $sf.is(':focus');
                self.autoPlay();
              }
            }, 0);
            });*/
        },
        getCurrent: function getCurrent() {

            var self = this,
                opt = self.options;
            return self.currentSlide;
        },
        getDotCount: function getDotCount() {

            var self = this,
                opt = self.options;

            var breakPoint = 0;
            var counter = 0;
            var pagerQty = 0;

            if (opt.infinite === true) {
                if (self.slideCount <= opt.slidesToShow) {
                    ++pagerQty;
                } else {
                    while (breakPoint < self.slideCount) {
                        ++pagerQty;
                        breakPoint = counter + opt.slidesToScroll;
                        counter += opt.slidesToScroll <= opt.slidesToShow ? opt.slidesToScroll : opt.slidesToShow;
                    }
                }
            } else if (opt.centerMode === true) {
                pagerQty = self.slideCount;
            } else if (!opt.asNavFor) {
                pagerQty = 1 + Math.ceil((self.slideCount - opt.slidesToShow) / opt.slidesToScroll);
            } else {
                while (breakPoint < self.slideCount) {
                    ++pagerQty;
                    breakPoint = counter + opt.slidesToScroll;
                    counter += opt.slidesToScroll <= opt.slidesToShow ? opt.slidesToScroll : opt.slidesToShow;
                }
            }

            return pagerQty - 1;
        },
        getLeft: function getLeft(slideIndex) {

            var self = this,
                opt = self.options,
                targetLeft,
                verticalHeight,
                verticalOffset = 0,
                targetSlide,
                coef;

            self.slideOffset = 0;
            verticalHeight = self.$slides.first().outerHeight(true);

            if (opt.infinite === true) {
                if (self.slideCount > opt.slidesToShow) {
                    self.slideOffset = self.slideWidth * opt.slidesToShow * -1;
                    coef = -1;

                    if (opt.vertical === true && opt.centerMode === true) {
                        if (opt.slidesToShow === 2) {
                            coef = -1.5;
                        } else if (opt.slidesToShow === 1) {
                            coef = -2;
                        }
                    }
                    verticalOffset = verticalHeight * opt.slidesToShow * coef;
                }
                if (self.slideCount % opt.slidesToScroll !== 0) {
                    if (slideIndex + opt.slidesToScroll > self.slideCount && self.slideCount > opt.slidesToShow) {
                        if (slideIndex > self.slideCount) {
                            self.slideOffset = (opt.slidesToShow - (slideIndex - self.slideCount)) * self.slideWidth * -1;
                            verticalOffset = (opt.slidesToShow - (slideIndex - self.slideCount)) * verticalHeight * -1;
                        } else {
                            self.slideOffset = self.slideCount % opt.slidesToScroll * self.slideWidth * -1;
                            verticalOffset = self.slideCount % opt.slidesToScroll * verticalHeight * -1;
                        }
                    }
                }
            } else {
                if (slideIndex + opt.slidesToShow > self.slideCount) {
                    self.slideOffset = (slideIndex + opt.slidesToShow - self.slideCount) * self.slideWidth;
                    verticalOffset = (slideIndex + opt.slidesToShow - self.slideCount) * verticalHeight;
                }
            }

            if (self.slideCount <= opt.slidesToShow) {
                self.slideOffset = 0;
                verticalOffset = 0;
            }

            if (opt.centerMode === true && self.slideCount <= opt.slidesToShow) {
                self.slideOffset = self.slideWidth * Math.floor(opt.slidesToShow) / 2 - self.slideWidth * self.slideCount / 2;
            } else if (opt.centerMode === true && opt.infinite === true) {
                self.slideOffset += self.slideWidth * Math.floor(opt.slidesToShow / 2) - self.slideWidth;
            } else if (opt.centerMode === true) {
                self.slideOffset = 0;
                self.slideOffset += self.slideWidth * Math.floor(opt.slidesToShow / 2);
            }

            if (opt.vertical === false) {
                targetLeft = slideIndex * self.slideWidth * -1 + self.slideOffset;
            } else {
                targetLeft = slideIndex * verticalHeight * -1 + verticalOffset;
            }

            if (opt.variableWidth === true) {

                if (self.slideCount <= opt.slidesToShow || opt.infinite === false) {
                    targetSlide = self.$slideTrack.children('.' + _V.SLIDE).eq(slideIndex);
                } else {
                    targetSlide = self.$slideTrack.children('.' + _V.SLIDE).eq(slideIndex + opt.slidesToShow);
                }

                if (opt.rtl === true) {
                    if (targetSlide[0]) {
                        targetLeft = (self.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                    } else {
                        targetLeft = 0;
                    }
                } else {
                    targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                }

                if (opt.centerMode === true) {
                    if (self.slideCount <= opt.slidesToShow || opt.infinite === false) {
                        targetSlide = self.$slideTrack.children('.' + _V.SLIDE).eq(slideIndex);
                    } else {
                        targetSlide = self.$slideTrack.children('.' + _V.SLIDE).eq(slideIndex + opt.slidesToShow + 1);
                    }

                    if (opt.rtl === true) {
                        if (targetSlide[0]) {
                            targetLeft = (self.$slideTrack.width() - targetSlide[0].offsetLeft - targetSlide.width()) * -1;
                        } else {
                            targetLeft = 0;
                        }
                    } else {
                        targetLeft = targetSlide[0] ? targetSlide[0].offsetLeft * -1 : 0;
                    }

                    targetLeft += (self.$list.width() - targetSlide.outerWidth()) / 2;
                }
            }

            return targetLeft;
        },
        getOption: function getOption(option) {

            var self = this,
                opt = self.options;

            return opt[option];
        },
        getNavigableIndexes: function getNavigableIndexes() {

            var self = this,
                opt = self.options,
                breakPoint = 0,
                counter = 0,
                indexes = [],
                max;

            if (opt.infinite === false) {
                max = self.slideCount;
            } else {
                breakPoint = opt.slidesToScroll * -1;
                counter = opt.slidesToScroll * -1;
                max = self.slideCount * 2;
            }

            while (breakPoint < max) {
                indexes.push(breakPoint);
                breakPoint = counter + opt.slidesToScroll;
                counter += opt.slidesToScroll <= opt.slidesToShow ? opt.slidesToScroll : opt.slidesToShow;
            }

            return indexes;
        },
        getCarousel: function getCarousel() {

            return this;
        },
        getSlideCount: function getSlideCount() {

            var self = this,
                opt = self.options,
                slidesTraversed,
                swipedSlide,
                centerOffset;

            centerOffset = opt.centerMode === true ? self.slideWidth * Math.floor(opt.slidesToShow / 2) : 0;

            if (opt.swipeToSlide === true) {
                self.$slideTrack.find('.' + _V.SLIDE).each(function(index, slide) {
                    if (slide.offsetLeft - centerOffset + $(slide).outerWidth() / 2 > self.swipeLeft * -1) {
                        swipedSlide = slide;
                        return false;
                    }
                });

                slidesTraversed = Math.abs($(swipedSlide).attr('data-' + _V.INDEX) - self.currentSlide) || 1;

                return slidesTraversed;
            } else {
                return opt.slidesToScroll;
            }
        },
        goTo: function goTo(slide, dontAnimate) {

            var self = this,
                opt = self.options;

            self.changeSlide({
                data: {
                    message: 'index',
                    index: parseInt(slide)
                }
            }, dontAnimate);
        },
        init: function init(creation) {
            var self = this,
                opt = self.options;

            if (!$(self.$slider).hasClass(_V.INITIALIZED)) {

                $(self.$slider).addClass(_V.INITIALIZED);

                self.buildRows();
                self.buildOut();
                self.setProps();
                self.startLoad();
                self.loadSlider();
                self.initializeEvents();
                self.updateArrows();
                self.updateDots();
                self.checkResponsive(true);
                self.focusHandler();

                self.buildPlayButton();
                self.buildAccessbility();
            }

            if (creation) {
                self.triggerHandler(_N + 'init', [self]);
            }

            if (opt.accessibility === true) {
                self.initADA();
            }

            if (opt.autoplay) {

                self.paused = false;
                self.autoPlay();
                self.triggerHandler(_N + 'play', [self]);
            }

            if (creation) {
                if (opt.autoScrollActive && !opt.infinite) {
                    var index = self.$slides.filter(opt.autoScrollActive).index();
                    if (index > -1) {
                        self.changeSlide({
                            data: {
                                message: 'index',
                                index: index
                            }
                        }, true);
                    }
                }
            }
        },
        buildPlayButton: function buildPlayButton() {
            var self = this,
                opt = self.options;

            self.$playButon = self.$('.' + _V.PLAY);
            if (self.$playButon.length) {
                opt.pauseOnHover = true;

                self.$playButon.on('click', function(e) {
                    if (self.paused === false) {
                        self.pause();
                    } else {
                        self.play();
                    }
                });
            }
        },
        buildAccessbility: function buildAccessbility() {
            var self = this;

            if (self.$playButon.length) {
                self.$slider.on(_N + 'play ' + _N + 'stop destory', function(e) {
                    var $items = self.$playButon.find('[data-bind-text]');
                    var state = e.type === _N + 'play' ? 'stop' : 'play';

                    self.$playButon.removeClass('play stop').addClass(state);
                    $items.each(function() {
                        var $this = $(this),
                            data = $this.data('bindText');

                        $this.text(data[state]);
                    }); //
                });
            }

            if (self.$dots.length) {
                self.$slider.on(_N + 'afterchange', function(e, carousel, index) {
                    self.$dots.find('[data-bind-text]').text('');
                    self.$dots.eq(index).find('[data-bind-text]').text(function() {
                        return this.getAttribute('data-bind-text') || '';
                    });
                });
            }
        },
        initADA: function initADA() {
            var self = this,
                opt = self.options,
                numDotGroups = Math.ceil(self.slideCount / opt.slidesToShow),
                tabControlIndexes = self.getNavigableIndexes().filter(function(val) {
                    return val >= 0 && val < self.slideCount;
                }),
                $cloned = self.$slideTrack.find('.' + _V.CLONED);

            self.$slides.add($cloned).attr({
                'aria-hidden': 'true'
            }).find('a, input, button, select').attr({
                'tabindex': '-1'
            });

            if (self.$dots !== null) {

                self.$srOnly = self.$dots.find('.sr_only');
                if (!self.$srOnly.length) {
                    self.$srOnly = $('<span class="sr_only">선택됨</span>');
                }

                self.$slides.not($cloned).each(function(i) {
                    var slideControlIndex = tabControlIndexes.indexOf(i);

                    $(this).attr({
                        //TODO: 접근성에서 빼라고 함. 'role': 'option',
                        'id': _V.SLIDE + self.instanceUid + i //,
                        //aria: 'tabindex': -1
                    });

                    if (slideControlIndex !== -1) {
                        $(this).attr({
                            'aria-describedby': _V.SLIDE + '-control' + self.instanceUid + slideControlIndex
                        });
                    }
                });

                self.$dots.attr('role', 'tablist').find('li').each(function(i) {
                    var mappedSlideIndex = tabControlIndexes[i];

                    $(this).attr({
                        'role': 'presentation'
                    });

                    $(this).find('button, a').first().attr({
                        'role': 'button',
                        'id': _V.SLIDE + '-control' + self.instanceUid + i,
                        'aria-controls': _V.SLIDE + self.instanceUid + mappedSlideIndex,
                        'aria-selected': false,
                        'aria-label': numDotGroups + '개 슬라이드중에 ' + (i + 1) + '번째 슬라이드 보기' // (i + 1) + ' of ' + numDotGroups//,
                        //'tabindex': '-1'
                    });
                }).eq(self.currentSlide).find('button, a').attr('aria-selected', true) /*.append(self.$srOnly)*/ .end();
            }

            /*
            for (var i = self.currentSlide, max = i + opt.slidesToShow; i < max; i++) {
                self.$slides.eq(i).attr('tabindex', 0);
            }*/

            self.activateADA();
        },
        initArrowEvents: function initArrowEvents() {

            var self = this,
                opt = self.options;

            if (opt.arrows === true && self.slideCount > opt.slidesToShow) {
                self.$prevArrow.off('click.' + _N).on('click.' + _N, {
                    message: 'previous'
                }, self.changeSlide);
                self.$nextArrow.off('click.' + _N).on('click.' + _N, {
                    message: 'next'
                }, self.changeSlide);

                if (opt.accessibility === true) {
                    self.$prevArrow.on('keydown.' + _N, self.keyHandler);
                    self.$nextArrow.on('keydown.' + _N, self.keyHandler);
                }
            }
        },
        initDotEvents: function initDotEvents() {

            var self = this,
                opt = self.options;

            if (opt.dots === true) {
                $('li', self.$dots).on('click.' + _N, {
                    message: 'index'
                }, function(e) {
                    e.preventDefault();
                    self.changeSlide.apply(this, [].slice.call(arguments));
                });

                if (opt.accessibility === true) {
                    self.$dots.on('keydown.' + _N, self.keyHandler);
                }
            }

            if (opt.dots === true && opt.pauseOnDotsHover === true) {

                $('li', self.$dots).on('mouseenter.' + _N, $.proxy(self.interrupt, self, true)).on('mouseleave.' + _N, $.proxy(self.interrupt, self, false));
            }
        },
        initSlideEvents: function initSlideEvents() {

            var self = this,
                opt = self.options;

            if (opt.pauseOnHover) {

                self.$list.on('mouseenter.' + _N, $.proxy(self.interrupt, self, true));
                self.$list.on('mouseleave.' + _N, $.proxy(self.interrupt, self, false));
            }
        },
        initializeEvents: function initializeEvents() {

            var self = this,
                opt = self.options;

            self.initArrowEvents();

            self.initDotEvents();
            self.initSlideEvents();

            self.$list.on(addEventNS('touchstart mousedown'), {
                action: 'start'
            }, self.swipeHandler);
            self.$list.on(addEventNS('touchmove mousemove'), {
                action: 'move'
            }, self.swipeHandler);
            self.$list.on(addEventNS('touchend mouseup'), {
                action: 'end'
            }, self.swipeHandler);
            self.$list.on(addEventNS('touchcancel mouseleave'), {
                action: 'end'
            }, self.swipeHandler);

            self.$list.on(addEventNS('click'), self.clickHandler);

            $(document).on(self.visibilityChange, $.proxy(self.visibility, self));

            if (opt.accessibility === true) {
                self.$list.on(addEventNS('keydown'), self.keyHandler);
            }

            if (opt.focusOnSelect === true) {
                $(self.$slideTrack).children().on(addEventNS('click'), self.selectHandler);
            }

            $(window).on(addEventNS('orientationchange') + '-' + self.instanceUid, $.proxy(self.orientationChange, self));

            $(window).on(addEventNS('resize') + '-' + self.instanceUid, $.proxy(self.resize, self));

            $('[draggable!=true]', self.$slideTrack).on('dragstart', self.preventDefault);

            $(window).on(addEventNS('load') + '-' + self.instanceUid, self.setPosition);
            $(document).on(addEventNS('ready') + '-' + self.instanceUid, self.setPosition);
        },
        initUI: function initUI() {

            var self = this,
                opt = self.options;

            if (opt.arrows === true && self.slideCount > opt.slidesToShow) {
                self.$prevArrow.show();
                self.$nextArrow.show();
            }

            if (opt.dots === true && self.slideCount > opt.slidesToShow) {
                self.$dots.show();
            }
        },
        keyHandler: function keyHandler(event) {

            var self = this,
                opt = self.options;
            //Dont slide if the cursor is inside the form fields and arrow keys are pressed
            if (!event.target.tagName.match('TEXTAREA|INPUT|SELECT')) {
                if (event.keyCode === 37 && opt.accessibility === true) {
                    event.preventDefault();
                    self.changeSlide({
                        data: {
                            message: opt.rtl === true ? 'next' : 'previous'
                        }
                    });
                } else if (event.keyCode === 39 && opt.accessibility === true) {
                    event.preventDefault();
                    self.changeSlide({
                        data: {
                            message: opt.rtl === true ? 'previous' : 'next'
                        }
                    });
                }
            }
        },
        lazyLoad: function lazyLoad() {

            var self = this,
                opt = self.options,
                loadRange,
                cloneRange,
                rangeStart,
                rangeEnd;

            function loadImages(imagesScope) {

                $('img[data-lazy]', imagesScope).each(function() {

                    var image = $(this),
                        imageSource = $(this).attr('data-lazy'),
                        imageSrcSet = $(this).attr('data-srcset'),
                        imageSizes = $(this).attr('data-sizes') || self.$slider.attr('data-sizes'),
                        imageToLoad = document.createElement('img');

                    imageToLoad.onload = function() {

                        image.animate({
                            opacity: 0
                        }, 100, function() {

                            if (imageSrcSet) {
                                image.attr('srcset', imageSrcSet);

                                if (imageSizes) {
                                    image.attr('sizes', imageSizes);
                                }
                            }

                            image.attr('src', imageSource).animate({
                                opacity: 1
                            }, 200, function() {
                                image.removeAttr('data-lazy data-srcset data-sizes').removeClass(_V.LOADING);
                            });
                            self.triggerHandler(_N + 'lazyloaded', [self, image, imageSource]);
                        });
                    };

                    imageToLoad.onerror = function() {

                        image.removeAttr('data-lazy').removeClass(_V.LOADING).addClass(_N + '-lazyload-error');

                        self.triggerHandler(_N + 'lazyloadrrror', [self, image, imageSource]);
                    };

                    imageToLoad.src = imageSource;
                });
            }

            if (opt.centerMode === true) {
                if (opt.infinite === true) {
                    rangeStart = self.currentSlide + (opt.slidesToShow / 2 + 1);
                    rangeEnd = rangeStart + opt.slidesToShow + 2;
                } else {
                    rangeStart = Math.max(0, self.currentSlide - (opt.slidesToShow / 2 + 1));
                    rangeEnd = 2 + (opt.slidesToShow / 2 + 1) + self.currentSlide;
                }
            } else {
                rangeStart = opt.infinite ? opt.slidesToShow + self.currentSlide : self.currentSlide;
                rangeEnd = Math.ceil(rangeStart + opt.slidesToShow);
                if (opt.fade === true) {
                    if (rangeStart > 0) rangeStart--;
                    if (rangeEnd <= self.slideCount) rangeEnd++;
                }
            }

            loadRange = self.$slider.find('.' + _V.SLIDE).slice(rangeStart, rangeEnd);

            if (opt.lazyLoad === 'anticipated') {
                var prevSlide = rangeStart - 1,
                    nextSlide = rangeEnd,
                    $slides = self.$slider.find('.' + _N);

                for (var i = 0; i < opt.slidesToScroll; i++) {
                    if (prevSlide < 0) prevSlide = self.slideCount - 1;
                    loadRange = loadRange.add($slides.eq(prevSlide));
                    loadRange = loadRange.add($slides.eq(nextSlide));
                    prevSlide--;
                    nextSlide++;
                }
            }

            loadImages(loadRange);

            if (self.slideCount <= opt.slidesToShow) {
                cloneRange = self.$slider.find('.' + _V.SLIDE);
                loadImages(cloneRange);
            } else if (self.currentSlide >= self.slideCount - opt.slidesToShow) {
                cloneRange = self.$slider.find('.' + _V.CLONED).slice(0, opt.slidesToShow);
                loadImages(cloneRange);
            } else if (self.currentSlide === 0) {
                cloneRange = self.$slider.find('.' + _V.CLONED).slice(opt.slidesToShow * -1);
                loadImages(cloneRange);
            }
        },
        loadSlider: function loadSlider() {

            var self = this,
                opt = self.options;

            self.setPosition();

            self.$slideTrack.css({
                opacity: 1
            });

            self.$slider.removeClass(_V.LOADING);

            self.initUI();

            if (opt.lazyLoad === 'progressive') {
                self.progressiveLazyLoad();
            }
        },
        next: function next() {

            var self = this,
                opt = self.options;

            self.changeSlide({
                data: {
                    message: 'next'
                }
            });
        },
        orientationChange: function orientationChange() {

            var self = this,
                opt = self.options;

            self.checkResponsive();
            self.setPosition();
        },
        stop: function stop() {
            this.pause();
        },
        pause: function pause() {

            var self = this,
                opt = self.options;

            self.autoPlayClear();
            self.triggerHandler(_N + 'stop', [self]);
            self.paused = true;
        },
        play: function play() {

            var self = this,
                opt = self.options;

            self.autoPlay();
            self.triggerHandler(_N + 'play', [self]);
            opt.autoplay = true;
            self.paused = false;
            // self.focussed = false;
            self.inactive = false;
            self.interrupted = false;
        },
        postSlide: function postSlide(index) {

            var self = this,
                opt = self.options;

            if (!self.unbuilded) {

                self.triggerHandler(_N + 'afterchange', [self, index]);

                self.animating = false;

                if (self.slideCount > opt.slidesToShow) {
                    self.setPosition();
                }

                self.swipeLeft = null;

                if (opt.autoplay) {
                    self.autoPlay();
                }

                if (opt.accessibility === true) {
                    self.initADA();

                    if (opt.focusOnChange) {
                        var $currentSlide = $(self.$slides.get(self.currentSlide));
                        $currentSlide.attr('tabindex', 0).focus();
                    }
                }

                ////self.$slider.find('.' + _V.SLIDE).not('.' + _V.CURRENT).css('visibility', 'hidden');
            }
        },
        prev: function prev() {

            var self = this,
                opt = self.options;

            self.changeSlide({
                data: {
                    message: 'previous'
                }
            });
        },
        preventDefault: function preventDefault(event) {

            event.preventDefault();
        },
        progressiveLazyLoad: function progressiveLazyLoad(tryCount) {

            tryCount = tryCount || 1;

            var self = this,
                opt = self.options,
                $imgsToLoad = $('img[data-lazy]', self.$slider),
                image,
                imageSource,
                imageSrcSet,
                imageSizes,
                imageToLoad;

            if ($imgsToLoad.length) {

                image = $imgsToLoad.first();
                imageSource = image.attr('data-lazy');
                imageSrcSet = image.attr('data-srcset');
                imageSizes = image.attr('data-sizes') || self.$slider.attr('data-sizes');
                imageToLoad = document.createElement('img');

                imageToLoad.onload = function() {

                    if (imageSrcSet) {
                        image.attr('srcset', imageSrcSet);

                        if (imageSizes) {
                            image.attr('sizes', imageSizes);
                        }
                    }

                    image.attr('src', imageSource).removeAttr('data-lazy data-srcset data-sizes').removeClass(_V.LOADING);

                    if (opt.adaptiveHeight === true) {
                        self.setPosition();
                    }

                    self.triggerHandler(_N + 'lazyloaded', [self, image, imageSource]);
                    self.progressiveLazyLoad();
                };

                imageToLoad.onerror = function() {

                    if (tryCount < 3) {

                        /**
                         * try to load the image 3 times,
                         * leave a slight delay so we don't get
                         * servers blocking the request.
                         */
                        setTimeout(function() {
                            self.progressiveLazyLoad(tryCount + 1);
                        }, 500);
                    } else {

                        image.removeAttr('data-lazy').removeClass(_V.LOADING).addClass(_N + '-lazyload-error');

                        self.triggerHandler(_N + 'lazyloaderror', [self, image, imageSource]);

                        self.progressiveLazyLoad();
                    }
                };

                imageToLoad.src = imageSource;
            } else {

                self.triggerHandler(_N + 'allimagesloaded', [self]);
            }
        },
        refresh: function refresh(initializing) {

            var self = this,
                opt = self.options,
                currentSlide,
                lastVisibleIndex;

            lastVisibleIndex = self.slideCount - opt.slidesToShow;

            // in non-infinite sliders, we don't want to go past the
            // last visible index.
            if (!opt.infinite && self.currentSlide > lastVisibleIndex) {
                self.currentSlide = lastVisibleIndex;
            }

            // if less slides than to show, go to start.
            if (self.slideCount <= opt.slidesToShow) {
                self.currentSlide = 0;
            }

            currentSlide = self.currentSlide;

            self.destroy(true);

            $.extend(self, componentInitials, {
                currentSlide: currentSlide
            });

            self.init();

            if (!initializing) {

                self.changeSlide({
                    data: {
                        message: 'index',
                        index: currentSlide
                    }
                }, false);
            }
        },
        registerBreakpoints: function registerBreakpoints() {

            var self = this,
                opt = self.options,
                breakpoint,
                currentBreakpoint,
                l,
                responsiveSettings = opt.responsive || null;

            if ($.type(responsiveSettings) === 'array' && responsiveSettings.length) {

                self.respondTo = opt.respondTo || 'window';

                for (breakpoint in responsiveSettings) {

                    l = self.breakpoints.length - 1;

                    if (responsiveSettings.hasOwnProperty(breakpoint)) {
                        currentBreakpoint = responsiveSettings[breakpoint].breakpoint;

                        // loop through the breakpoints and cut out any existing
                        // ones with the same breakpoint number, we don't want dupes.
                        while (l >= 0) {
                            if (self.breakpoints[l] && self.breakpoints[l] === currentBreakpoint) {
                                self.breakpoints.splice(l, 1);
                            }
                            l--;
                        }

                        self.breakpoints.push(currentBreakpoint);
                        self.breakpointSettings[currentBreakpoint] = responsiveSettings[breakpoint].settings;
                    }
                }

                self.breakpoints.sort(function(a, b) {
                    return opt.mobileFirst ? a - b : b - a;
                });

                var r = self._getTargetBreakpoint();
                if (r) {
                    self.options.slidesToScroll = self.breakpointSettings[r].slidesToScroll;
                    self.options.slidesToShow = self.breakpointSettings[r].slidesToScroll;
                }
            }
        },
        reinit: function reinit() {

            var self = this,
                opt = self.options;

            self.$slides = self.$slideTrack.children(opt.slide).addClass(_V.SLIDE);

            self.slideCount = self.$slides.length;

            if (self.currentSlide >= self.slideCount && self.currentSlide !== 0) {
                self.currentSlide = self.currentSlide - opt.slidesToScroll;
            }

            if (self.slideCount <= opt.slidesToShow) {
                self.currentSlide = 0;
            }

            self.registerBreakpoints();

            self.setProps();
            self.setupInfinite();
            self.buildArrows();
            self.updateArrows();
            self.initArrowEvents();
            self.buildDots();
            self.updateDots();
            self.initDotEvents();
            self.cleanUpSlideEvents();
            self.initSlideEvents();

            self.checkResponsive(false, true);

            if (opt.focusOnSelect === true) {
                $(self.$slideTrack).children().on(addEventNS('click'), self.selectHandler);
            }

            self.setSlideClasses(typeof self.currentSlide === 'number' ? self.currentSlide : 0);

            self.setPosition();
            self.focusHandler();

            self.paused = !opt.autoplay;
            self.autoPlay();

            self.triggerHandler(_N + 'reinit', [self]);
        },
        resize: function resize() {

            var self = this,
                opt = self.options;

            if ($(window).width() !== self.windowWidth) {
                clearTimeout(self.windowDelay);
                self.windowDelay = window.setTimeout(function() {
                    self.windowWidth = $(window).width();
                    self.checkResponsive();
                    if (!self.unbuilded) {
                        self.setPosition();
                    }
                }, 50);
            }
        },
        removeSlide: function removeSlide(index, removeBefore, removeAll) {

            var self = this,
                opt = self.options;

            if (typeof index === 'boolean') {
                removeBefore = index;
                index = removeBefore === true ? 0 : self.slideCount - 1;
            } else {
                index = removeBefore === true ? --index : index;
            }

            if (self.slideCount < 1 || index < 0 || index > self.slideCount - 1) {
                return false;
            }

            self.unload();

            if (removeAll === true) {
                self.$slideTrack.children().remove();
            } else {
                self.$slideTrack.children(opt.slide).eq(index).remove();
            }

            self.$slides = self.$slideTrack.children(opts.slide);

            self.$slideTrack.children(opt.slide).detach();

            self.$slideTrack.append(self.$slides);

            self.$slidesCache = self.$slides;

            self.reinit();
        },
        setCSS: function setCSS(position) {

            var self = this,
                opt = self.options,
                positionProps = {},
                x,
                y;

            if (opt.rtl === true) {
                position = -position;
            }
            x = self.positionProp == 'left' ? Math.ceil(position) + 'px' : '0px';
            y = self.positionProp == 'top' ? Math.ceil(position) + 'px' : '0px';

            positionProps[self.positionProp] = position;

            if (self.transformsEnabled === false) {
                self.$slideTrack.css(positionProps);
            } else {
                positionProps = {};
                if (self.cssTransitions === false) {
                    positionProps[self.animType] = 'translate(' + x + ', ' + y + ')';
                    self.$slideTrack.css(positionProps);
                } else {
                    positionProps[self.animType] = 'translate3d(' + x + ', ' + y + ', 0px)';
                    self.$slideTrack.css(positionProps);
                }
            }
        },
        setDimensions: function setDimensions() {

            var self = this,
                opt = self.options;


            if (opt.vertical === false) {
                if (opt.centerMode === true) {
                    self.$list.css({
                        padding: '0px ' + opt.centerPadding
                    });
                } else {
                    self.$list.css('padding', '');
                }
            } else {
                self.$list.height(self.$slides.first().outerHeight(true) * opt.slidesToShow);
                if (opt.centerMode === true) {
                    self.$list.css({
                        padding: opt.centerPadding + ' 0px'
                    });
                } else {
                    self.$list.css('padding', '');
                }
            }

            //self.$slideTrack.css('width', '');
            self.listWidth = self.$list.width();
            self.listHeight = self.$list.height();

            if (opt.vertical === false && opt.variableWidth === false) {
                self.slideWidth = Math.ceil(self.listWidth / opt.slidesToShow);
                self.$slideTrack.width(Math.ceil(self.slideWidth * self.$slideTrack.children('.' + _V.SLIDE).length) + opt.additionWidth);
            } else if (opt.variableWidth === true) {
                self.$slideTrack.width((5000 * self.slideCount) + opt.additionWidth);
            } else {
                self.slideWidth = Math.ceil(self.listWidth);
                self.$slideTrack.height(Math.ceil(self.$slides.first().outerHeight(true) * self.$slideTrack.children('.' + _V.SLIDE).length));
            }

            if (opt.variableWidth === false) {
                var offset = self.$slides.first().outerWidth(true) - self.$slides.first().width();
                self.$slideTrack.children('.' + _V.SLIDE).width(self.slideWidth - offset);
            }
        },

        update: function() {
            this.setDimensions();
        },

        setFade: function setFade() {

            var self = this,
                opt = self.options,
                targetLeft;

            self.$slides.each(function(index, element) {
                targetLeft = self.slideWidth * index * -1;
                if (opt.rtl === true) {
                    $(element).css({
                        position: 'relative',
                        right: targetLeft,
                        top: 0,
                        zIndex: opt.zIndex - 2,
                        opacity: 0
                    });
                } else {
                    $(element).css({
                        position: 'relative',
                        left: targetLeft,
                        top: 0,
                        zIndex: opt.zIndex - 2,
                        opacity: 0
                    });
                }
            });

            self.$slides.eq(self.currentSlide).css({
                zIndex: opt.zIndex - 1,
                opacity: 1
            });
        },
        setHeight: function setHeight() {

            var self = this,
                opt = self.options;

            if (opt.slidesToShow === 1 && opt.adaptiveHeight === true && opt.vertical === false) {
                var targetHeight = self.$slides.eq(self.currentSlide).outerHeight(true);
                self.$list.css('height', targetHeight);
            }
        },
        setOption: function setOption() {

            /**
             * accepts arguments in format of:
             *
             *  - for changing a single option's value:
             *     .slick("setOption", option, value, refresh )
             *
             *  - for changing a set of responsive options:
             *     .slick("setOption", 'responsive', [{}, ...], refresh )
             *
             *  - for updating multiple values at once (not responsive)
             *     .slick("setOption", { 'option': value, ... }, refresh )
             */

            var self = this,
                opt = self.options,
                l,
                item,
                option,
                value,
                refresh = false,
                type;

            if ($.type(arguments[0]) === 'object') {

                option = arguments[0];
                refresh = arguments[1];
                type = 'multiple';
            } else if ($.type(arguments[0]) === 'string') {

                option = arguments[0];
                value = arguments[1];
                refresh = arguments[2];

                if (arguments[0] === 'responsive' && $.type(arguments[1]) === 'array') {

                    type = 'responsive';
                } else if (typeof arguments[1] !== 'undefined') {

                    type = 'single';
                }
            }

            if (type === 'single') {

                opt[option] = value;
            } else if (type === 'multiple') {

                $.each(option, function(opt, val) {

                    opt[opt] = val;
                });
            } else if (type === 'responsive') {

                for (item in value) {

                    if ($.type(opt.responsive) !== 'array') {

                        opt.responsive = [value[item]];
                    } else {

                        l = opt.responsive.length - 1;

                        // loop through the responsive object and splice out duplicates.
                        while (l >= 0) {

                            if (opt.responsive[l].breakpoint === value[item].breakpoint) {

                                opt.responsive.splice(l, 1);
                            }

                            l--;
                        }

                        opt.responsive.push(value[item]);
                    }
                }
            }

            if (refresh) {

                self.unload();
                self.reinit();
            }
        },
        setPosition: function setPosition() {

            var self = this,
                opt = self.options;

            if (!self.el || !self.$el.is(':visible')) {
                return;
            }

            self.setDimensions();

            self.setHeight();

            if (opt.fade === false) {
                self.setCSS(self.getLeft(self.currentSlide));
            } else {
                self.setFade();
            }

            self.triggerHandler(_N + 'setposition', [self]);
        },
        setProps: function setProps() {

            var self = this,
                opt = self.options,
                bodyStyle = document.body.style;

            self.positionProp = opt.vertical === true ? 'top' : 'left';

            if (self.positionProp === 'top') {
                self.$slider.addClass(_N + '-vertical');
            } else {
                self.$slider.removeClass(_N + '-vertical');
            }

            if (bodyStyle.WebkitTransition !== undefined || bodyStyle.MozTransition !== undefined || bodyStyle.msTransition !== undefined) {
                if (opt.useCSS === true) {
                    self.cssTransitions = true;
                }
            }

            if (opt.fade) {
                if (typeof opt.zIndex === 'number') {
                    if (opt.zIndex < 3) {
                        opt.zIndex = 3;
                    }
                } else {
                    opt.zIndex = self.defaults.zIndex;
                }
            }

            if (bodyStyle.OTransform !== undefined) {
                self.animType = 'OTransform';
                self.transformType = '-o-transform';
                self.transitionType = 'OTransition';
                if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) self.animType = false;
            }
            if (bodyStyle.MozTransform !== undefined) {
                self.animType = 'MozTransform';
                self.transformType = '-moz-transform';
                self.transitionType = 'MozTransition';
                if (bodyStyle.perspectiveProperty === undefined && bodyStyle.MozPerspective === undefined) self.animType = false;
            }
            if (bodyStyle.webkitTransform !== undefined) {
                self.animType = 'webkitTransform';
                self.transformType = '-webkit-transform';
                self.transitionType = 'webkitTransition';
                if (bodyStyle.perspectiveProperty === undefined && bodyStyle.webkitPerspective === undefined) self.animType = false;
            }
            if (bodyStyle.msTransform !== undefined) {
                self.animType = 'msTransform';
                self.transformType = '-ms-transform';
                self.transitionType = 'msTransition';
                if (bodyStyle.msTransform === undefined) self.animType = false;
            }
            if (bodyStyle.transform !== undefined && self.animType !== false) {
                self.animType = 'transform';
                self.transformType = 'transform';
                self.transitionType = 'transition';
            }
            self.transformsEnabled = opt.useTransform && self.animType !== null && self.animType !== false;
        },
        setSlideClasses: function setSlideClasses(index) {

            var self = this,
                opt = self.options,
                centerOffset,
                allSlides,
                indexOffset,
                remainder;

            allSlides = self.$slider.find('.' + _V.SLIDE)
                .removeClass(opt.activeClass + ' ' + _V.CENTER + ' ' + _V.CURRENT)
                .attr('aria-hidden', 'true');

            self.$slides.eq(index).addClass(_V.CURRENT);

            if (opt.centerMode === true) {

                var evenCoef = opt.slidesToShow % 2 === 0 ? 1 : 0;

                centerOffset = Math.floor(opt.slidesToShow / 2);

                if (opt.infinite === true) {

                    if (index >= centerOffset && index <= self.slideCount - 1 - centerOffset) {
                        self.$slides.slice(index - centerOffset + evenCoef, index + centerOffset + 1)
                            .addClass(opt.activeClass);
                    } else {

                        indexOffset = opt.slidesToShow + index;
                        allSlides.slice(indexOffset - centerOffset + 1 + evenCoef, indexOffset + centerOffset + 2)
                            .addClass(opt.activeClass);
                    }

                    if (index === 0) {

                        allSlides.eq(allSlides.length - 1 - opt.slidesToShow).addClass(_V.CENTER);
                    } else if (index === self.slideCount - 1) {

                        allSlides.eq(opt.slidesToShow).addClass(_V.CENTER);
                    }
                }

                self.$slides.eq(index).addClass(_V.CENTER);
            } else {

                if (index >= 0 && index <= self.slideCount - opt.slidesToShow) {

                    self.$slides.slice(index, index + opt.slidesToShow)
                        .addClass(opt.activeClass);
                } else if (allSlides.length <= opt.slidesToShow) {

                    allSlides.addClass(opt.activeClass);
                } else {

                    remainder = self.slideCount % opt.slidesToShow;
                    indexOffset = opt.infinite === true ? opt.slidesToShow + index : index;

                    if (opt.slidesToShow === opt.slidesToScroll && self.slideCount - index < opt.slidesToShow) {

                        allSlides.slice(indexOffset - (opt.slidesToShow - remainder), indexOffset + remainder)
                            .addClass(opt.activeClass);
                    } else {

                        allSlides.slice(indexOffset, indexOffset + opt.slidesToShow)
                            .addClass(opt.activeClass);
                    }
                }
            }

            if (opt.lazyLoad === 'ondemand' || opt.lazyLoad === 'anticipated') {
                self.lazyLoad();
            }
        },
        setupInfinite: function setupInfinite() {

            var self = this,
                opt = self.options,
                i,
                slideIndex,
                infiniteCount;

            if (opt.fade === true) {
                opt.centerMode = false;
            }

            if (opt.infinite === true && opt.fade === false) {

                slideIndex = null;

                if (self.slideCount > opt.slidesToShow) {

                    if (opt.centerMode === true) {
                        infiniteCount = opt.slidesToShow + 1;
                    } else {
                        infiniteCount = opt.slidesToShow;
                    }

                    for (i = self.slideCount; i > self.slideCount - infiniteCount; i -= 1) {
                        slideIndex = i - 1;
                        $(self.$slides[slideIndex]).clone(true).attr('id', '').attr('data-' + _V.INDEX, slideIndex - self.slideCount).prependTo(self.$slideTrack).addClass(_V.CLONED);
                    }
                    for (i = 0; i < infiniteCount; i += 1) {
                        slideIndex = i;
                        $(self.$slides[slideIndex]).clone(true).attr('id', '').attr('data-' + _V.INDEX, slideIndex + self.slideCount).appendTo(self.$slideTrack).addClass(_V.CLONED);
                    }
                    self.$slideTrack.find('.' + _V.CLONED).find('[id]').each(function() {
                        $(this).attr('id', '');
                    });
                }
            }
        },
        interrupt: function interrupt(toggle) {

            var self = this,
                opt = self.options;

            if (!toggle) {
                self.autoPlay();
            }
            self.interrupted = toggle;
        },
        selectHandler: function selectHandler(event) {

            var self = this,
                opt = self.options;

            var targetElement = $(event.target).is('.' + _V.SLIDE) ? $(event.target) : $(event.target).parents('.' + _V.SLIDE);

            var index = parseInt(targetElement.attr('data-' + _V.INDEX));

            if (!index) index = 0;

            if (self.slideCount <= opt.slidesToShow) {

                self.slideHandler(index, false, true);
                return;
            }

            self.slideHandler(index);
        },
        slideHandler: function slideHandler(index, sync, dontAnimate) {

            var targetSlide,
                animSlide,
                oldSlide,
                slideLeft,
                targetLeft = null,
                self = this,
                opt = self.options,
                navTarget;

            sync = sync || false;

            if (self.animating === true && opt.waitForAnimate === true) {
                return;
            }

            if (opt.fade === true && self.currentSlide === index) {
                return;
            }

            targetSlide = index;
            targetLeft = self.getLeft(targetSlide);
            slideLeft = self.getLeft(self.currentSlide);

            self.currentLeft = self.swipeLeft === null ? slideLeft : self.swipeLeft;

            if (opt.infinite === false && opt.centerMode === false && (index < 0 || index > self.getDotCount() * opt.slidesToScroll)) {
                if (opt.fade === false) {
                    targetSlide = self.currentSlide;
                    if (dontAnimate !== true) {
                        self.animateSlide(slideLeft, function() {
                            self.postSlide(targetSlide);
                        });
                    } else {
                        self.postSlide(targetSlide);
                    }
                }
                return;
            } else if (opt.infinite === false && opt.centerMode === true && (index < 0 || index > self.slideCount - opt.slidesToScroll)) {
                if (opt.fade === false) {
                    targetSlide = self.currentSlide;
                    if (dontAnimate !== true) {
                        self.animateSlide(slideLeft, function() {
                            self.postSlide(targetSlide);
                        });
                    } else {
                        self.postSlide(targetSlide);
                    }
                }
                return;
            }

            if (opt.autoplay) {
                clearInterval(self.autoPlayTimer);
            }

            if (targetSlide < 0) {
                if (self.slideCount % opt.slidesToScroll !== 0) {
                    animSlide = self.slideCount - self.slideCount % opt.slidesToScroll;
                } else {
                    animSlide = self.slideCount + targetSlide;
                }
            } else if (targetSlide >= self.slideCount) {
                if (self.slideCount % opt.slidesToScroll !== 0) {
                    animSlide = 0;
                } else {
                    animSlide = targetSlide - self.slideCount;
                }
            } else {
                animSlide = targetSlide;
            }

            self.animating = true;

            self.triggerHandler(_N + 'beforechange', [self, self.currentSlide, animSlide]);

            oldSlide = self.currentSlide;
            self.previousSlide = oldSlide;
            self.currentSlide = animSlide;

            self.setSlideClasses(self.currentSlide);

            if (opt.asNavFor) {

                navTarget = self.getNavTarget();
                navTarget = navTarget.vcCarousel('instance');

                if (navTarget.slideCount <= navTarget.options.slidesToShow) {
                    navTarget.setSlideClasses(self.currentSlide);
                }

                if (sync === false) {
                    self.asNavFor(self.currentSlide);
                }
            }

            self.updateDots();
            self.updateArrows();

            if (opt.fade === true) {
                if (dontAnimate !== true) {

                    self.fadeSlideOut(oldSlide);

                    self.fadeSlide(animSlide, function() {
                        self.postSlide(animSlide);
                    });
                } else {
                    self.postSlide(animSlide);
                }
                self.animateHeight();
                return;
            }

            if (dontAnimate !== true) {
                self.animateSlide(targetLeft, function() {
                    self.postSlide(animSlide);
                });
            } else {
                self.postSlide(animSlide);
            }
        },
        startLoad: function startLoad() {

            var self = this,
                opt = self.options;

            if (opt.arrows === true && self.slideCount > opt.slidesToShow) {
                self.$prevArrow.hide();
                self.$nextArrow.hide();
            }

            if (opt.dots === true && self.slideCount > opt.slidesToShow) {
                self.$dots.hide();
            }

            self.$slider.addClass(_V.LOADING);
        },
        swipeDirection: function swipeDirection() {

            var xDist,
                yDist,
                r,
                swipeAngle,
                self = this,
                opt = self.options;

            xDist = self.touchObject.startX - self.touchObject.curX;
            yDist = self.touchObject.startY - self.touchObject.curY;
            r = Math.atan2(yDist, xDist);

            swipeAngle = Math.round(r * 180 / Math.PI);
            if (swipeAngle < 0) {
                swipeAngle = 360 - Math.abs(swipeAngle);
            }

            if (swipeAngle <= 45 && swipeAngle >= 0) {
                return opt.rtl === false ? 'left' : 'right';
            }
            if (swipeAngle <= 360 && swipeAngle >= 315) {
                return opt.rtl === false ? 'left' : 'right';
            }
            if (swipeAngle >= 135 && swipeAngle <= 225) {
                return opt.rtl === false ? 'right' : 'left';
            }
            if (opt.verticalSwiping === true) {
                if (swipeAngle >= 35 && swipeAngle <= 135) {
                    return 'down';
                } else {
                    return 'up';
                }
            }

            if (self.options.preventVertical) {
                return xDist < 0 ? 'right' : 'left';
            }

            return 'vertical';
        },
        swipeEnd: function swipeEnd(event) {

            var self = this,
                opt = self.options,
                slideCount,
                direction;

            self.dragging = false;
            self.swiping = false;

            if (self.scrolling) {
                self.scrolling = false;
                return false;
            }

            self.interrupted = false;
            self.shouldClick = self.touchObject.swipeLength > 10 ? false : true;

            if (self.touchObject.curX === undefined) {
                return false;
            }

            if (self.touchObject.edgeHit === true) {
                self.triggerHandler(_N + 'edge', [self, self.swipeDirection()]);
            }

            if (self.touchObject.swipeLength >= self.touchObject.minSwipe) {

                direction = self.swipeDirection();

                switch (direction) {

                    case 'left':
                    case 'down':

                        slideCount = opt.swipeToSlide ? self.checkNavigable(self.currentSlide + self.getSlideCount()) : self.currentSlide + self.getSlideCount();

                        self.currentDirection = 0;

                        break;

                    case 'right':
                    case 'up':

                        slideCount = opt.swipeToSlide ? self.checkNavigable(self.currentSlide - self.getSlideCount()) : self.currentSlide - self.getSlideCount();

                        self.currentDirection = 1;

                        break;

                    default:

                }

                if (direction != 'vertical') {
                    self.slideHandler(slideCount);
                    self.touchObject = {};
                    self.triggerHandler(_N + 'swipe', [self, direction]);
                }
            } else {

                if (self.touchObject.startX !== self.touchObject.curX) {

                    self.slideHandler(self.currentSlide);
                    self.touchObject = {};
                }
            }
        },
        swipeHandler: function swipeHandler(event) {

            var self = this,
                opt = self.options;

            if (opt.swipe === false || 'ontouchend' in document && opt.swipe === false) {
                return;
            } else if (opt.draggable === false && event.type.indexOf('mouse') !== -1) {
                return;
            }

            self.touchObject.fingerCount = event.originalEvent && event.originalEvent.touches !== undefined ? event.originalEvent.touches.length : 1;

            self.touchObject.minSwipe = self.listWidth / opt.touchThreshold;

            if (opt.verticalSwiping === true) {
                self.touchObject.minSwipe = self.listHeight / opt.touchThreshold;
            }

            switch (event.data.action) {

                case 'start':
                    self.swipeStart(event);
                    break;

                case 'move':
                    self.swipeMove(event);
                    break;

                case 'end':
                    self.swipeEnd(event);
                    break;

            }
        },
        swipeMove: function swipeMove(event) {

            var self = this,
                opt = self.options,
                edgeWasHit = false,
                curLeft,
                swipeDirection,
                swipeLength,
                positionOffset,
                touches,
                verticalSwipeLength;

            touches = event.originalEvent !== undefined ? event.originalEvent.touches : null;

            if (!self.dragging || self.scrolling || touches && touches.length !== 1) {
                return false;
            }

            curLeft = self.getLeft(self.currentSlide);

            self.touchObject.curX = touches !== undefined ? touches[0].pageX : event.clientX;
            self.touchObject.curY = touches !== undefined ? touches[0].pageY : event.clientY;

            self.touchObject.swipeLength = Math.round(Math.sqrt(Math.pow(self.touchObject.curX - self.touchObject.startX, 2)));

            verticalSwipeLength = Math.round(Math.sqrt(Math.pow(self.touchObject.curY - self.touchObject.startY, 2)));


            if (!opt.verticalSwiping && !self.swiping && verticalSwipeLength > 4) {
                self.scrolling = true;
                return false;
            }

            if (opt.verticalSwiping === true) {
                self.touchObject.swipeLength = verticalSwipeLength;
            }

            swipeDirection = self.swipeDirection();

            if (opt.preventVertical && self.swiping) {
                event.stopPropagation();
                event.preventDefault();
            }

            if (event.originalEvent !== undefined && self.touchObject.swipeLength > 4) {
                self.swiping = true;
                event.preventDefault();
            }

            positionOffset = (opt.rtl === false ? 1 : -1) * (self.touchObject.curX > self.touchObject.startX ? 1 : -1);
            if (opt.verticalSwiping === true) {
                positionOffset = self.touchObject.curY > self.touchObject.startY ? 1 : -1;
            }

            swipeLength = self.touchObject.swipeLength;

            self.touchObject.edgeHit = false;

            if (opt.infinite === false) {
                if (self.currentSlide === 0 && swipeDirection === 'right' || self.currentSlide >= self.getDotCount() && swipeDirection === 'left') {
                    swipeLength = self.touchObject.swipeLength * opt.edgeFriction;
                    self.touchObject.edgeHit = true;
                }
            }

            if (opt.vertical === false) {
                self.swipeLeft = curLeft + swipeLength * positionOffset;
            } else {
                self.swipeLeft = curLeft + swipeLength * (self.$list.height() / self.listWidth) * positionOffset;
            }
            if (opt.verticalSwiping === true) {
                self.swipeLeft = curLeft + swipeLength * positionOffset;
            }
            self.triggerHandler(_N + 'swipemove', [self]);

            if (opt.fade === true || opt.touchMove === false) {
                return false;
            }

            if (self.animating === true) {
                self.swipeLeft = null;
                return false;
            }

            self.setCSS(self.swipeLeft);
        },
        swipeStart: function swipeStart(event) {

            var self = this,
                opt = self.options,
                touches;

            self.interrupted = true;

            if (self.touchObject.fingerCount !== 1 || self.slideCount <= opt.slidesToShow) {
                self.touchObject = {};
                return false;
            }

            if (event.originalEvent !== undefined && event.originalEvent.touches !== undefined) {
                touches = event.originalEvent.touches[0];
            }

            self.touchObject.startX = self.touchObject.curX = touches !== undefined ? touches.pageX : event.clientX;
            self.touchObject.startY = self.touchObject.curY = touches !== undefined ? touches.pageY : event.clientY;

            self.dragging = true;
            self.triggerHandler(_N + 'swipestart', [self]);
            /////self.$slider.find('.' + _V.SLIDE).css('visibility', '');
        },
        unfilterSlides: function unfilterSlides() {

            var self = this,
                opt = self.options;

            if (self.$slidesCache !== null) {

                self.unload();

                self.$slideTrack.children(opt.slide).detach();

                self.$slidesCache.appendTo(self.$slideTrack);

                self.reinit();
            }
        },
        unload: function unload() {

            var self = this,
                opt = self.options;

            $('.' + _V.CLONED, self.$slider).remove();

            if (self.$dots) {
                self.$dots.remove();
            }

            if (self.$prevArrow && self.htmlExpr.test(opt.prevArrow)) {
                self.$prevArrow.remove();
            }

            if (self.$nextArrow && self.htmlExpr.test(opt.nextArrow)) {
                self.$nextArrow.remove();
            }

            self.$slides.removeClass(_V.SLIDE + ' ' + opt.activeClass + ' ' + _V.VISIBLE + ' ' + _V.CURRENT)
                .attr('aria-hidden', 'true')
                .css('width', '');
        },
        unbuild: function unbuild(fromBreakpoint) {

            var self = this,
                opt = self.options;
            self.triggerHandler(_V.UNBUILD, [self, fromBreakpoint]);
            self.destroy();
        },
        updateArrows: function updateArrows() {

            var self = this,
                opt = self.options;

            //centerOffset = Math.floor(opt.slidesToShow / 2);

            if (opt.arrows === true && self.slideCount > opt.slidesToShow && !opt.infinite) {
                self._updateArrow(self.$prevArrow.attr('title', '이전 슬라이드 보기'), true);
                self._updateArrow(self.$nextArrow.attr('title', '다음 슬라이드 보기'), true);

                if (self.currentSlide === 0) {
                    self._updateArrow(self.$prevArrow.attr('title', '이전 슬라이드 보기 - 첫 슬라이드입니다.'), false);
                } else if (self.currentSlide >= self.slideCount - opt.slidesToShow && opt.centerMode === false) {
                    self._updateArrow(self.$nextArrow.attr('title', '다음 슬라이드 보기 - 마지막 슬라이드입니다.'), false);
                } else if (self.currentSlide >= self.slideCount - 1 && opt.centerMode === true) {
                    self._updateArrow(self.$nextArrow.attr('title', '다음 슬라이드 보기 - 마지막 슬라이드입니다.'), false);
                }
            }
        },
        _updateArrow: function($arrow, flag) {
            var self = this;
            var opts = self.options;

            switch (opts.arrowsUpdate) {
                case 'disabled':
                    $arrow[flag ? 'removeClass' : 'addClass'](_V.DISABLED)
                        .prop('disabled', !flag)
                        .attr('aria-disabled', (!flag).toString());
                    break;
                case 'toggle':
                    $arrow.toggle(flag);
                    break;
            }
        },
        updateDots: function updateDots() {

            var self = this,
                opt = self.options;

            if (self.$dots.length) {
                self.$dots.find('li').removeClass(opt.activeClass).eq(Math.floor(self.currentSlide / opt.slidesToScroll)).addClass(opt.activeClass);
            }
        },
        visibility: function visibility() {

            var self = this,
                opt = self.options;

            if (opt.autoplay) {
                self.interrupted = !!document[self.hidden];
            }
        }
    });

    return Carousel;
});
/**
 * Dropodwn
 */
define('ui/dropdown', [
    'jquery',
    'vcui'
], function($, core) {

    var Dropdown = core.ui('Dropdown', {
        bindjQuery: true,
        defaults: {
            hover: false, // 호버일때 열리게 할 것인가
            activeClass: 'open', // 활성화 클래스
            autoHide: true //
        },
        initialize: function(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self._buildARIA();
            self._bindEvents();
        },

        /**
         * aria 설정
         * @private
         */
        _buildARIA: function() {
            var self = this;
            var $list = self.$('.ui_dropdown_list');

            if (!$list.attr('id')) {
                $list.attr('id', self.cid + '_popup');
            }

            self.$('.ui_dropdown_toggle, .ui_dropdown_close')
                .filter('a')
                .attr('role', 'button')
                .filter('.ui_dropdown_toggle')
                .attr({
                    'aria-controls': $list.attr('id'),
                    'aria-expanded': false,
                    'aria-haspopup': true
                });

            self.$('.sr_only').text(core.i18n('open'));
        },

        _bindEvents: function() {
            var self = this;

            // 토글 버튼
            self.on('click', '.ui_dropdown_toggle', function(e) {
                e.preventDefault();

                self.toggle();
            });

            // 닫기 버튼
            self.on('click', '.ui_dropdown_close', function(e) {
                e.preventDefault();

                self.close();
            });

            // 호버일 때 호버관련 이벤트 바인딩
            if (self.options.hover) {
                self.on('mouseenter mouseleave', function(e) {
                    self[e.type === 'mouseenter' ? 'open' : 'close']()
                });
            }
        },

        /**
         * 토글 함수
         */
        toggle: function() {
            this[this.$el.is('.on, .open') ? 'close' : 'open']();
        },

        /**
         * 열기 메소드
         */
        open: function() {
            var self = this;

            self.$el.addClass(self.options.activeClass);
            self.$('.ui_dropdown_toggle')
                .attr('aria-expanded', true)
                .find('.sr_only').text(vcui.i18n('close'));

            self.options.autoHide && setTimeout(function() {
                // 다른 곳을 클릭하면 닫히게 해준다.
                self.docOn('click', function(e) {
                    if (core.dom.contains(self.$el[0], e.target)) {
                        setTimeout(function() {
                            self.close();
                        }, 100);
                        return;
                    }
                    self.close();
                });

                self.docOn('keydown', function(e) {
                    if (e.which === core.keyCode.ESCAPE) {
                        self.close();
                    }
                });

                self.$('.ui_dropdown_list').on('click', 'a, button', function(e) {
                    setTimeout(function() {
                        self.close();
                    }, 100);
                });

                if (core.detect.isTouch) {
                    return;
                }
                // 포커스가 빠져나가면 자동으로 닫히도록 해준다..
                var thread;
                self.on('focusin focusout', function(e) {
                    switch (e.type) {
                        case 'focusin':
                            clearTimeout(thread);
                            break;
                        case 'focusout':
                            clearTimeout(thread);
                            thread = setTimeout(function() {
                                self.close();
                            }, 100);
                            break;
                    }
                });
            });
        },

        /**
         * 닫기
         */
        close: function() {
            var self = this;

            self.$el.removeClass(self.options.activeClass);
            self.$('.ui_dropdown_toggle')
                .attr('aria-expanded', false)
                .find('.sr_only').text(vcui.i18n('open'));
            self.$('.ui_dropdown_list').off('click');
            self.docOff('click keydown');
            self.off('focusin focusout');
        }
    });

    /*$(document).on('click', '.ui_dropdown_toggle', function (e) {
        e.preventDefault();

        var $btn = $(this),
            $menuWrap = $btn.parent();

        if ($menuWrap.data('ui_dropdown_initialized')) {
            return;
        }

        $menuWrap.data('ui_dropdown_initialized', true);
        new Dropdown($menuWrap, $menuWrap.data()).open();
    }).on('mouseenter', '.ui_dropdown[data-hover=true]', function () {
        var $menuWrap = $(this);

        if ($menuWrap.data('ui_dropdown_initialized')) {
            return;
        }

        $menuWrap.data('ui_dropdown_initialized', true);
        new Dropdown($menuWrap, $menuWrap.data()).open();
    });*/

    return Dropdown;
});
/*!
 * @module vcui.helper.Geolocation
 * @license MIT License
 * @description 지오로케이션 헬퍼
 * @copyright VinylC UID Group
 */
define('ui/formValidator', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var messages = {
        required: "'[name]'항목은 필수입력 항목입니다.",
        match: "'[name]'항목은 '{targetName}'항목과 동일해야 합니다.",
        email: "'[name]'항목이 이메일 형식에 맞지 않습니다.",
        minlength: "'[name]'항목의 최소길이는 {0}입니다.",
        maxlength: "'[name]'항목의 최대길이는 {0}입니다",
        exactlength: "'[name]'항목은 {0}길이여야 합니다.",
        rangelength: "'[name]'항목의 길이가 {0}와 {1}사이여야 합니다.",
        minchecked: "'[name]'항목의 최소 {0}개 이상 체크해 주세요.",
        maxchecked: "'[name]'항목의 최대 {0}개 이하 체크해 주세요.",
        exactchecked: "'[name]'항목은 {0}개 체크해 주세요.",
        rangechecked: "'[name]'항목은 {0}개에서 {1}개 사이에만 체크해 주세요.",
        alpha: "'[name]'항목은 영문자만 유효합니다.",
        alnum: "'[name]'항목은 영문자와 숫자만 유효합니다.",
        numeric: "'[name]'항목은 숫자, ., -만 유효합니다.",
        integer: "'[name]'항목은 -, 숫자만 유효합니다.",
        decimal: "'[name]'항목은 -, ., 숫자만 유효합니다.",
        nozero: "'[name]'항목은 0으로 시작하면 안됩니다.",
        file: "'[name]'항목은 {0}확장자만 유효합니다.",
        url: "url주소 형식이 잘못 되었습니다.",
        tel: "전화번호가 잘못 되었습니다.",
        mobile: "휴대폰번호 형식이 잘못 되었습니다.",
        gt_date: "'[name]'날짜는 '{targetName}'날짜보다 이후여야 합니다.",
        lt_date: "'[name]'날짜는 '{targetName}'날짜보다 이전이어야 합니다.",
        eqgt_date: "'[name]'날짜는 '{targetName}'날짜와 같거나 이후여야 합니다.",
        eqlt_date: "'[name]'날짜는 '{targetName}'날짜와 같거나 이전이어야 합니다.",
        regexp: "[data-pattern] 정규식에 안맞습니다.",
        filemaxsize: "'[name]'는 '{0}' 이상 올릴 수 없습니다.",
        filemaxcount: "'[name]'는 {0}개까지만 등록할 수 있습니다."
    };

    var ruleRegex = /^(.+?)\((.+)\)$/,
        numericRegex = /^[0-9]+$/,
        integerRegex = /^\-?[0-9]+$/,
        decimalRegex = /^\-?[0-9]*\.?[0-9]+$/,
        emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        alphaRegex = /^[a-z]+$/i,
        alphaNumericRegex = /^[a-z0-9]+$/i,
        naturalNoZeroRegex = /^[1-9][0-9]*$/i,
        ipRegex = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
        base64Regex = /[^a-zA-Z0-9\/\+=]/i,
        numericDashRegex = /^[\d\-\s]+$/,
        telRegex = /^\d{2,3}-\d{3,4}-\d{4}$/,
        mobileRegex = /^(010|011|17|018|019)-\d{3,4}-\d{4}$/,
        urlRegex = /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,
        dateRegex = /^\d{4}-\d{1,2}-\d{1,2}/;


    function typeName(el) {
        return (el.type || '').toLowerCase();
    }

    function tagName(el) {
        return (el.tagName || '').toLowerCase();
    }

    function getValue(el) {
        if (typeof el === 'string') {
            return el;
        }

        var type = typeName(el),
            items;
        if (type === 'checkbox' || type === 'radio') {
            items = [].slice.call(el.form.elements[el.name]);
            for (var i = -1, item; item = items[++i];) {
                if (item.checked === true) {
                    return item.value;
                }
            }
            return '';
        }
        return el.value.trim();
    }

    function getCheckedCount(el) {
        var items = [].slice.call(el.form.elements[el.name]),
            cnt = 0;

        for (var i = -1, item; item = items[++i];) {
            if (item.checked) {
                cnt += 1;
            }
        }
        return cnt;
    }

    function parseDate(date) {
        if (!date.match('today') && !date.match(dateRegex)) {
            return false;
        }

        var validDate = new Date(),
            validDateArray;

        if (!date.match('today')) {
            validDateArray = date.split('-');
            validDate.setFullYear(validDateArray[0]);
            validDate.setMonth(validDateArray[1] - 1);
            validDate.setDate(validDateArray[2]);
        }
        return validDate;
    }

    function getInputName(el) {
        var label;
        if (el.length) {
            el = el[0];
        }

        if (label = el.getAttribute('data-name')) {
            return label;
        }
        if (label = el.getAttribute('id')) {
            if (label = $('label[for=' + label + ']')[0]) {
                return label.innerText;
            }
            if ((label = $(el).closest('label')).length) {
                return label[0].innerText;
            }
        }
        return el.name;
    }

    function byteLength(value) {
        var l = 0;
        for (var i = 0, len = value.length; i < len; i++) {
            l += (value.charCodeAt(i) > 255) ? 2 : 1;
        }
        return l;
    }

    var FormValidator = function(el, options) {
        var self = this;

        self.errors = [];
        self.$form = $(el);
        self.form = self.$form.get(0);
        self.messages = $.extend({}, messages, options.messages);
        self.befores = {};
        self.afters = {};

        var opt = self.options = core.extend({
            autoCheck: true,
            notifyType: 'alert', // tooltip, none
            /*tooltip: function () {
            },*/
            onBeforeSubmit: function() {},
            onInvalid: function() {},
        }, options);

        core.each(opt.validBefore || {}, function(v, k) {
            self.addValidBefore(k, v);
        });

        core.each(opt.validAfter || {}, function(v, k) {
            self.addValidAfter(k, v);
        });

        if (opt.autoCheck) {
            self.$form.on('submit', function(e) {
                if (!self.run()) {
                    e.preventDefault();
                    opt.onInvalid.call(self, this);
                    return false;
                }
                try {
                    if (opt.onBeforeSubmit.call(self, this) === false) {
                        e.preventDefault();
                    }
                } catch (ex) {
                    e.preventDefault();
                    self.errors.push(ex);
                    self._showError();
                }
            });
        }

        if (opt.notifyType === 'tooltip') {
            this._bindInputEvent();
        }
    };

    core.extend(FormValidator, {
        messages: messages,
        rules: {
            required: {
                fn: function(element) {
                    var value = getValue(element);
                    return !!(value);
                }
            },
            match: {
                fn: function(element, matchName) {
                    var el = this.form[matchName];
                    this.currentData.targetName = getInputName(el) || matchName;

                    if (el) {
                        return element.value === getValue(el);
                    }

                    return false;
                }
            },
            email: {
                fn: function(element, other) {
                    var val = getValue(element),
                        domain;
                    if (other && (domain = element.form.elements[other])) {
                        val += '@' + getValue(domain);
                    }
                    return emailRegex.test(val);
                }
            },
            tel: {
                fn: function(element, tel2name, tel3name) {
                    var val = getValue(element);
                    if (arguments.length > 1) {
                        val += '-' + getValue(element.form[tel2name]) + '-' + getValue(element.form[tel3name]);
                    }
                    return telRegex.test(val);
                }
            },
            mobile: {
                fn: function(element, tel2name, tel3name) {
                    var val = getValue(element);
                    if (arguments.length > 1) {
                        val += '-' + getValue(element.form[tel2name]) + '-' + getValue(element.form[tel3name]);
                    }
                    return mobileRegex.test(val);
                }
            },
            minlength: {
                fn: function(element, length) {
                    return (getValue(element).length >= parseInt(length, 10));
                }
            },
            maxlength: {
                fn: function(element, length) {
                    return (getValue(element).length <= parseInt(length, 10));
                }
            },
            exactlength: {
                fn: function(element, length) {
                    return (getValue(element).length === length | 0);
                }
            },
            rangelength: {
                fn: function(element, min, max) {
                    var len = getValue(element).length;
                    return len >= min && len <= max;
                }
            },
            minbyte: {
                fn: function(element, length) {
                    return (byteLength(getValue(element)) >= parseInt(length, 10));
                }
            },
            maxbyte: {
                fn: function(element, length) {
                    return (byteLength(getValue(element)) <= parseInt(length, 10));
                }
            },
            exactbyte: {
                fn: function(element, length) {
                    return (byteLength(getValue(element)) === length | 0);
                }
            },
            minchecked: {
                fn: function(element, min) {
                    return getCheckedCount(element) >= min | 0;
                }
            },
            maxchecked: {
                fn: function(element, max) {
                    return getCheckedCount(element) <= max | 0;
                }
            },
            exactchecked: {
                fn: function(element, cnt) {
                    return getCheckedCount(element) === cnt | 0;
                }
            },
            rangechecked: {
                fn: function(element, min, max) {
                    var cnt = getCheckedCount(element);
                    if (typeof max === 'undefined') {
                        max = min;
                    }
                    return cnt >= min && cnt <= max;
                }
            },
            lt: {
                fn: function(element, param) {
                    if (!decimalRegex.test(getValue(element))) {
                        return false;
                    }

                    return (parseFloat(element.value) > parseFloat(param));
                }
            },
            gt: {
                fn: function(element, param) {
                    if (!decimalRegex.test(getValue(element))) {
                        return false;
                    }

                    return (parseFloat(getValue(element)) < parseFloat(param));
                }
            },
            alpha: {
                fn: function(element) {
                    return (alphaRegex.test(getValue(element)));
                }
            },
            alnum: {
                fn: function(element) {
                    return (alphaNumericRegex.test(getValue(element)));
                }
            },
            numeric: {
                fn: function(element) {
                    return (numericRegex.test(getValue(element)));
                }
            },
            integer: {
                fn: function(element) {
                    return (integerRegex.test(getValue(element)));
                }
            },
            decimal: {
                fn: function(element) {
                    return (decimalRegex.test(getValue(element)));
                }
            },
            nozero: {
                fn: function(element) {
                    return (naturalNoZeroRegex.test(getValue(element)));
                }
            },
            url: {
                fn: function(element) {
                    return (urlRegex.test(getValue(element)));
                }
            },
            file: {
                fn: function(element, exts, original) {
                    if (element.type !== 'file') {
                        return true;
                    }

                    var ext = element.value.substr((getValue(element).lastIndexOf('.') + 1)),
                        typeArray = exts.split(';'),
                        inArray = false,
                        i = 0,
                        len = typeArray.length;

                    for (i; i < len; i++) {
                        if (ext === typeArray[i]) {
                            inArray = true;
                            break;
                        }
                    }

                    return inArray;
                }
            },
            filemaxsize: {
                fn: function(element, size, original) {
                    if (element.type !== 'file') {
                        return true;
                    }

                    var total = 0;
                    var value = size.match(/^(\d+)(\w+)?$/i);
                    var units = {
                        b: 1024,
                        kb: Math.pow(1024, 2),
                        mb: Math.pow(1024, 3),
                        gb: Math.pow(1024, 4)
                    };
                    var maxSize = (value[0] | 0) * (units[value[1]] || 1);

                    for (var i = 0; i < element.files.length; i++) {
                        total += element.files[i].size;
                    }

                    return total <= maxSize;
                }
            },
            filemaxcount: {
                fn: function(element, count, original) {
                    var count = count | 0;

                    return element.files.length <= count;
                }
            },
            date: {
                fn: function(element, format) {
                    return dateRegex.test(getValue(element));
                }
            },
            gt_date: {
                fn: function(element, date) {
                    var enteredDate = parseDate(getValue(element)),
                        validDate = parseDate(element.form[date] ? getValue(element.form[date]) : date);

                    if (!validDate || !enteredDate) {
                        return false;
                    }
                    if (enteredDate > validDate) {
                        return true;
                    } else {
                        element.form[date] && (this.currentTarget = element.form[date]);
                        return false;
                    }
                }
            },
            lt_date: {
                fn: function(element, date) {
                    var enteredDate = parseDate(getValue(element)),
                        validDate = parseDate(element.form[date] ? getValue(element.form[date]) : date);

                    if (!validDate || !enteredDate) {
                        return false;
                    }

                    if (enteredDate < validDate) {
                        return true;
                    } else {
                        element.form[date] && (this.currentTarget = element.form[date]);
                        return false;
                    }
                }
            },
            eqgt_date: {
                fn: function(element, date) {
                    var enteredDate = parseDate(getValue(element)),
                        validDate = parseDate(element.form[date] ? getValue(element.form[date]) : date);

                    if (!validDate || !enteredDate) {
                        return false;
                    }

                    if (enteredDate >= validDate) {
                        return true;
                    } else {
                        element.form[date] && (this.currentTarget = element.form[date]);
                        return false;
                    }
                }
            },
            eqlt_date: {
                fn: function(element, date) {
                    var enteredDate = parseDate(getValue(element)),
                        validDate = parseDate(element.form[date] ? getValue(element.form[date]) : date);

                    if (!validDate || !enteredDate) {
                        return false;
                    }

                    if (enteredDate <= validDate) {
                        return true;
                    } else {
                        element.form[date] && (this.currentTarget = element.form[date]);
                        return false;
                    }
                }
            },
            regexp: {
                fn: function(element) {
                    var regstr = element.getAttribute('data-pattern');
                    var regexp = new RegExp(regstr);
                    return regexp.test(getValue(element));
                }
            }
        },
        addRule: function(name, handler) {
            this.rules[name] = handler;
        }
    });

    FormValidator.prototype = {
        constructor: FormValidator,
        _bindInputEvent: function() {
            var els = this.form.elements;
            var el;

            for (var i = -1; el = els[++i];) {
                $(el).on('input paste cut', function(e) {
                    $(this).parent().removeClass('error');
                });
            }
        },
        setMessage: function(rule, message) {
            this.messages[rule] = message;

            return this;
        },
        addValidBefore: function(name, handler) {
            if (name && typeof this.form[name] && handler && typeof handler === 'function') {
                this.befores[name] = handler;
            }
        },
        addValidAfter: function(name, handler) {
            if (name && typeof this.form[name] && handler && typeof handler === 'function') {
                this.afters[name] = handler;
            }
        },
        run: function() {
            var self = this,
                opt = self.options;

            if (!self._validateForm()) {
                opt.onInvalid.call(self.form, self._getLastError());
                if (opt.notifyType !== 'none') {
                    self._showError();
                }
                return false;
            }
            return true;
        },
        _normalizeMessage: function(el, msg, params, data) {
            data = data || {};

            return msg && msg.replace(/\[name\]/ig, function(v, s) {
                return getInputName(el);
            }).replace(/\{([a-z0-9-]+)\}/ig, function(v, s) {
                if (/[0-9]+/.test(s)) {
                    return params[s] || '';
                } else {
                    return el.getAttribute('data-' + s) || data[s] || 'unknown';
                }
            }).replace(/\[([a-z0-9-]+)\]/ig, function(v, s) {
                return el.getAttribute(s) || '';
            }) || 'unknown msg';
        },
        _getLastError: function() {
            return this.errors[this.errors.length - 1];
        },
        _showError: function() {
            if (!this.errors.length) {
                return;
            }

            switch (this.options.notifyType) {
                case 'alert':
                    var error = this._getLastError();
                    var message = this._normalizeMessage(error.el, error.msg || this.messages[error.rule], error.params, error.data);

                    alert(message);
                    error.el.focus();
                    error.el.select();
                    break;
                case 'tooltip':
                    for (var i = 0, len = this.errors.length; i < len; i++) {
                        var error = this.errors[i];
                        var $tooltip = $(this.options.tooltip ? this.options.tooltip(error.el) : $(error.el).next('.message'));
                        var message = this._normalizeMessage(error.el, error.msg || this.messages[error.rule], error.params, error.data);

                        if ($tooltip.length) {
                            $tooltip.html(message);
                        }

                        $(error.el).parent().addClass('error');
                    }
                    this.errors[0].el.focus();
                    if (this.errors[0].el.select) {
                        this.errors[0].el.select();
                    }
                    break;
            }
        },
        _validateForm: function() {
            var self = this,
                elements = self.form.elements,
                success = true,
                fn,
                isStopOnError = self.options.notifyType === 'alert';

            self.errors = [];
            if (!elements.length) {
                return true;
            }


            try {
                for (var i = -1, element; element = elements[++i];) {
                    if ((fn = self.befores[element.name]) && fn.call(self, element) === false) {
                        success = false;
                        break;
                    }

                    if ((!isStopOnError || success) && self._validateField(element)) {
                        if (fn = self.afters[element.name]) {
                            if (fn.call(self, element) === false) {
                                success = false;
                                break;
                            }
                        }
                    } else {
                        success = false;
                        if (isStopOnError) {
                            break;
                        }
                    }
                }
            } catch (ex) {
                console.error(ex);
                return false;
            }

            return success;
        },
        _parseRules: (function() {
            var paramRegex = /^([a-z]+)(?:\((.+)\)$)*/;
            return function(element) {
                var rules = (element.getAttribute('data-valid') || '').split('|'),
                    matches, result = {};

                if (element.hasAttribute('required')) {
                    result['required'] = true;
                    element.removeAttribute('required');
                }

                for (var i = -1, rule;
                    (rule = rules[++i]) && (matches = rule.match(paramRegex));) {
                    result[matches[1]] = {
                        params: matches[2] ? (matches[2] || '').split(/,\s*/g).map(function(val) {
                            return typeof val === 'number' ? val | 0 : val;
                        }) : [],
                        original: rule,
                        data: matches[2]
                    }
                }

                console.log(result);
                return result;
            };
        })(),
        _validateField: function(element) {
            var self = this,
                rules = self._parseRules(element),
                rule;

            for (var name in rules) {
                if (!rules.hasOwnProperty(name)) {
                    continue;
                }
                if (!rules['required'] && !element.value.trim()) {
                    continue;
                }
                if (rule = FormValidator.rules[name]) {
                    delete self['currentTarget'];
                    self.currentData = {};
                    if (!rule.fn.apply(self, [element].concat(rules[name].params))) {
                        self.errors.push({
                            rule: name,
                            el: element,
                            target: self.currentTarget,
                            params: rules[name].params,
                            data: self.currentData
                        });
                        return false;
                    }
                } else {
                    throw new Error('[Validator] ' + name + '는 지원하지 않는 규칙입니다.');
                }
            }

            return true;
        }
    };

    //window.FormValidator = FormValidator;
    /*$.fn.validator = function(options){
        return this.each(function() {
            new FormValidator(this, options);
        });
    };*/
    return FormValidator;
});
/*! 
 * module vcui.vinylc.imageswap 
 * extends vcui.ui.View 
 * description imageswap content 
 * author VinylC UID Group 
 * create 2018-12-05 
 * update 2018-12-05
 */

define('vinylc/imageswap', ['jquery', 'jquery.transit', 'vcui'], function($, transit, core) {
    'use strict';

    var Imageswap = core.ui('Imageswap', {
        bindjQuery: 'imageswap',
        defaults: {
            suffix: '_m768'
        },
        selectors: {
            image: '.ui_image_swap'
        },
        initialize: function initialize(el, options) {
            if (this.supr(el, options) === false) return;

            this.limitSize = vcui.detect.isMobile ? 1024 : 768;

            this._imageSwap();
            this._bindEvent();
        },

        _imageSwap: function() {
            var self = this,
                src, _lastDot, _fileName, _fileExt;

            $.each(self.$image, function(i, item) {
                src = $(item).attr('src');
                _lastDot = src.lastIndexOf('.');
                _fileName = src.substring(0, _lastDot);
                _fileExt = src.substring(_lastDot);
                if (window.innerWidth > self.limitSize && src.indexOf(self.options.suffix) !== -1) {
                    // PC 사이즈에서 Mobile 이미지를 로드한 경우
                    $(item).attr('src', _fileName.replace(self.options.suffix, '') + _fileExt);
                } else if (window.innerWidth <= self.limitSize && src.indexOf(self.options.suffix) === -1) {
                    // Mobile 사이즈에서 PC 이미지를 로드한 경우
                    $(item).attr('src', _fileName + self.options.suffix + _fileExt);
                }
            });
        },

        _bindEvent: function() {
            var self = this;

            $(window).on('resize.swap', function() {
                self._imageSwap();
            });
        }
    });

    return Imageswap;
});
/*!
 * @module vcui.helper.InviewScroll
 * @license MIT License
 * @description InviewScroll 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/inviewScroll', ['jquery', 'vcui'], function($, core) {
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
                offset: {
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0
                },
                threshold: 0 // 0, 0.5, 1
            }, options);

            self.handlers = {
                enter: [],
                move: [],
                leave: []
            };
            self.singles = {
                enter: [],
                move: [],
                leave: []
            };

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
                core.each(opt.on, function(handler, name) {
                    self.on(name, handler);
                });
            }

            if (opt.once) {
                core.each(opt.once, function(handler, name) {
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

            self.handlers[name].forEach(function(handler) {
                handler.apply(self, args);
            });

            while (self.singles[name].length) {
                self.singles[name].pop().apply(self, args);
            }

            return self;
        },
        check: function check() {
            var self = this;

            self.elements.forEach(function(el) {
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
        watchers.forEach(function(watcher) {
            watcher.check();
        });
    }

    function startWatch() {
        $(window).on('resize.inview scroll.inview load.inview', function() {
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
/*!
 * @module vcui.ui.LazyLoader
 * @license MIT License
 * @description LazyLoader 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/lazyLoader', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var LazyLoader = core.ui('LazyLoader', {
        bindjQuery: 'lazyLoader',
        singleton: true,
        defaults: {
            outsect: 100,
            selector: '[data-src]',
            container: window,
            dataAttribute: 'data-src',
            useFade: true
        },

        initialize: function(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            self.largestPositionX = 0;
            self.largestPositionY = 0;
            self.$items = self.$(self.options.selector);
            self.$con = $(self.options.container);

            self._bindEvents();
        },

        _bindEvents: function() {
            var self = this;

            self.$con.on('scroll' + self.eventNS, function() {
                self.run();
            });

            self.run();
        },

        _getContainerSize: function() {
            return {
                height: this.$con.height(),
                width: this.$con.width(),
            };
        },

        _getScrollValue: function() {
            return {
                scrollTop: this.$con.scrollTop(),
                scrollLeft: this.$con.scrollLeft(),
            };
        },

        run: function() {
            var self = this;
            var scrollValue = self._getScrollValue();
            var sizeValue = self._getContainerSize();

            if (scrollValue.scrollLeft >= self.largestPositionX || scrollValue.scrollTop >= self.largestPositionY) {
                self.$items = self.$items.filter(function() {
                    var $el = $(this),
                        offset = $el.offset();

                    if ( /*((scrollValue.scrollLeft + self.options.outsect + sizeValue.width) >= offset.left) && */
                        ((scrollValue.scrollTop + self.options.outsect + sizeValue.height) >= offset.top)) {
                        if (self.options.useFade) {
                            $el.css('opacity', 0);
                        }
                        self._loadImage($el, function() {
                            if (self.options.useFade) {
                                $el.stop().animate({
                                    opacity: 1
                                });
                            }
                        });
                        return false;
                    }
                    return true;
                });
                self.largestPositionX = scrollValue.scrollLeft;
                self.largestPositionY = scrollValue.scrollTop;
            }
        },
        _loadImage: function($el, cb) {
            var src = $el.attr('data-src');

            $el.removeAttr('data-src').addClass('lazyloaded');

            if ($el.get(0).tagName.toLowerCase() === 'img') {
                $el.attr("src", src);

                if ($el[0].complete) {
                    cb.call($el);
                } else {
                    $el.one('load', cb);
                }
            } else {
                $el.css('background-image', "url('" + src + "')");
                cb.call($el);
            }
        },
        update: function() {
            this.$items = this.$items.add(this.$(this.options.selector));
            this.run();
        }
    });

    return LazyLoader;
});
define('ui/locale.common', [], function() {
    return {
        open: 'open!',
        close: 'close',
        play: 'play',
        pause: 'pause',
        stop: 'stop',
        volume: 'volume',
        mute: 'mute',
        unmute: 'unmute',
        facebook: 'facebook',
        twitter: 'twitter',
        kakaotalk: 'kakaotalk',
        kakaostory: 'kakaostory',
        googleplus: 'googleplus',
        pinterest: 'pinterest',
        line: 'line',
        test: {
            open: 'open~',
            close: '{{name}} close'
        }
    };
});
define('ui/locale.en-US', [], function() {
    return {
        open: 'open!',
        close: 'close',
        play: 'play',
        pause: 'pause',
        stop: 'stop',
        volume: 'volume',
        mute: 'mute',
        unmute: 'unmute',
        facebook: 'facebook',
        twitter: 'twitter',
        kakaotalk: 'kakaotalk',
        kakaostory: 'kakaostory',
        googleplus: 'googleplus',
        pinterest: 'pinterest',
        line: 'line',
        test: {
            open: 'open~',
            close: '{{name}} close'
        }
    };
});
define('ui/locale.ja', [], function() {
    return {
        open: 'open!',
        close: 'close',
        play: 'play',
        pause: 'pause',
        stop: 'stop',
        volume: 'volume',
        mute: 'mute',
        unmute: 'unmute',
        facebook: 'facebook',
        twitter: 'twitter',
        kakaotalk: 'kakaotalk',
        kakaostory: 'kakaostory',
        googleplus: 'googleplus',
        pinterest: 'pinterest',
        line: 'line',
        test: {
            open: 'open~',
            close: '{{name}} close'
        }
    };
});
define('ui/locale.ko-KR', [], function() {
    return {
        open: '열기!',
        close: '닫기!',
        play: '재생',
        pause: '일시정지',
        stop: '정지',
        volume: '볼륨',
        mute: '음소거',
        unmute: '음소거 해제',
        facebook: '페이스북',
        twitter: '트위터',
        kakaotalk: '카카오톡',
        kakaostory: '카카오스토리',
        googleplus: '구글플러스',
        pinterest: '핀터레스트',
        line: '라인',
        test: {
            open: 'open~',
            close: '{{name}} 닫기'
        }
    };
});
define('ui/locale.zh', [], function() {
    return {
        open: 'open!',
        close: 'close',
        play: 'play',
        pause: 'pause',
        stop: 'stop',
        volume: 'volume',
        mute: 'mute',
        unmute: 'unmute',
        facebook: 'facebook',
        twitter: 'twitter',
        kakaotalk: 'kakaotalk',
        kakaostory: 'kakaostory',
        googleplus: 'googleplus',
        pinterest: 'pinterest',
        line: 'line',
        test: {
            open: 'open~',
            close: '{{name}} close'
        }
    };
});
/*!
 * @module vcui.ui.Modal
 * @license MIT License
 * @description 모달 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/modal', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var $doc = $(document),
        $win = $(window),
        detect = core.detect,
        ui = core.ui,
        isTouch = detect.isTouch,
        _zIndex = 9000;

    var ModalManager = {
        templates: {
            wrap: '<div class="ui_modal_wrap" style="position:fixed;top:0;left:0;right:0;bottom:0;overflow:auto;"></div>',
            dim: '<div class="ui_modal_dim" style="position:fixed;top:0;left:0;bottom:0;right:0;background:#000;"></div>',
            modal: '<div class="ui_modal ui_modal_ajax" style="display:none"></div>'
        },
        options: {
            opacity: 0.6
        },
        init: function init(options) {
            var self = this;

            self.options = core.extend(self.options, options);
            self.stack = [];
            self.active = null;

            self._bind();
        },

        _bind: function _bind() {
            var self = this;

            $win.on('resizeend.modalmanager', function() {
                for (var i = -1, modal; modal = self.stack[++i];) {
                    modal.isShown && modal.center();
                }
            });

            $doc.on('modalshow.modalmanager', '.ui_modal_container', self._handleModalShow.bind(self))
                .on('modalhidden.modalmanager', '.ui_modal_container', self._handleModalHidden.bind(self))
                .on('modalhide.modalmanager', '.ui_modal_container', self._handleModalHide.bind(self))
                .on('focusin.modalmanager', self._handleFocusin.bind(self))
                .on('click.modalmanager', '[data-control=modal]', self._handleClick.bind(self))
                .on('click.modalmanager', '.ui_modal_dim', self._handleDimClick.bind(self))
                .on('modalHideFromOutter', self._handleHideFromOutter.bind(self));
        },
        _handleHideFromOutter:function(){
            var self = this;
            var leng = self.stack.length;
            var modal;
            if (leng > 0) {
                for(var i=0;i<leng;i++){
                    modal = self.stack[i];

                    var isAlert = $(modal.$el).hasClass('alert');
                    if(!isAlert) modal.close();
                }
            }
        },
        _handleModalHide: function _handleModalHide(e) {
            var self = this;

            // 모달이 전부 닫힐 때 document에 알린다.
            if (self.stack.length === 1) {
                $(document).triggerHandler('modallastbeforeclose');
            }
        },
        _handleModalShow: function _handleModalShow(e) {
            var self = this,
                $modal = $(e.currentTarget),
                modal = $modal.vcModal('instance'),
                zIndex = self.nextZIndex();

            if (!modal.$el.parent().hasClass('ui_modal_wrap')) {
                modal.$el.wrap(self.templates.wrap);
                modal.$el.before($(self.templates.dim).css(modal.options.dimStyle));
            }
            modal.$el && modal.$el.parent().css('zIndex', zIndex++);

            self.active = modal;
            self.add(modal);
            if (self.stack.length === 1) {
                $(document).triggerHandler('modalfirstopen');
            }
        },
        _handleModalHidden: function _handleModalHidden(e) {
            var self = this,
                $modal = $(e.currentTarget),
                modal = $modal.vcModal('instance');

            modal.$el.siblings('.ui_modal_dim').remove();
            modal.$el.unwrap();
            self.revertZIndex();
            self.remove(modal);

            if (self.stack.length) {
                self.active = self.stack[self.stack.length - 1];
            } else {
                self.active = null;
                $(document).triggerHandler('modallastclose');
            }
        },
        _handleFocusin: function _handleFocusin(e) {
            var self = this;

            if (!self.active) {
                return;
            }
            if (self.active.$el[0] !== e.target && !$.contains(self.active.$el[0], e.target)) {
                //self.active.$el.find(':focusable').first().focus();
                self.active.$el.focus();
                e.stopPropagation();
            }
        },
        _handleClick: function _handleClick(e) {
            e.preventDefault();

            var self = this,
                $el = $(e.currentTarget),
                target = $el.attr('href') || $el.attr('data-href'),
                $modal;

            if (target) {
                // ajax형 모달인 경우
                if (!/^#/.test(target)) {
                    if ($el.data('fetching')) {
                        return;
                    }

                    $el.data('fetching', true);
                    if (self.ajaxModalXHR) {
                        self.ajaxModalXHR.abort();
                        self.ajaxModalXHR = null;
                    }

                    self.ajaxModalXHR = $.ajax({
                        url: target
                    }).done(function(html) {
                        $modal = ModalManager.getRealModal(html);

                        $modal.addClass('ui_modal_ajax').hide().appendTo('body').vcModal(core.extend({
                                removeOnClose: true,
                                opener: $el[0]
                            }, $el.data()))
                            .on('modalhidden', function(e) {
                                $modal.off('modalhidden');
                            });
                    }).always(function() {
                        self.ajaxModalXHR = null;
                        $el.removeData('fetching');
                    });
                } else {
                    // 인페이지 모달인 경우
                    $(target)
                        .vcModal(core.extend({
                            opener: $el[0]
                        }, $el.data()))
                       .vcModal('open')
                        .on('modalhidden', function(e) {
                            $(this).off('modalhidden');
                        });
                }
            }
        },
        _handleDimClick: function _handleDimClick(e) {
            var $dim = $(e.currentTarget);
            if ($dim.hasClass('ui_modal_dim')) {
                var modal = $dim.siblings('.ui_modal_container').vcModal('instance');
                if (modal.getOption('closeByDimmed') === true) {
                    modal.close();
                }
            }
        },
        add: function add(modal) {
            this.stack.push(modal);
        },
        remove: function remove(modal) {
            this.stack = core.array.remove(this.stack, modal);
        },
        nextZIndex: function nextZIndex() {
            var zi = _zIndex;
            _zIndex += 2;
            return zi;
        },
        revertZIndex: function revertZIndex() {
            _zIndex -= 2;
        },
        getRealModal: function(html) {
            var $tmp = $(html);

            if ($tmp.length > 1) {
                for (var i = 0, len = $tmp.length; i < len; i++) {
                    if ($tmp[i].nodeType === Node.ELEMENT_NODE) {
                        return $tmp.eq(i).hide();
                    }
                }
            }
            return $tmp.hide();
        }
    };
    ModalManager.init();


    function setVoiceOverFocus(element) {
        var focusInterval = 10; // ms, time between function calls
        var focusTotalRepetitions = 10; // number of repetitions

        element.setAttribute('tabindex', '0');
        element.blur();

        var focusRepetitions = 0;
        var interval = window.setInterval(function() {
            element.focus();
            focusRepetitions++;
            if (focusRepetitions >= focusTotalRepetitions) {
                window.clearInterval(interval);
            }
        }, focusInterval);
    }

    // Modal
    // ////////////////////////////////////////////////////////////////////////////
    /**
     * 모달 클래스
     * @class
     * @name vcui.ui.Modal
     * @extends vcui.ui.View
     */
    var Modal = ui('Modal', /** @lends vcui.ui.Modal# */ {
        bindjQuery: 'modal',
        defaults: {
            overlay: true,
            clone: true,
            closeByEscape: true,
            removeOnClose: false,
            closeByDimmed: true,
            draggable: true,
            dragHandle: 'header h1',
            show: true,
            fullMode: false,
            effect: 'fade', // slide | fade
            cssTitle: '.ui_modal_title',
            useTransformAlign: true,
            variableWidth: true,
            variableHeight: true,
            dimStyle: {
                opacity: 0.6,
                backgroundColor: '#000'
            }
        },

        events: {
            'click button[data-role], a[data-role]': function clickButtonDataRole(e) {
                var self = this,
                    $btn = $(e.currentTarget),
                    role = $btn.attr('data-role') || '',
                    ev;

                e.preventDefault();

                if (role) {
                    self.trigger(ev = $.Event('modal' + role), [self]);
                    if (ev.isDefaultPrevented()) {
                        return;
                    }
                }

                this.close();
            },
            'click .ui_modal_close': function clickUi_modal_closeui_modal_close(e) {
                e.preventDefault();
                e.stopPropagation();

                this.close();
            }
        },
        /**
         * 생성자
         * @param {String|Element|jQuery} el
         * @param {Object} options
         * @param {Boolean}  options.overlay:true 오버레이를 깔것인가
         * @param {Boolean}  options.clone: true    복제해서 띄울 것인가
         * @param {Boolean}  options.closeByEscape: true    // esc키를 눌렀을 때 닫히게 할 것인가
         * @param {Boolean}  options.removeOnClose: false   // 닫을 때 dom를 삭제할것인가
         * @param {Boolean}  options.draggable: true                // 드래그를 적용할 것인가
         * @param {Boolean}  options.dragHandle: 'h1.title'     // 드래그대상 요소
         * @param {Boolean}  options.show: true                 // 호출할 때 바로 표시할 것인가...
         */
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            self.$el.addClass('ui_modal_container').attr('role', 'document');

            self.isShown = false;
            self.originalStyle = self.$el.attr('style');
            self._originalDisplay = self.$el.css('display');

            if (/[0-9]+px/.test(self.$el[0].style.left)) {
                self.options.variableWidth = false;
            }

            if (/[0-9]+px/.test(self.$el[0].style.top)) {
                self.options.variableHeight = false;
            }

            if (self.options.show) {
            	core.util.waitImageLoad(self.$('img'), true).done(function() {
            		self.show();
            	});
            }

            if (!self.options.opener) {
                self.options.opener = document.activeElement;
            }

            self._bindAria(); // aria 셋팅
        },

        _bindAria: function _bindAria() {
            var self = this;
            // TODO
            self.$el.attr({
                'role': 'dialog',
                'aria-hidden': 'false',
                'aria-describedby': self.$('section').attr('id') || self.$('section').attr('id', self.cid + '_content').attr('id'),
                'aria-labelledby': self.$('h1').attr('id') || self.$('h1').attr('id', self.cid + '_title').attr('id')
            });
        },
        /**
         * zindex때문에 모달을 body바로 위로 옮긴 후에 띄우는데, 닫을 때 원래 위치로 복구시켜야 하므로,
         * 원래 위치에 임시 홀더를 만들어 놓는다.
         * @private
         */
        _createHolder: function _createHolder() {
            var self = this;

            if (self.$el.parent().is('body')) {
                return;
            }

            self.$holder = $('<span class="ui_modal_holder" style="display:none;"></span>').insertAfter(self.$el);
            self.$el.appendTo('body');
        },
        /**
         * 원래 위치로 복구시키고 홀더는 제거
         * @private
         */
        _replaceHolder: function _replaceHolder() {
            var self = this;

            if (self.$holder) {
                self.$el.insertBefore(self.$holder);
                self.$holder.remove();
            }
        },

        getOpener: function getOpener() {
            return $(this.options.opener);
        },

        /**
         * 토글
         */
        toggle: function toggle() {
            var self = this;

            self[self.isShown ? 'hide' : 'show']();
        },

        /**
         * 표시
         */
        show: function show() {
            if (this.isShown) {
                this.layout();
                return;
            }

            var self = this,
                opts = self.options,
                showEvent = $.Event('modalshow');


            // 열릴때 body로 옮겼다가, 닫힐 때 다시 원복하기 위해 임시요소를 넣어놓는다.
            self._createHolder();
            self.trigger(showEvent);
            if (showEvent.isDefaultPrevented()) {
                self._replaceHolder();
                return;
            }

            self.isShown = true;
            self.layout();

            if (opts.title) {
                self.$(opts.cssTitle).html(opts.title || '알림');
            }

            var defer = $.Deferred();
            if (opts.effect === 'fade') {
                setTimeout(function() {
                    self.$el.stop().fadeIn('slow', function() {
                        defer.resolve();
                    });
                });
            } else if (opts.effect === 'slide') {
                self.$el.stop().css('top', -self.$el.height()).animate({
                    top: '50%'
                }, function() {
                    defer.resolve();
                });
            } else {
                self.$el.show();
                defer.resolve();
            }

            defer.done(function() {
                self.layout();

                self.trigger('modalshown', {
                    module: self
                });

                //////$('body').attr('aria-hidden', 'true');    // body를 비활성화(aria)
                self._draggabled(); // 드래그 기능 빌드
                self._escape(); // esc키이벤트 바인딩

                self.on('mousewheel DOMMouseScroll wheel', function(e) {
                    e.stopPropagation();
                });

                var $focusEl = self.$el.find('[data-autofocus=true]');

                // 레이어내에 data-autofocus를 가진 엘리먼트에 포커스를 준다.
                if ($focusEl.length > 0) {
                    $focusEl.eq(0).focus();
                } else {
                    self.$el.attr('tabindex', 0).focus();
                }

                // 버튼
                /**************if (me.options.opener) {
                    var modalid;
                    if (!(modalid = me.$el.attr('id'))) {
                        modalid = 'modal_' + core.getUniqId(16);
                        me.$el.attr('id', modalid);
                    }
                    $(me.options.opener).attr('aria-controls', modalid);
                }**********/
            });
        },

        /**
         * 숨김
         */
        hide: function hide(e) {
            if (e) {
                e.preventDefault();
            }

            var self = this;
            var isAjaxModal = self.$el.hasClass('ui_ajax_modal');

            e = $.Event('modalhide');
            self.trigger(e);
            if (!self.isShown || e.isDefaultPrevented()) {
                return;
            }

            var defer = $.Deferred();
            self.isShown = false;
            if (self.options.effect === 'fade') {
                self.$el.fadeOut('fast', function() {
                    defer.resolve();
                });
            } else if (self.options.effect === 'slide') {
                self.$el.animate({
                    top: -self.$el.outerHeight()
                }, function() {
                    defer.resolve();
                });
            } else {
                self.$el.hide();
                defer.resolve();
            }

            defer.done(function() {
                self.trigger('modalhidden');
                self.docOff();
                self.winOff();
                self.$el.off()
                    .removeData('ui_modal')
                    .attr('style', self.originalStyle)
                    .removeAttr('ui-modules aria-hidden role tabindex')
                    .removeClass('ui_modal_container');

                self._escape(); // esc 키이벤트 제거
                self._replaceHolder(); // body밑으로 뺀 el를 다시 원래 위치로 되돌린다.

                if (self.options.removeOnClose) {
                    self.$el.remove(); // 닫힐 때 dom에서 삭제하도록 옵션이 지정돼있으면, dom에서 삭제한다.
                }
                if (self.options.opener) {
                    $(self.options.opener).removeAttr('aria-controls').focus(); // 레이어팝업을 띄운 버튼에 포커스를 준다.
                }
                //:if (self.$overlay) {
                //:    self.$overlay.remove(), self.$overlay = null;    // 오버레이를 제거
                //:}
                ////// $('body').removeAttr('aria-hidden');    // 비활성화를 푼다.
                if (isAjaxModal) {
                    self.destroy();
                }
            });
        },

        _scrollHeight: function() {
            var self = this;
            var scrollHeight = Math.round(self.$el.css('min-height', '').prop('scrollHeight'));
            if (scrollHeight % 2 !== 0) {
                scrollHeight += 1;
            }
            return scrollHeight;
        },

        /**
         * 도큐먼트의 가운데에 위치하도록 지정
         */
        layout: function layout() {
            if (!this.isShown) {
                return;
            }

            var self = this,
                width,
                height,
                css,
                isOverHeight,
                isOverWidth,
                winHeight = core.dom.getWinHeight(),
                winWidth = core.dom.getWinWidth(),
                scrollHeight = self._scrollHeight();

            width = self.$el.outerWidth();
            height = self.$el.outerHeight();
            isOverHeight = height > winHeight;
            isOverWidth = width > winWidth;
            css = {
                //display: 'block',
                position: 'absolute',
                //backgroundColor: '#ffffff',
                //outline: 'none',
                minHeight: scrollHeight,
                backgroundClip: 'padding-box' //,
                //top: top = isOverHeight ? '0%' : '50%'//,
                //left: left = isOverWidth ? '0%' : '50%'
            };

            css.transform = '';
            if (self.options.variableWidth !== false) {
                css.left = isOverWidth ? '0%' : '50%';
                if (self.options.useTransformAlign) {
                    css.transform += 'translateX(-' + css.left + ') ';
                } else {
                    css.marginLeft = isOverWidth ? '' : Math.ceil(width / 2) * -1;
                }
            }

            if (self.options.variableHeight !== false) {
                if (self.options.alignTop) {
                    css.top = '0%';
                } else {
                    css.top = isOverHeight ? '0%' : '50%';
                    if (self.options.useTransformAlign) {
                        css.transform += 'translateY(-' + css.top + ') ';
                    } else {
                        css.marginTop = isOverHeight ? '' : Math.ceil(height / 2) * -1;
                    }
                }
            }

            self.$el.stop().css(css);
        },

        /**
         * 타이틀 영역을 드래그기능 빌드
         * @private
         */
        _draggabled: function _draggabled() {
            var self = this,
                options = self.options;

            if (!options.draggable || self.bindedDraggable) {
                return;
            }
            self.bindedDraggable = true;

            if (options.dragHandle) {
                self.$el.css('position', 'absolute');
                core.css3.prefix('user-select') && self.$(options.dragHandle).css(core.css3.prefix('user-select'), 'none');
                self.on('mousedown touchstart', options.dragHandle, function(e) {
                    e.preventDefault();

                    var isMouseDown = true,
                        pos = self.$el.position(),
                        oriPos = {
                            left: e.pageX - pos.left,
                            top: e.pageY - pos.top
                        },
                        _handler;

                    $doc.on(self.makeEventNS('mousemove mouseup touchmove touchend touchcancel'), _handler = function handler(e) {
                        switch (e.type) {
                            case 'mousemove':
                            case 'touchmove':
                                if (!isMouseDown) {
                                    return;
                                }
                                self.$el.css({
                                    left: e.pageX - oriPos.left,
                                    top: e.pageY - oriPos.top
                                });
                                break;
                            case 'mouseup':
                            case 'touchend':
                            case 'touccancel':
                                isMouseDown = false;
                                $doc.off(self.getEventNS(), _handler);
                                break;
                        }
                    });
                });

                self.$(options.dragHandle).css('cursor', 'move');
            }
        },

        /**
         * esc키를 누를 때 닫히도록
         * @private
         */
        _escape: function _escape() {
            if (isTouch) {
                return;
            }
            var self = this;

            if (self.isShown && self.options.closeByEscape) {
                self.docOff('keyup');
                self.docOn('keyup', function(e) {
                    if (e.which === 27) {
                        e.stopPropagation();
                        self.hide();
                    }
                });
            } else {
                self.docOff('keyup');
            }
        },

        /**
         * 모달의 사이즈가 변경되었을 때 가운데위치를 재조절
         * @example
         * $('...').modal(); // 모달을 띄운다.
         * $('...').find('.content').html( '...');  // 모달내부의 컨텐츠를 변경
         * $('...').modal('center');    // 컨텐츠의 변경으로 인해 사이즈가 변경되었으로, 사이즈에 따라 화면가운데로 강제 이동
         */
        center: function center() {
            this.layout();
        },

        /**
         * 열기
         */
        open: function open() {
            this.show();
        },

        /**
         * 닫기
         */
        close: function close() {
            this.hide();
        },

        /**
         *
         */
        destroy: function destroy() {
            var self = this;

            self.supr();
        }
    });

    /**
     * 열려 있는 레이어팝업을 가운데에 위치시키는 글로벌이벤트
     * @example
     * vcui.PubSub.trigger('resize:modal')
     */
    /*core.PubSub.on('resize:modal', function() {
     if(Modal.active){
     Modal.active.center();
     }
     });*/

    //윈도우가 리사이징 될때 가운데에 자동으로 위치시킴
    /*$(window).on('resize.modal', function() {
     if(Modal.active){
     Modal.active.center();
     }
     });*/

    core.modal = function(el, options) {
        $(el).vcModal(options);
    };

    /**
     * @class
     * @name vcui.ui.AjaxModal
     * @description ajax로 불러들인 컨텐츠를 모달로 띄워주는 모듈
     * @extends vcui.ui.View
     */
    var fetchingUrls = {};
    core.ui.ajaxModal = function(ajaxOptions, options) {
        if (typeof ajaxOptions === 'string') {
            ajaxOptions = {
                url: ajaxOptions
            };
        }

        if (!options) {
            options = {};
        }

        if (!options.opener) {
            if ($(document.activeElement).is('a, button')) {
                options.opener = document.activeElement;
            } else {
                options.opener = document.body;
            }
        }

        if (fetchingUrls[ajaxOptions.url]) {
            return fetchingUrls[ajaxOptions.url];
        }

        fetchingUrls[ajaxOptions.url] = $.ajax(ajaxOptions).then(function(html) {
            var $modal = ModalManager.getRealModal(html).appendTo('body').data('removeOnClose', true);
            return $modal.vcModal(core.extend({}, options, {
                removeOnClose: true,
                events: {
                    modalshown: function() {
                        delete fetchingUrls[ajaxOptions.url];
                    },
                    modalhidden: function() {
                        $(options.opener).focus();
                    }
                }
            }));
        });

        return fetchingUrls[ajaxOptions.url];
    };

    core.ui.alert = function() {
        /**
         * 얼럿레이어
         * @memberOf vcui.ui
         * @name alert
         * @function
         * @param {string} msg 얼럿 메세지
         * @param {Object} options 모달 옵션
         * @example
         * vcui.ui.alert('안녕하세요');
         */
        return function(msg, options) {
            if (typeof msg !== 'string' && arguments.length === 0) {
                options = msg;
                msg = '';
            }
            var el = $(core.ui.alert.tmpl).appendTo('body').find('div.ui_modal_content').html(msg).end();
            var modal = $(el).vcModal(core.extend({
                removeOnClose: true
            }, options)).vcModal('instance');
            modal.getElement().buildUIControls();
            modal.on('modalhidden', function() {
                el = null;
                modal = null;
            });
            return modal;
        };
    }();
    core.ui.alert.tmpl = ['<div class="layer_popup small ui_alert" role="alert" style="display:none">', '<h1 class="title ui_modal_title">알림창</h1>', '<div class="cntt">', '<div class="ui_modal_content">&nbsp;</div>', '<div class="wrap_btn_c">', '<button type="button" class="btn_emphs_small" data-role="ok"><span><span>확인</span></span></button>', '</div>', '</div>', '<button type="button" class="ui_modal_close"><span>닫기</span></button>', '<span class="shadow"></span>', '</div>'].join('');
    ///////////////////////////////////////////////////////////////////////////////////////

    return Modal;
});
/*!
 * @module vcui.ui.MoreLoader
 * @license MIT License
 * @description MoreLoader 컴포넌트
 * @copyright VinylC UID Group.
 */
define(
    'ui/moreLoader', ['jquery', 'vcui'],
    function($, core) {
        "use strict";

        //  사용법
        /*$('#btnMoreLoad').vcMoreLoader({ // 더보기 버튼에 빌드
            list: '#uiBoardList',       // 리스트 요소
            dataSource: function () {   // ajax 를 직접 컨트롤. 결과로 받은 html
        문자열을 list에 append 해준다.
                return $.ajax({
                    url: 'GR3.4_ajax_01.html',
                    data: {
                        categoty: $('#uiCategoryTab').vcTab('getSelectedValue'),
                        lastid: $('#uiBoardList>li:last').data('id'),
                        keyword: $('#search_txt').val()
                    }
                });
            }
        });*/

        return core.ui('MoreLoader', {
            bindjQuery: true,
            selectors: {},
            defaults: {
                type: 'html',
                dataSource: null, // ajax 객체를 받을 콜백함수
                //autofillEven: false,
                list: '.ui_moreloader_list', // 리스트 요소
                onBeforeSend: core.noop,
                onSuccess: core.noop, // 성공적으로 로드됐을 때 호출되는 콜백함수
                onRendered: core.noop, // list 에 append한 후에 호출
                onError: core.noop, // ajax가 에러가 났을 때
                onComplete: core.noop, // ajax가 에러여부에 상관없이 완료됐을 때
                onLoading: core.noop, // ajax가 로딩중일 때
                onLoaded: core.noop, //
                onEmpty: core.noop
            },
            initialize: function(el, options) {
                var self = this;

                if (self.supr(el, options) === false) {
                    return;
                }

                self.disabled = false;
                self.$wrap = $(self.options.target);
                self.$list = self.$wrap.find(self.options.list);
                self.$el.attr('role', 'button').attr('aria-label', '더보기');

                self._bindEvents();
                self.load();
            },
            _bindEvents: function() {
                var self = this,
                    o = self.options;

                // 더보기 클릭시
                self.on('click', function(e) {
                    e.preventDefault();

                    self.load(true).then(function() {
                        if (self.$newFirst[0]) {
                            self.$newFirst.attr('tabindex', -1).focus();
                            setTimeout(function() {
                                self.$newFirst.removeAttr('tabindex');
                            });
                        }
                    });
                });
            },
            _fetch: function(isMore) {
                var self = this,
                    o = self.options;

                if (self.xhr || self.disabled) {
                    return self.xhr;
                }

                o.onBeforeSend.call(self, isMore);
                self.loading = true;
                self.$el.prop('disabled', true);
                self.$wrap.addClass('loading');

                return self.xhr =
                    o.dataSource.call(self, isMore)
                    .done(function(html) {
                        var $html = $('<ul>').append(html);
                        var isBlank = $html.children().length === 0;

                        if (isBlank) {
                            self._renderButton(false);
                            self.setEnabled(false);
                            if (!isMore) {
                                self.$wrap.addClass('no_items');
                                o.onEmpty.call(self, false);
                            }
                            return;
                        }

                        if (o.onSuccess.apply(self, core.toArray(arguments)) === false) {
                            $html = null;
                            return;
                        }

                        if (!isMore) {
                            self.$list.empty();
                        }

                        self.$newFirst = $html.children().first(); // 접근성. 새로 추가된 항목에 포커싱
                        self.$list.append($html.children()).buildCommonUI();
                        self.$wrap.removeClass('no_items');

                        self._renderButton();
                        self.setEnabled(true);

                        o.onRendered.apply(self, core.toArray(arguments));
                        !isMore && o.onEmpty.call(self, true);
                    })
                    .error(function() {
                        o.onError.apply(self, core.toArray(arguments));
                    })
                    .always(function() {
                        o.onComplete.apply(self, core.toArray(arguments));
                        self.$el.prop('disabled', false);
                        self.$wrap.removeClass('loading');
                        self.loading = false;
                        self.xhr = null;
                    });
            },
            /**
             * 상황에 따라 더보기 토글
             * @param flag
             * @private
             */
            _renderButton: function(flag) {
                if (arguments.length) {
                    this.$wrap.toggleClass('has_more', flag);
                    return;
                }

                var self = this;
                var $items = self.getItems();
                var $last;

                if ($items.length) {
                    $last = $items.last();

                    var loadedCount = $items.length;
                    var totalCount = $last.data('total') || 0;

                    //self.$el.toggle(loadedCount < totalCount);
                    self.$wrap.toggleClass('has_more', loadedCount < totalCount);
                } else {
                    //self.$el.hide();
                    self.$wrap.toggleClass('has_more', false);
                }
            },
            /**
             * 아이템 조회
             * @return {*}
             */
            getItems: function() {
                return this.$list.children('[data-id]');
            },
            /**
             * 마지막 아이템의 id 추출
             * @return {*}
             */
            getLastId: function() {
                return this.getItems().last().data('id');
            },
            /**
             * 리스트 조회
             * @param isMore
             * @return {*}
             */
            load: function(isMore) {
                var self = this,
                    opts = self.options;

                if (self.disabled) {
                    return;
                }

                return self._fetch(isMore);
            },
            clear: function() {
                this.$list.empty();
            },
            /**
             * 기존 데이타 지우고 새로 리스트를 불러옴
             */
            cleanAndLoad: function() {
                this.setEnabled(true);
                this.load();
            },

            setEnabled: function(flag) {
                this.disabled = !flag;
            }
        });
    });
define('ui/responseCarousel', ['jquery', 'vcui', 'ui/carousel'],
    function($, core) {
        /**
         * 반응형 배너
         */
        return core.ui('ResponseCarousel', {
            bindjQuery: true,
            initialize: function(el, options) {
                var self = this;

                // 이미 배너가 빌드되어 있으면 무시
                if ($(el).hasClass('ui_carousel_initialized')) {
                    return;
                }

                if (self.supr(el, options) === false) {
                    return;
                }

                self._build();
            },
            _build: function() {
                var self = this;
                var o = self.options;
                var mobileSettings = {};
                var pcSettings = {};

                if (o.pc) {
                    // pc모드일 때의 배너옵션
                    if (isNaN(o.pc)) {
                        if (o.pc.variableWidth) {
                            pcSettings.slidesToShow = 1;
                        }
                        core.extend(pcSettings, o.pc);
                    } else {
                        pcSettings = {
                            infinite: true,
                            centerMode: false,
                            centerPadding: '0px',
                            slidesToShow: o.pc,
                            slidesToScroll: o.pc
                        };
                    }
                    delete o.pc;
                }
                pcSettings.speed = 800;
                core.extend(pcSettings, o);

                if (o.mobile) {
                    // 모바일 모드일 때의 배너 옵션
                    if (isNaN(o.mobile)) {
                        if (o.mobile.variableWidth) {
                            mobileSettings.slidesToShow = 1;
                        }
                        core.extend(mobileSettings, {
                                centerMode: true,
                                centerPadding: 0,
                                slidesToShow: 1,
                                slidesToScroll: 1
                            },
                            o.mobile);
                    } else {
                        mobileSettings = {
                            infinite: true,
                            centerMode: o.mobile === 1,
                            centerPadding: 0,
                            slidesToShow: o.mobile,
                            slidesToScroll: o.mobile,
                        }
                    }
                    delete o.mobile;
                }
                mobileSettings.speed = 400;
                core.extend(mobileSettings, o);

                // 배너 생성
                self.$el.vcCarousel(core.extend({
                        // arrows: false,
                        responsive: [{
                                breakpoint: 99999,
                                settings: pcSettings
                            },
                            {
                                breakpoint: 768,
                                settings: mobileSettings
                            }
                        ]
                    },
                    o));
            }
        });
    });
/*!
 * @module vcui.helper.ResponseImage
 * @license MIT License
 * @description 반응형에 따라 해당이미지를 로드해주는 헬퍼
 * @copyright VinylC UID Group
 */
define('ui/responsiveImage', ['jquery', 'vcui'], function($, core) {
    "use strict";

    var getBg = function(el) {
        var style = el.currentStyle || window.getComputedStyle(el, false);
        return style.backgroundImage.slice(4, -1).replace(/"|'/g, "");
    };

    /**
     * class vcui.helper.ResponsiveImage
     * 창 사이드에 따라 img 태그의 data-src-mobile, data-src-pc 속성에서 알맞는 이미지로 교체
     */
    var ResponsiveImage = core.ui('ResponsiveImage', {
        bindjQuery: true,
        defaults: {
            breakpoints: {
                mobile: 768,
                pc: 100000
            }
        },
        $singleton: true,
        $statics: {
            run: function($el) {
                var currentMode = window.breakpoint.name;
                var $items = $el.find('[data-src-pc], [data-src-mobile]');


                $items.each(function() {
                    var src = this.getAttribute('data-src-' + currentMode);
                    var tagName = this.tagName.toLowerCase();

                    if (!src ||
                        (tagName === 'img' && this.src === src) ||
                        (tagName !== 'img' && getBg(this) === src)) {
                        return;
                    }
                    switch (tagName) {
                        case 'img':
                            this.src = src;
                            break;
                        default:
                            this.style.backgroundImage = 'url(' + src + ')';
                            break;
                    }
                });
            }
        },
        initialize: function(el, options) {
            var self = this;
            if (self.supr(el, options) === false) return;

            ResponsiveImage.breakpoints = self.options.breakpoints;
            self.$items = $();
            self._bindEvents();
        },

        _makeSelector: function() {
            var self = this;
            self.selector = '';
            core.each(core.object.keys(this.options.breakpoints), function(name) {
                if (self.selector) {
                    self.selector += ',';
                }
                self.selector += '[data-src-' + name + ']'
            });
        },

        _bindEvents: function() {
            var self = this;
            $(window).on('resize.responsiveimage orientationchange.responsiveimage load.responsiveimage',
                core.throttle(self._handleResize.bind(self), 50)
            );
            self._handleResize();
        },

        _handleResize: function() {
            var self = this;
            var currentMode = window.breakpoint.name;
            if (currentMode === self.prevMode) return;
            self.prevMode = currentMode;
            ResponsiveImage.run(self.$el);
        }
    });

    return ResponsiveImage;
});
/*!
 * @module vcui.ui.SmoothScroll
 * @license MIT License
 * @description SmoothScroll 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/smoothScroll', ['jquery', 'vcui'], function($, core) {
    "use strict";
    /*! iScroll v5.1.2 ~ (c) 2008-2014 Matteo Spinelli ~ http://cubiq.org/license
     */
    var rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame || function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    var _elementStyle = document.createElement('div').style;
    var _vendor = function() {
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
                setTimeout(function() {
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
            self.$items.each(function() {
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
                    .on('click' + self.eventNS, function(e) {
                        e.preventDefault();
                        self.prevPage();
                    });

                (self.$nextButton = $(opt.nextButton)).addClass('disabled')
                    .on('click' + self.eventNS, function(e) {
                        e.preventDefault();
                        self.nextPage();
                    });

                self.on('smoothscrollend',
                    function(e, data) {
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
                self.winOn('resize', core.delayRun(function() {
                        if (self.el) {
                            self.refresh();
                        }
                    },
                    self.options.resizePolling));
            }

            self.winOne('load', function() {
                self._activateButtons();
            })
        },

        _initWheel: function _initWheel() {
            var self = this;

            self._handle(self.$wrapper, 'wheel');
            self._handle(self.$wrapper, 'mousewheel');
            self._handle(self.$wrapper, 'DOMMouseScroll');
        },

        moveFirst: function() {
            this.scrollTo(0, 0, 200);
        },

        moveLast: function() {
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
            self.wheelTimeout = setTimeout(function() {
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

        _focusin: function(e) {
            var self = this;
            var $target = $(e.target);

            self.$scroller.children().each(function() {
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

        scrollToActive: function(time, easing) {
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

            if ( /*!self.isBadAndroid && */ self.preventDefaultException(e.target)) {
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

        update: function() {
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
/*!
 * @module vcui.ui.Tab
 * @license MIT License
 * @description 탭 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/tab', ['jquery', 'vcui', 'ui/smoothScroll'], function($, core) {
    "use strict";

    var name = 'tab',
        eventBeforeChange = name + 'beforechange',
        eventChanged = name + 'change',
        selectedClass = 'on';

    var prefixClass = '.ui_tab_';
    /**
     * @class
     * @name vcui.ui.Tab
     * @description 페이징모듈
     * @extends vcui.ui.View
     */
    var Tab = core.ui('Tab', /** @lends vcui.ui.Tab# */ {
        bindjQuery: 'tab',
        $statics: /** @lends vcui.ui.Tab */ {
            ON_CHANGE: eventBeforeChange,
            ON_CHANGED: eventChanged
        },
        defaults: {
            selectedIndex: 0,
            selectedClass: selectedClass,
            selectedText: '선택됨',
            tabsSelector: '>ul>li',
            tabForceHeight: false
        },

        selectors: {},
        /**
         * 생성자
         * @param {string|Element|jQuery} el 해당 엘리먼트(노드, id, jQuery 어떤 형식이든 상관없다)
         * @param {object} [options] 옵션값
         * @param {number} [options.selectedIndex = 0]  초기선택값
         * @param {string} [options.selectedClass = 'on'] 활성 css클래스명
         * @param {string} [options.tabType = 'inner'] 탭형식(inner | outer)
         */
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            var $hide = self.$('.sr_only:first');
            self.$srText = $hide.length ? $hide : $('<em class="sr_only">' + self.options.selectedText + '</em>');

            var $child = self.$el.children().eq(0);
            if (!$child.is('ul')) {
                self.options.tabsSelector = '>' + $child[0].tagName.toLowerCase() + self.options.tabsSelector;
                if ($child.css('overflow') === 'hidden') {
                    $child.vcSmoothScroll();
                }
            }

            self.update();
            self._bindEvents();

            var index = self.$tabs.filter('.' + selectedClass).index();
            if (index >= 0) {
                self.options.selectedIndex = index;
            }
            self.select(self.options.selectedIndex);
        },

        update: function update() {
            var self = this;

            self._findControls();
            self._buildARIA();
        },

        _findControls: function _findControls() {
            var self = this;
            var selectors = [];

            self.$tabs = self.$(self.options.tabsSelector);
            self.$contents = $();

            // 탭버튼의 href에 있는 #아이디 를 가져와서 컨텐츠를 조회
            self.$tabs.each(function() {
                var $tab = $(this),
                    $panel,
                    href = $tab.find('a').attr('href');

                if (href && /^(#|\.)\w+/.test(href)) {
                    if (($panel = $tab.find('>div, >.ui_tab_panel')).length) {
                        self.$contents = self.$contents.add($panel);
                    } else {
                        self.$contents = self.$contents.add($(href));
                    }
                }
            });

            if (!self.$contents.length) {
                self.$contents = self.$('>' + prefixClass + 'panel');
            }
        },

        /**
         * @private
         */
        _bindEvents: function _bindEvents() {
            var self = this;

            self.on('click keydown', self.options.tabsSelector + '>a, ' + self.options.tabsSelector + '>button', function(e) {

                switch (e.type) {
                    case 'click':
                        e.preventDefault();

                        self.select($(e.currentTarget).parent().index());
                        break;
                    case 'keydown':
                        var index = $(e.currentTarget).parent().index(),
                            newIndex;

                        switch (e.which) {
                            case core.keyCode.RIGHT:
                                e.preventDefault();
                                newIndex = Math.min(self.$tabs.length - 1, index + 1);
                                break;
                            case core.keyCode.LEFT:
                                e.preventDefault();
                                newIndex = Math.max(0, index - 1);
                                break;
                            default:
                                return;
                        }
                        self.select(newIndex);
                        self.$tabs.eq(self.selectedIndex).find('>a, >button').focus();
                        break;
                }
            });
        },

        /**
         * aria 속성 빌드
         * @private
         */
        _buildARIA: function _buildARIA() {
            var self = this,
                tablistid = self.cid,
                tabid;

            self.$el.attr('role', 'tablist');
            self.$tabs.each(function(i) {
                tabid = $(this).children().attr('href').substr(1) || (tablistid + '_' + i);

                $(this)
                    .attr({
                        'role': 'presentation'
                    })
                    .children()
                    .attr({
                        //'id': tabid,
                        'role': 'tab',
                        'aria-selected': 'false',
                        'aria-controls': tabid
                    });

                if (!self.$contents.eq(i).attr('id')) {
                    self.$contents.eq(i).attr('id', tabid);
                }

                self.$contents.eq(i).attr({
                    'aria-labelledby': tabid,
                    'role': 'tabpanel',
                    'aria-hidden': self.selectedIndex === i ? 'false' : 'true'
                });
            });
        },

        _updateTabHeight: function() {
            var self = this;
            var maxHeight = 0;

            if (self.options.tabForceHeight) {
                self.$tabs.find('a').css('height', '').each(function(i) {
                    var h = $(this).height();
                    if (h > maxHeight) {
                        maxHeight = h;
                    }
                });

                self.$tabs.find('a').css('height', maxHeight);
            }
        },

        /**
         * index에 해당하는 탭을 활성화
         * @param {number} index 탭버튼 인덱스
         * @fires vcui.ui.Tab#tabbeforechange
         * @fires vcui.ui.Tab#tabchange
         * @example
         * $('#tab').tab('select', 1);
         * // or
         * $('#tab').tab('instance').select(1);
         */
        select: function select(index) {
            var self = this,
                e;
            if (index < 0 || self.$tabs.length && index >= self.$tabs.length) {
                throw new Error('index 가 범위를 벗어났습니다.');
            }

            /**
             * 탭이 바뀌기 직전에 발생. e.preventDefault()를 호출함으로써 탭변환을 취소할 수 있다.
             * @event vcui.ui.Tab#tabbeforechange
             * @type {object}
             * @property {number} selectedIndex 선택된 탭버튼의 인덱스
             */
            self.triggerHandler(e = $.Event(eventBeforeChange), {
                selectedIndex: index,
                relatedTarget: self.$tabs.get(index),
                button: self.$tabs.eq(index).find('>a'),
                content: self.$contents.eq(index)

            });
            if (e.isDefaultPrevented()) {
                return;
            }

            self.selectedIndex = index;

            var $a, $hide;
            $a = self.$tabs.removeClass(selectedClass).children('a, button').attr('aria-selected', false).end()
                .eq(index).addClass(selectedClass).children('a, button').attr('aria-selected', true);

            if (($hide = $a.find('.hide')).length) {
                self.$tabs.not(self.$tabs.eq(index)).find('>a .hide').text("");
                $hide.text(self.options.selectedText);
            } else {
                $a.append(self.$srText);
            }

            // 컨텐츠가 li바깥에 위치한 탭인 경우
            self.$contents.hide().attr('aria-hidden', 'true')
                .eq(index).attr('aria-hidden', 'false').show();

            self._updateTabHeight();

            /**
             * 탭이 바뀌기 직전에 발생. e.preventDefault()를 호출함으로써 탭변환을 취소할 수 있다.
             * @event vcui.ui.Tab#tabchange
             * @type {object}
             * @property {number} selectedIndex 선택된 탭버튼의 인덱스
             */
            self.triggerHandler(eventChanged, {
                selectedIndex: index,
                button: self.$tabs.eq(index).find('>a'),
                content: self.$contents.eq(index)
            });
        }
    });
    ///////////////////////////////////////////////////////////////////////////////////////

    return Tab;
});
/*!
 * @module vcui.ui.Tooltip
 * @license MIT License
 * @description 툴팁 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/tooltip', ['jquery', 'vcui'], function($, core) {
    "use strict";

    /**
     * 툴팁 레이어
     * @class
     * @name vcui.ui.Tooltip
     * @extends vcui.ui.View
     */
    var Tooltip = core.ui('Tooltip', /** @lends vcui.ui.Tooltip# */ {
        $singleton: true,
        bindjQuery: 'tooltip',
        defaults: {
            interval: 200,
            attrName: "data-tooltip"
        },
        templates: {
            tooltip: '<span class="ui_tooltip" role="tooltip" id="uiTooltip" style="z-index:100000;display:none;max-width:200px;height:auto;position:fixed;border:1px solid red;background:blue;" aria-hidden="true"><span class="arrow"></span><span class="message"></span></span>'
        },
        initialize: function(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            self._bindEvents();
        },

        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvents: function() {
            var self = this;
            var $tooltip = self.$tooltip = $(self.tmpl('tooltip')).appendTo('body');
            var attr = self.options.attrName;
            var scrollWidth = core.detect.isWin ? 20 : 0;

            self.docOn('mouseenter mouseleave focusin focusout click', '[data-title]:not([disabled]), [' + attr + ']:not([disabled])', function(e) {
                switch (e.type) {
                    case 'mouseenter':
                    case 'focusin':
                        var el = self.activeEl = this,
                            title = '';

                        title = core.string.escapeHTML(el.getAttribute(attr) || el.getAttribute('data-tooltip'));
                        if (!title) {
                            self._close(false);
                            return;
                        }

                        if (attr === 'title' && el.getAttribute(attr)) {
                            el.setAttribute('data-title', el.getAttribute(attr));
                            el.setAttribute('aria-describedby', 'uiTooltip')
                            el.removeAttribute(attr);
                        }

                        self.showTimer = setTimeout(function() {
                            if (!el || !title) {
                                return;
                            }

                            var measure = core.dom.getDimensions(el);
                            if (measure.left === 0 && measure.top === 0) {
                                self._close();
                                return;
                            }

                            $tooltip.children('.message').html(title);
                            var tooltipWidth = $tooltip.outerWidth(),
                                tooltipHeight = $tooltip.outerHeight(),
                                isUpOut = measure.top - tooltipHeight < 8,
                                diff = measure.width - tooltipWidth,
                                rightOffset,
                                pos = {};

                            if (isUpOut) {
                                $tooltip.removeClass('top bottom').addClass('top');
                                pos.top = measure.top + measure.height + 10;
                            } else {
                                $tooltip.removeClass('top bottom').addClass('bottom');
                                pos.top = measure.top - tooltipHeight - 8;
                            }

                            pos.left = measure.left + (diff / 2);
                            rightOffset = (pos.left + tooltipWidth) - (window.innerWidth - scrollWidth + core.dom.getScrollLeft());

                            if (pos.left < 0) {
                                $tooltip.children('.arrow').css('marginLeft', pos.left);
                                pos.left = 0;
                            } else if (rightOffset > 0) {
                                $tooltip.children('.arrow').css('marginLeft', rightOffset);
                                pos.left -= rightOffset;
                            } else {
                                $tooltip.children('.arrow').css('marginLeft', '');
                            }

                            $tooltip.css(pos).fadeIn('fast');
                            $tooltip.attr('aria-hidden', 'false');
                            self.isShow = true;

                        }, 500);
                        break;
                    case 'mouseleave':
                    case 'focusout':
                        self._close();
                        break;
                }
            }).on('mousedown', function() {
                self._close();
            });

            self.winOn('scroll', function() {
                self._close();
            })
        },

        _close: function(effect) {
            var self = this;
            clearTimeout(self.showTimer);
            clearTimeout(self.hideTimer);
            self.hideTimer = self.showTimer = null;

            if (self.activeEl) {
                self.activeEl = null;
            }

            if (!self.isShow) {
                return;
            }
            self.isShow = false;

            if (effect) {
                self.$tooltip.fadeOut('fast');
            } else {
                self.$tooltip.hide();
            }
            self.$tooltip.css({
                'top': '',
                'left': ''
            }).children('.arrow').css({
                'marginLeft': ''
            });
            self.$tooltip.attr('aria-hidden', 'true');
        }
    });

    return Tooltip;
});