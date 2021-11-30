/*!
 * @module vcui.ui.Accordion
 * @license MIT License
 * @description 아코디온 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/accordion', ['jquery', 'vcui'], function ($, core) {
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
    var Accordion = ui('Accordion', /**@lends vcui.ui.Accordion# */{
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
                        core.each(indexes, function (index) {
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
            self.$items.each(function () {
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
            self.on("click dblclick", o.itemSelector + o.toggleSelector, function (e) {
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
                self.on(eventBeforeExpand, function (e) {
                    $('.ui_accordion[data-accord-group=' + o.accordGroup + '], '
                        + '.ui_accordion_list[data-accord-group=' + o.accordGroup + ']')
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
                data.content.slideUp(opts.duration, opts.easing, function () {
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
                    data.oldContent.slideUp(opts.duration, opts.easing, function () {
                        callback && callback();
                    });
                }
                self._updateButton(index, true);
                data.content.slideDown(opts.duration, opts.easing, function () {
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
            $item.toggleClass( options.activeClass, toggle ); 

            var $btn = $item.find( options.toggleSelector ); 
            if( $btn.is('a') ) {
                if( toggle ) {
                    $btn.find('.ui_accord_text').html( function() {
                        return $btn.attr('data-close-text');
                    });
                } else {
                    $btn.find('.ui_accord_text').html( function() {
                        return $btn.attr('data-open-text');
                    });
                } 
            } else {
                if( toggle ) {
                    $btn.find('.ui_accord_text').html( function() {
                        return $btn.attr('data-close-text');
                    });

                } else { 
                    $btn.find('.ui_accord_text').html( function() {
                        return $btn.attr('data-open-text');
                    });
                }
            }

            $btn.attr( 'aria-expanded', !!toggle );
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