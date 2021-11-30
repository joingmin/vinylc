/**
 * Dropodwn
 */
define('ui/dropdown', [
    'jquery',
    'vcui'
], function ($, core) {

    var Dropdown = core.ui('Dropdown', {
        bindjQuery: true,
        defaults: {
            hover: false,           // 호버일때 열리게 할 것인가
            activeClass: 'open',    // 활성화 클래스
            autoHide: true          //
        },
        initialize: function (el, options) {
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
        _buildARIA: function () {
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

        _bindEvents: function () {
            var self = this;

            // 토글 버튼
            self.on('click', '.ui_dropdown_toggle', function (e) {
                e.preventDefault();

                self.toggle();
            });

            // 닫기 버튼
            self.on('click', '.ui_dropdown_close', function (e) {
                e.preventDefault();

                self.close();
            });

            // 호버일 때 호버관련 이벤트 바인딩
            if (self.options.hover) {
                self.on('mouseenter mouseleave', function (e) {
                    self[e.type === 'mouseenter' ? 'open' : 'close']()
                });
            }
        },

        /**
         * 토글 함수
         */
        toggle: function () {
            this[this.$el.is('.on, .open') ? 'close' : 'open']();
        },

        /**
         * 열기 메소드
         */
        open: function () {
            var self = this;

            self.$el.addClass(self.options.activeClass);
            self.$('.ui_dropdown_toggle')
                .attr('aria-expanded', true)
                .find('.sr_only').text(vcui.i18n('close'));

            self.options.autoHide && setTimeout(function () {
                // 다른 곳을 클릭하면 닫히게 해준다.
                self.docOn('click', function (e) {
                    if (core.dom.contains(self.$el[0], e.target)) {
                        setTimeout(function () {
                            self.close();
                        }, 100);
                        return;
                    }
                    self.close();
                });

                self.docOn('keydown', function (e) {
                    if (e.which === core.keyCode.ESCAPE) {
                        self.close();
                    }
                });

                self.$('.ui_dropdown_list').on('click', 'a, button', function (e) {
                    setTimeout(function () {
                        self.close();
                    }, 100);
                });

                if (core.detect.isTouch) {
                    return;
                }
                // 포커스가 빠져나가면 자동으로 닫히도록 해준다..
                var thread;
                self.on('focusin focusout', function (e) {
                    switch (e.type) {
                        case 'focusin':
                            clearTimeout(thread);
                            break;
                        case 'focusout':
                            clearTimeout(thread);
                            thread = setTimeout(function () {
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
        close: function () {
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