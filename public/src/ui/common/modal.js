/*!
 * @module vcui.ui.Modal
 * @license MIT License
 * @description 모달 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/modal', ['jquery', 'vcui'], function ($, core) {
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

            $win.on('resizeend.modalmanager', function () {
                for (var i = -1, modal; modal = self.stack[++i];) {
                    modal.isShown && modal.center();
                }
            });

            $doc.on('modalshow.modalmanager', '.ui_modal_container', self._handleModalShow.bind(self))
                .on('modalhidden.modalmanager', '.ui_modal_container', self._handleModalHidden.bind(self))
                .on('modalhide.modalmanager', '.ui_modal_container', self._handleModalHide.bind(self))
                .on('focusin.modalmanager', self._handleFocusin.bind(self))
                .on('click.modalmanager', '[data-control=modal]', self._handleClick.bind(self))
                .on('click.modalmanager', '.ui_modal_dim', self._handleDimClick.bind(self));
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
                    }).done(function (html) {
                        $modal = ModalManager.getRealModal(html);

                        $modal.addClass('ui_modal_ajax').hide().appendTo('body').vcModal(core.extend({
                            removeOnClose: true,
                            opener: $el[0]
                        }, $el.data()))
                            .on('modalhidden', function (e) {
                                $modal.off('modalhidden');
                            });
                    }).always(function () {
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
                        .on('modalhidden', function (e) {
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
        getRealModal: function (html) {
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
        var interval = window.setInterval(function () {
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
    var Modal = ui('Modal', /** @lends vcui.ui.Modal# */{
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
                setTimeout(function () {
                    core.util.waitImageLoad(self.$('img'), true).done(function () {
                        self.show();
                    });
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
                setTimeout(function () {
                    self.$el.stop().fadeIn('slow', function () {
                        defer.resolve();
                    });
                });
            } else if (opts.effect === 'slide') {
                self.$el.stop().css('top', -self.$el.height()).animate({top: '50%'}, function () {
                    defer.resolve();
                });
            } else {
                self.$el.show();
                defer.resolve();
            }

            defer.done(function () {
                self.layout();

                self.trigger('modalshown', {
                    module: self
                });

                //////$('body').attr('aria-hidden', 'true');    // body를 비활성화(aria)
                self._draggabled(); // 드래그 기능 빌드
                self._escape(); // esc키이벤트 바인딩

                self.on('mousewheel DOMMouseScroll wheel', function (e) {
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
                self.$el.fadeOut('fast', function () {
                    defer.resolve();
                });
            } else if (self.options.effect === 'slide') {
                self.$el.animate({
                    top: -self.$el.outerHeight()
                }, function () {
                    defer.resolve();
                });
            } else {
                self.$el.hide();
                defer.resolve();
            }

            defer.done(function () {
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
                    $(self.options.opener).removeAttr('aria-controls').focus();    // 레이어팝업을 띄운 버튼에 포커스를 준다.
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

        _scrollHeight: function () {
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
                backgroundClip: 'padding-box'//,
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
                self.on('mousedown touchstart', options.dragHandle, function (e) {
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
                self.docOn('keyup', function (e) {
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

    core.modal = function (el, options) {
        $(el).vcModal(options);
    };

    /**
     * @class
     * @name vcui.ui.AjaxModal
     * @description ajax로 불러들인 컨텐츠를 모달로 띄워주는 모듈
     * @extends vcui.ui.View
     */
    var fetchingUrls = {};
    core.ui.ajaxModal = function (ajaxOptions, options) {
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

        fetchingUrls[ajaxOptions.url] = $.ajax(ajaxOptions).then(function (html) {
            var $modal = ModalManager.getRealModal(html).appendTo('body').data('removeOnClose', true);
            return $modal.vcModal(core.extend({}, options, {
                removeOnClose: true,
                events: {
                    modalshown: function () {
                        delete fetchingUrls[ajaxOptions.url];
                    },
                    modalhidden: function () {
                        $(options.opener).focus();
                    }
                }
            }));
        });

        return fetchingUrls[ajaxOptions.url];
    };

    core.ui.alert = function () {
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
        return function (msg, options) {
            if (typeof msg !== 'string' && arguments.length === 0) {
                options = msg;
                msg = '';
            }
            var el = $(core.ui.alert.tmpl).appendTo('body').find('div.ui_modal_content').html(msg).end();
            var modal = $(el).vcModal(core.extend({removeOnClose: true}, options)).vcModal('instance');
            modal.getElement().buildUIControls();
            modal.on('modalhidden', function () {
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