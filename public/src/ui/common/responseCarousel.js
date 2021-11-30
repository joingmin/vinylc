define('ui/responseCarousel', ['jquery', 'vcui', 'ui/carousel'],
    function ($, core) {
        /**
         * 반응형 배너
         */
        return core.ui('ResponseCarousel', {
            bindjQuery: true,
            initialize: function (el, options) {
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
            _build: function () {
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