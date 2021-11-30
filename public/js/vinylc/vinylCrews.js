/*! 
 * module vcui.vinylc.VinylCrews 
 * extends vcui.ui.View 
 * description Crew content 
 * author VinylC UID Group 
 * create 2018-11-10 
 * update 2018-12-27 
*/

define('vinylc/vinylCrews', ['jquery', 'vcui', 'greensock'], function ($, core, greensock) {
    'use strict';

    var VinylCrews = core.ui('VinylCrews', {
        bindjQuery: 'vinylCrews',
        defaults: { ajax: '/json/vinylCrews.json', width: 1920, height: 1080, speed: 1 },
        selectors: {
            wrap: '.crews_wrap',
            coverWrap: '.crews_main',
            itemWrap: '.bg_wrap',
            infoWrap: '.info_wrap',
            indicatorWrap: '.indi_wrap',
            indicator: '.indi_wrap > .indi',
            prev: 'button.prev',
            next: 'button.next'
        },

        initialize: function initialize(el, options) {
            if (this.supr(el, options) === false) return;

            this.TEMPLATE_CUSTOM_SCROLLBAR = '<div class="scrollbar"><div class="track"><div class="thumb"><div class="end"></div></div></div></div>';
            this.ajax = this.$wrap.attr('data-ajax') || this.options.ajax;
            this.windowWidth = $(window).width();
            this.windowHeight = $(window).height();
            this.parallax = 0.5;
            this.direction = -1;
            this.offsetLeft = 0;
            this.isAnimation = false;
            this.isDown = false;
            this.items = [];
            this.infos = [];
            this.infoInOutX = !vcui.detect.isTouch ? 50 : 50 * 0.65;
            this.TWLeft = { x: -this.windowWidth };
            this.TWCenter = { x: 0 };
            this.TWRight = { x: this.windowWidth };
            //this.autoPlayTime = vcui.detect.isTouch ? 8 : 4; 
            this.autoPlayTime = 8;
            this.previewWidth = this.windowWidth * 0.10462;
            this.viewMoveWidth = this.previewWidth * 0.67;
            this.alignCenterLeftX = this.windowWidth * 0.46;
            this.alignCenterRightX = -this.windowWidth * 0.275;
            this.isCrewIn = false;
            this.isLazyLoaded = false;

            this.coverScroller;

            this.isMenuOpen = false;
            this.mainMouseX = this.mainMouseY = -100;


            this.$next.css('cursor', 'none');
            this.$prev.css('cursor', 'none');

            if (this.options.data === undefined) this._loadCrewsData();
            else this._completeCrewsData(resource);
        },

        _loadCrewsData: function () {
            var settings = {};
            settings.dataType = 'json';
            settings.url = this.ajax;
            settings.error = this._errorCrewsData.bind(this);
            settings.success = this._completeCrewsData.bind(this);
            settings.async = false;
            $.ajax(settings);
        },

        _errorCrewsData: function (data, status, message) {
        },

        _completeCrewsData: function (data) {
            var vinylCrews = data.vinylCrews;
            this.crews = vinylCrews.crews;
            this.length = this.crews.length;
            this.index = 0;

            var template1 = {}, template2 = {};
            $.each(this.crews, function (i, crew) {
                template1.photo = { src: crew.photo.src, alt: crew.photo.alt };
                template1.answer = { direction: crew.answer.direction, message: crew.answer.message };

                var $item = $.tmpl($('#template-crew-item').html(), template1);
                $item.attr('data-index', i);
                $item.find('.txt_box').addClass(template1.answer.direction);
                TweenLite.set($item.find('.txt_box p'), { css: { opacity: 0 } });
                TweenLite.set($item, { css: { x: this.windowWidth, display: 'none' } });
                this.items[i] = this._createCrew($item);
                this.$itemWrap.append(this.items[i].dom);
                template2.info = {
                    name: crew.info.direction,
                    period: { start: crew.info.period.start, end: crew.info.period.end },
                    duty: crew.info.duty
                };
                var $info = $.tmpl($('#template-crew-info').html(), template2);
                TweenLite.set($info.find('.info_box'), { css: { opacity: 0, x: -50 } });
                this.infos[i] = $info;
                this.$infoWrap.append(this.infos[i]);
                crew.seq = i;
            }.bind(this));

            this._setData();
            this._bindEvent();
            this._resizeHandler();
            this._lazyLoadCover();
        },

        _createCrew: function (item) {
            var $element = item;
            var $bg = $element.find('.img_cont');
            var $dimmed = $element.find('.dimmed');
            var $txt = $element.find('.txt_cont p');
            return { dom: $element, bg: $bg, dimmed: $dimmed, txt: $txt };
        },

        _setData: function () {
            this.$imgWrap = this.$itemWrap.find('.img_cont');
            this.$imgDimmed = this.$imgWrap.find('.dimmed');

            this._resetAlign();
            this._setCoverTxt();
        },

        _resetAlign: function () {
            var _prevIdx = this._prevIdx(this.index);
            this.itemPrev = this.items[_prevIdx];
            this.itemPrev.dom.css({ zIndex: 5 });
            this.itemCurrent = this.items[this.index];
            this.itemCurrent.dom.css({ zIndex: 4 });
            var _nextIdx = this._nextIdx(this.index);
            this.itemNext = this.items[_nextIdx];
            this.itemNext.dom.css({ zIndex: 5 });
        },

        _bindEvent: function () {
            if (vcui.detect.isTouch) {
                this.$wrap.on('touchstart', this._touchStart.bind(this));
                this.$wrap.on('touchmove', this._touchMove.bind(this));
                this.$wrap.on('touchend', this._touchEnd.bind(this));
                this.$prev.remove();
                this.$next.remove();
            } else {
                //this.$prev.on( 'mouseenter', this._overPrev.bind(this) ); 
                //this.$prev.on( 'mouseleave', this._outPrev.bind(this) ); 
                this.$prev.on('click', this._clickPrev.bind(this));
                //this.$next.on( 'mouseenter', this._overNext.bind(this) ); 
                //this.$next.on( 'mouseleave', this._outNext.bind(this) ); 
                this.$next.on('click', this._clickNext.bind(this));
                $(document).on('keydown', this._keyDownHandler.bind(this));

                var element = '';
                element += '<div class="cursor_arrow_wrap">'
                element += '    <div class="cursor_arrow_body">';
                element += '        <div class="cursor_arrow_elem"></div>';
                element += '        <div class="cursor_arrow_elem"></div>';
                element += '    </div>';
                element += '</div>';
                $('.indi_wrap').after(element);

                this._addMousePositionChk();
            }

            // its execution until after wait milliseconds have elapsed since the last time it was invoked
            $(window).on('resize.crew', core.util.debounce(this._resizeHandler.bind(this), 100));

            var self = this;
            $('.sub.vinylcrews a.go_h_prev').on('click', function () {
                self._returnVinylCrewHome();
                return false;
            });

            // DispatchEvent, Header GNB Close  
            $(window).on('changeGnbState', function (evt, state) {
                if (state == "open") {
                    self.isMenuOpen = true;
                    if (self.isCrewIn) {
                        self.autoPlay(false);

                        $('body').css('cursor', 'default');
                    } else {
                        vcui.util.killDelayedCallsTo(self._delayCrewIn, self);
                    }
                } else {
                    setTimeout(function () {
                        self.isMenuOpen = false;

                        if (self.isCrewIn) {
                            self.autoPlay(true);

                            $('body').css('cursor', 'none');
                        } else {
                            vcui.util.delayedCall(self._delayCrewIn, self.autoPlayTime * 1000, self);
                        }
                    }, 500);
                }
            });
        },

        _delayCrewIn: function () {
            if (this.isCrewIn) return;

            this.$coverWrap.find('.msg_cover>a').css({ 'pointer-events': 'none' });
            this._lazyLoadCover(this._immediatelyCrewIn.bind(this));
        },

        _addMousePositionChk: function () {
            var self = this;
            $('body').on('mousemove.positionchker', function (e) {
                self.mainMouseX = e.pageX;
                self.mainMouseY = e.pageY;
            });
        },

        _removeMousePositionChk: function () {
            $('body').off('mousemove.positionchker');
        },

        _returnVinylCrewHome: function () {
            if (this.isAnimation) return;

            var self = this;

            TweenLite.set($('.sub.vinylcrews h1'), { display: 'block' })
            TweenLite.to($('.sub.vinylcrews h1'), 1, {
                alpha: 1, ease: Power4.easeInOut, onComplete: function () {
                    $('.sub.vinylcrews').removeClass('det');
                    TweenLite.set($('.sub.vinylcrews h1'), { x: 0 })
                }
            });

            TweenLite.to($('.sub.vinylcrews a.go_h_prev'), .6, { opacity: 0, ease: Power4.easeInOut });

            TweenLite.killTweensOf(self.TWRight);
            TweenLite.killTweensOf(self.TWCenter);
            TweenLite.killTweensOf(self.TWLeft);

            vcui.util.killDelayedCallsTo(self._delayAutoPlay, self);

            self.$prev.hide();
            self.$next.hide();

            self._hideIndicator();
            self._fadeOutInfo();

            self._addCoverScrollHandler();

            var duration = vcui.detect.isTouch ? 0.76 : 1;
            var ease = vcui.detect.isTouch ? Quint.easeInOut : Quart.easeInOut;
            TweenLite.to(self.TWCenter, duration, {
                x: self.windowWidth, bg: -self.windowWidth * self.parallax, ease: ease, onUpdate: self._updateCrewIn.bind(self), onComplete: function () {
                    self.$coverWrap.find('.msg_cover>a').css({ 'pointer-events': 'auto' });
                    self.$coverWrap.css({ zIndex: 50 });

                    self.index = 0;
                    self.isCrewIn = false;
                    self.isDown = false;
                    self.isAnimation = false;
                    vcui.util.delayedCall(self._delayCrewIn, self.autoPlayTime * 1000, self);
                }
            });
            TweenLite.to(self.$coverWrap, 0.4, { autoAlpha: 1, y: 0, ease: Quad.easeOut });

            var $msgWrap = this.$coverWrap.find('.msg_wrap');
            var $msgContent = $msgWrap.find('.msg_cont');
            var $msgCover = $msgContent.find('.msg_cover');
            $.each($msgCover.find('a'), function (idx, item) {
                $(item).data('clicked', false);
            });


            if (!vcui.detect.isTouch) {
                $('.sub.vinylcrews a.go_h_prev, .btn_nav_wrap button, .header_wrap h1').off('mouseover mouseout');

                $('body').css('cursor', 'default').off('mousemove.crewcursor click.crewcursor');
                TweenLite.to($('.cursor_arrow_wrap'), .3, { left: -100, top: -100, ease: Power4.easeOut, overwrite: 1 });

                this._addMousePositionChk();
            }
        },

        _arrowFollowCursor: function (mx, my) {
            var fx = mx - $('.cursor_arrow_wrap').width() / 2;
            var fy = my - $('.cursor_arrow_wrap').height() / 2;
            TweenLite.to($('.cursor_arrow_wrap'), 1.2, { left: fx, top: fy, ease: Expo.easeOut, overwrite: 1 });

            if (mx < $(window).width() / 2) this._arrowCursorState('left');
            else this._arrowCursorState('right');
        },

        _immediatelyCrewIn: function (ease, duration) {
            $(window).trigger('changeLogo.header', 100);
            this.$prev.show();
            this.$next.show();

            this._removeCoverScrollHandler();

            var self = this;

            $('.sub.vinylcrews').addClass('det');
            TweenLite.to($('.sub.vinylcrews a.go_h_prev'), 1, { delay: .2, opacity: 1, ease: Power4.easeInOut });

            var hleft = $('.sub.vinylcrews h1').position().left;
            TweenLite.set($('.sub.vinylcrews h1'), { x: -hleft })
            TweenLite.to($('.sub.vinylcrews h1'), 1, {
                alpha: 0, ease: Power4.easeInOut, onComplete: function () {
                    $(this).css('display', 'none');
                }
            });

            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
            this.$coverWrap.css({ zIndex: 0 });
            this.direction = -1;
            this.isAnimation = true;
            this.isCrewIn = true;
            this._resetAlign();

            var duration = vcui.detect.isTouch ? 0.76 : 1;
            var ease = vcui.detect.isTouch ? Quint.easeInOut : Quart.easeInOut;
            this.TWCenter.x = this.windowWidth;
            this.TWCenter.bg = -this.windowWidth * this.parallax;
            TweenLite.to(this.TWCenter, duration, { x: 0, bg: 0, ease: ease, onUpdate: this._updateCrewIn.bind(this) });
            TweenLite.delayedCall(this.options.speed, this._completeCrewIn.bind(this));

            if (!vcui.detect.isTouch) {
                this._removeMousePositionChk();
                this._arrowFollowCursor(this.mainMouseX, this.mainMouseY);

                $('.cursor_arrow_wrap').css({ left: -100, top: -100 });
                $('.cursor_arrow_wrap').show();
                this._arrowCursorState('left');

                $('body').css('cursor', 'none').on('mousemove.crewcursor', function (e) {
                    self._arrowFollowCursor(e.pageX, e.pageY);
                }).on('click.crewcursor', function (e) {
                    if (!self.isMenuOpen) {
                        if (e.pageX < $(window).width() / 2) self._clickPrev();
                        else self._clickNext();
                    }
                });

                $('.sub.vinylcrews a.go_h_prev, .btn_nav_wrap button, .header_wrap h1').on('mouseover', function () {
                    TweenLite.to($('.cursor_arrow_wrap').find('.cursor_arrow_body'), .2, { alpha: 0, ease: Power4.easeOut, overwrite: 1 });
                }).on('mouseout', function () {
                    TweenLite.to($('.cursor_arrow_wrap').find('.cursor_arrow_body'), .6, { alpha: 1, ease: Power4.easeOut, overwrite: 1 });
                });

                TweenLite.to($('.cursor_arrow_wrap').find('.cursor_arrow_body'), .6, { alpha: 1, ease: Power4.easeOut, overwrite: 1 });
            }
        },

        _arrowCursorState: function (course) {
            var cursorCourse = $('.cursor_arrow_wrap').data('course');
            if (cursorCourse != course) {
                $('.cursor_arrow_wrap').data('course', course);

                var angle, forigin, borigin;
                if (course == 'left') {
                    angle = 43;
                    forigin = "100% 50%";
                    borigin = "0 50%";
                } else {
                    angle = -43;
                    forigin = "0 50%";
                    borigin = "100% 50%";
                }
                TweenLite.to($('.cursor_arrow_wrap').find('.cursor_arrow_body .cursor_arrow_elem').eq(0), .2, { transformOrigin: forigin, rotation: 0, ease: Power4.easeInOut, overwrite: 1 });
                TweenLite.to($('.cursor_arrow_wrap').find('.cursor_arrow_body .cursor_arrow_elem').eq(1), .2, { transformOrigin: forigin, rotation: 0, ease: Power4.easeInOut, overwrite: 1 });
                TweenLite.to($('.cursor_arrow_wrap').find('.cursor_arrow_body .cursor_arrow_elem').eq(0), .4, { delay: .2, transformOrigin: borigin, rotation: angle, ease: Power4.easeOut });
                TweenLite.to($('.cursor_arrow_wrap').find('.cursor_arrow_body .cursor_arrow_elem').eq(1), .4, { delay: .2, transformOrigin: borigin, rotation: -angle, ease: Power4.easeOut });
            }
        },

        _updateCrewIn: function () {
            TweenLite.set(this.itemPrev.dom, { css: { x: this.TWLeft.x } });
            TweenLite.set(this.itemCurrent.dom, { css: { x: this.TWCenter.x } });
            var o = Number(core.util.modulate(this.TWCenter.x, [this.windowWidth * (-1 * this.direction), 0], [0.5, 0])).toFixed(2);
            TweenLite.set(this.itemCurrent.dimmed, { css: { opacity: o } });
            TweenLite.set(this.itemCurrent.bg, { css: { x: this.TWCenter.bg } });
            TweenLite.set(this.itemNext.dom, { css: { x: this.TWRight.x } });
        },

        _completeCrewIn: function () {
            this.TWLeft.o = 0.5;
            this.TWCenter.o = 0;
            this.TWRight.o = 0.5;

            this._updateTransition();
            TweenLite.set(this.TWLeft, { x: -this.windowWidth });
            TweenLite.set(this.itemPrev.dom, { css: { x: this.TWLeft.x } });
            this._completeTransition();
            this._hideCover();
            this._showIndicator();
        },

        _prevIdx: function (index) {
            var index = index - 1;
            if (index < 0) index = this.length - 1;
            return index;
        },

        _nextIdx: function (index) {
            var index = index + 1;
            if (index == this.length) index = 0;
            return index;
        },

        _overPrev: function () {

            /*
            this.$prev.data('hover', true);

            if( this.isAnimation ) return; 

            TweenLite.killTweensOf( this.TWLeft ); 
            TweenLite.killTweensOf( this.TWCenter ); 
            this.TWLeft.bg = this.alignCenterLeftX-this.previewWidth*0.5;
            this.TWLeft.o = 1; 
            var a = -this.windowWidth+this.previewWidth; 
            var b = this.alignCenterLeftX-this.previewWidth; 
            TweenLite.to( this.TWLeft, 0.5, {x:a, bg:b, o:0.5, ease:Quart.easeInOut} ); 
            TweenLite.to( this.TWCenter, 0.5, {x:this.viewMoveWidth, ease:Quart.easeInOut, onUpdate:this._updateTransition.bind(this)} ); 
            TweenLite.delayedCall( 0.5, this._completeOver.bind(this) ); 
            */
        },

        _outPrev: function () {

            /*
            this.$prev.data('hover', false);

            if( this.clicked ) return; 

            TweenLite.killTweensOf( this.TWLeft ); 
            TweenLite.killTweensOf( this.TWCenter ); 
            TweenLite.to( this.TWLeft, 0.5, {x:-this.windowWidth, bg:this.windowWidth*this.parallax, o:1, ease:Quart.easeOut} ); 
            TweenLite.to( this.TWCenter, 0.5, {x:0, bg:0, o:0, ease:Quart.easeOut, onUpdate:this._updateTransition.bind(this)} );  
            TweenLite.delayedCall( 0.5, this._completeOut.bind(this) ); 
            */
        },

        _clickPrev: function (evt, ease, duration) {
            if (this.isAnimation) return;

            this.clicked = true;
            this.direction = 1;
            this.isAnimation = true;
            this.index = this._prevIdx(this.index);
            this.itemPrev = this.items[this._prevIdx(this.index)];
            this.itemCurrent = this.items[this.index];
            this.itemNext = this.items[this._nextIdx(this.index)];
            this._lazyLoadView(this.index - 1);

            TweenLite.killTweensOf(this.TWRight);
            TweenLite.killTweensOf(this.TWCenter);
            TweenLite.killTweensOf(this.TWLeft);

            var ease = ease || Quart.easeInOut;
            var duration = duration || this.options.speed;
            this.TWRight.x = this.TWCenter.x;
            this.TWRight.bg = !!evt ? this.TWCenter.bg : 0;
            this.TWRight.o = this.TWCenter.o;
            TweenLite.to(this.TWRight, duration, { x: this.windowWidth, bg: -this.windowWidth * this.parallax, o: 0.5, ease: ease });

            //this.TWCenter.x = !!evt ? -this.windowWidth+this.previewWidth : this.TWLeft.x; 
            this.TWCenter.x = this.TWLeft.x;
            this.TWCenter.bg = !!evt ? this.TWLeft.bg : this.windowWidth * this.parallax;
            this.TWCenter.o = !!evt ? this.TWLeft.o : 0.5;
            if (vcui.detect.isTouch) {
                this.TWCenter.x = this.TWLeft.x;
                this.TWCenter.bg = this.TWLeft.bg;
            }
            TweenLite.to(this.TWCenter, duration, { x: 0, bg: 0, o: 0, ease: ease, onUpdate: this._updateTransition.bind(this) });
            TweenLite.delayedCall(duration, this._completeTransition.bind(this));

            this.TWLeft.x = -this.windowWidth;
            this.TWLeft.bg = this.windowWidth * this.parallax;
            this.TWLeft.o = 0.5;
        },

        _overNext: function () {

            /*
            this.$next.data('hover', true);

            if( this.isAnimation ) return; 
            
            TweenLite.killTweensOf( this.TWRight ); 
            TweenLite.killTweensOf( this.TWCenter ); 
            this.TWRight.bg = this.alignCenterRightX-this.previewWidth*1.5;
            this.TWRight.o = 1; 
            var a = this.windowWidth-this.previewWidth; 
            var b = this.alignCenterRightX-this.previewWidth; 
            TweenLite.to( this.TWRight, 0.5, {x:a, bg:b, o:0.5, ease:Quart.easeInOut} ); 
            TweenLite.to( this.TWCenter, 0.5, {x:-this.viewMoveWidth, ease:Quart.easeInOut, onUpdate:this._updateTransition.bind(this)} ); 
            TweenLite.delayedCall( 0.5, this._completeOver.bind(this) ); 
            */
        },

        _clickNext: function (evt, ease, duration) {
            if (this.isAnimation) return;

            this.clicked = true;
            this.direction = -1;
            this.isAnimation = true;
            this.index = this._nextIdx(this.index);
            this.itemPrev = this.items[this._prevIdx(this.index)];
            this.itemCurrent = this.items[this.index];
            this.itemNext = this.items[this._nextIdx(this.index)];
            this._lazyLoadView(this.index + 1);

            TweenLite.killTweensOf(this.TWLeft);
            TweenLite.killTweensOf(this.TWCenter);
            TweenLite.killTweensOf(this.TWRight);

            var ease = ease || Quart.easeInOut;
            var duration = duration || this.options.speed;
            this.TWLeft.x = this.TWCenter.x;
            this.TWLeft.bg = !!evt ? this.TWCenter.bg : 0;
            this.TWLeft.o = this.TWCenter.o;
            TweenLite.to(this.TWLeft, duration, { x: -this.windowWidth, bg: this.windowWidth * this.parallax, o: 0.5, ease: ease });

            //this.TWCenter.x = !!evt ? this.windowWidth-this.previewWidth : this.TWRight.x; 
            this.TWCenter.x = this.TWRight.x;
            this.TWCenter.bg = !!evt ? this.TWRight.bg : -this.windowWidth * this.parallax;
            this.TWCenter.o = !!evt ? this.TWRight.o : 0.5;
            if (vcui.detect.isTouch) {
                this.TWCenter.x = this.TWRight.x;
                this.TWCenter.bg = this.TWRight.bg;
            }
            TweenLite.to(this.TWCenter, duration, { x: 0, bg: 0, o: 0, ease: ease, onUpdate: this._updateTransition.bind(this) });
            TweenLite.delayedCall(duration, this._completeTransition.bind(this));

            this.TWRight.x = this.windowWidth;
            this.TWRight.bg = -this.windowWidth * this.parallax;
            this.TWRight.o = 0.5;
        },

        _outNext: function () {

            /*
            this.$next.data('hover', false);

            if( this.clicked ) return; 

            TweenLite.killTweensOf( this.TWRight ); 
            TweenLite.killTweensOf( this.TWCenter ); 
            TweenLite.to( this.TWRight, 0.5, {x:this.windowWidth, bg:-this.windowWidth*this.parallax, o:1, ease:Quart.easeOut} ); 
            TweenLite.to( this.TWCenter, 0.5, {x:0, bg:0, o:0, ease:Quart.easeOut, onUpdate:this._updateTransition.bind(this)} ); 
            TweenLite.delayedCall( 0.5, this._completeOut.bind(this) ); 
            */
        },

        _completeOver: function () {
            this.autoPlay(false);
        },

        _completeOut: function () {
            this.autoPlay(true);
        },

        _updateTransition: function () {
            TweenLite.set(this.itemPrev.dom, { css: { x: this.TWLeft.x } });
            TweenLite.set(this.itemPrev.bg, { css: { x: this.TWLeft.bg } });
            TweenLite.set(this.itemPrev.dimmed, { css: { opacity: this.TWLeft.o } });
            TweenLite.set(this.itemCurrent.dom, { css: { x: this.TWCenter.x } });
            TweenLite.set(this.itemCurrent.bg, { css: { x: this.TWCenter.bg } });
            TweenLite.set(this.itemCurrent.dimmed, { css: { opacity: this.TWCenter.o } });
            TweenLite.set(this.itemNext.dom, { css: { x: this.TWRight.x } });
            TweenLite.set(this.itemNext.bg, { css: { x: this.TWRight.bg } });
            TweenLite.set(this.itemNext.dimmed, { css: { opacity: this.TWRight.o } });
        },

        _completeTransition: function () {
            this._resetAlign();

            for (var i = 0, len = this.length; i < len; i++) {
                var item = this.items[i];
                if (i != this.index) {
                    TweenLite.set(item.dom, { css: { x: -5000 } });
                    TweenLite.set(item.bg, { css: { x: 0 } });
                    TweenLite.set(item.dimmed, { css: { opacity: 0.5 } });
                }
            }

            this._fadeInAnswer();
            this._fadeInInfo();
            this._updateIndicator();
            this._lazyLoadView(-this.direction + this.index, this._completeLazyLoad.bind(this));
        },

        _completeLazyLoad: function () {
            vcui.util.killDelayedCallsTo(this._delayAutoPlay, this);
            vcui.util.delayedCall(this._delayAutoPlay, this.autoPlayTime * 1000, this);
            this.isAnimation = false;
            this.clicked = false;

            if (this.$prev.data('hover')) this.$prev.trigger('mouseenter');
            if (this.$next.data('hover')) this.$next.trigger('mouseenter');
        },

        _fadeInAnswer: function () {
            for (var i = 0, len = this.length; i < len; i++) {
                var $p = this.items[i].txt;
                TweenLite.killTweensOf($p);
                if (i == this.index) {
                    TweenLite.to($p, 1, { opacity: 1, ease: Quart.easeInOut });

                } else {
                    TweenLite.set($p, { css: { opacity: 0 } });
                }
            }
        },

        _fadeInInfo: function () {
            for (var i = 0, len = this.length; i < len; i++) {
                var $info = this.infos[i].find('.info_box');
                TweenLite.killTweensOf($info);

                if (i == this.index) {
                    TweenLite.set($info, { css: { x: 16 * -this.direction } });
                    TweenLite.to($info, 1, { opacity: 1, x: 0, delay: 0.36, ease: Cubic.easeOut });

                } else {
                    var directionX = (i > this.index) ? 1 : -1;
                    TweenLite.to($info, 0.76, { opacity: 0, x: this.infoInOutX * directionX, ease: Quart.easeInOut });
                }
            }
        },

        _fadeOutInfo: function () {
            var i, len
            for (i = 0, len = this.length; i < len; i++) {
                var $info = this.infos[i].find('.info_box');
                TweenLite.to($info, 0.76, { opacity: 0, ease: Quart.easeInOut, overwrite: 1 });
            }
        },

        _showIndicator: function () {
            this.$indicatorWrap.css({ opacity: 1 });
            TweenLite.to(this.$indicator, 0.6, { opacity: 1, x: 0, delay: 0.46, ease: Quart.easeOut });
        },

        _hideIndicator: function () {
            var self = this;
            this.$indicatorWrap.css({ opacity: 1 });
            TweenLite.to(this.$indicator, 0.6, {
                opacity: 0, ease: Quart.easeOut, onComplete: function () {
                    self.$indicatorWrap.css({ opacity: 0 });
                }
            });
        },

        _updateIndicator: function () {
            this.$indicator.find('.now').text(this.index + 1);
            this.$indicator.find('.total').text(this.length);
        },

        _keyDownHandler: function (evt) {

            if (this.$next.data('hover') || this.$prev.data('hover')) return;


            switch (evt.keyCode) {
                case 37: this.keyValue = 'left'; break;
                case 39: this.keyValue = 'right'; break;
                default: return;
            }
            this.autoPlay(false);

            if (!this.isCrewIn) {
                if (this._loadedCrewImage(0)) this._immediatelyCrewIn();
                else this._lazyLoadCover(this._immediatelyCrewIn.bind(this));

            } else {
                if (this.keyValue == 'left') {
                    this._clickPrev();

                } else if (this.keyValue == 'right') {
                    this._clickNext();
                }
            }
        },

        _resizeHandler: function () {
            this.windowWidth = $(window).width();
            this.windowHeight = $(window).height();
            this.previewWidth = this.windowWidth * 0.10462;
            this.viewMoveWidth = this.previewWidth * 0.67;
            this.alignCenterLeftX = this.windowWidth * 0.46;
            this.alignCenterRightX = -this.windowWidth * 0.275;

            var img = { w: this.options.width, h: this.options.height };
            this.$imgWrap.css({ width: this.windowWidth, height: this.windowHeight });
            this._resizeImage(this.$imgWrap, img.w, img.h, 'cover');
            var $img = this.$imgWrap.find('img');
            this.$imgDimmed.css({ width: $img.width(), height: $img.height() });

            var scale = $('.header_wrap h1').height() / 42;
            if (scale > 1) scale = 1;
            TweenLite.set($('.cursor_arrow_wrap'), { transformOrigin: "50% 50%", scale: scale });

            if (!this.isCrewIn) return;

            TweenLite.killTweensOf(this.TWLeft);
            TweenLite.killTweensOf(this.TWCenter);
            TweenLite.killTweensOf(this.TWRight);
            TweenLite.set(this.itemPrev.dom, { css: { x: -this.windowWidth } });
            TweenLite.set(this.itemCurrent.dom, { css: { x: 0 } });
            TweenLite.set(this.itemNext.dom, { css: { x: this.windowWidth } });

            vcui.util.killDelayedCallsTo(this._delayAutoPlay, this);
            vcui.util.delayedCall(this._delayAutoPlay, this.autoPlayTime * 1000, this);
        },

        _resizeImage: function (element, w, h, type) {
            var $el = element;
            var width = $el.width(), height = $el.height();
            var ratio = w / h;
            var size = { x: 0, y: 0, w: 0, h: 0 };
            var resizeType = type || 'contain';

            if (resizeType == 'cover') {
                if (width / ratio < height) {
                    size.w = height * ratio;
                    size.h = height;
                    size.x = (width - size.w) * 0.5;

                } else {
                    size.w = width;
                    size.h = width / ratio;
                    size.y = (height - size.h) * 0.5;
                }

            } else if (resizeType == 'contain') {
                if (width / ratio < height) {
                    size.w = width;
                    size.h = width / ratio;

                } else {
                    size.w = height * ratio;
                    size.h = height;
                }

                size.x = (width - size.w) * 0.5;
                size.y = (height - size.h) * 0.5;
            }

            $el.find('img').css({ width: size.w, height: size.h });
            $el.css({ left: size.x, top: size.y });
        },

        _delayAutoPlay: function () {
            if (this.isDown) return;

            this._clickNext();
        },

        // cover list --------------------------------- 

        _setCoverTxt: function () {
            var $questContent = this.$coverWrap.find('.quest_cont');

            var delays = [0, 0.3, 1.2]

            $questContent.css('opacity', 1);
            $.each($questContent.find('.quest_cover div'), function (idx, item) {
                TweenLite.set($(item), { alpha: 0 });
                TweenLite.to($(item), 1, { delay: delays[idx], startAt: { y: 60 }, y: 0, ease: Quart.easeOut });
                TweenLite.to($(item), 3, { delay: delays[idx], alpha: 1, ease: Quart.easeOut });
                TweenLite.to($(item), 1, { delay: idx * .2 + 2, alpha: .05, ease: Quart.easeInOut });
            });

            TweenLite.delayedCall(2.4, this._setMsgCoverBlock.bind(this));
        },

        _setMsgCoverBlock: function () {
            var $msgWrap = this.$coverWrap.find('.msg_wrap');
            var $msgContent = $msgWrap.find('.msg_cont');
            var $msgCover = $msgContent.find('.msg_cover');
            TweenLite.set($msgCover, { css: { y: this.windowHeight * 0.5 } });

            $.each(this.crews, function (i, crew) {
                var message = this.crews[i].answer.message;
                $msgCover.append('<a href="#" data-index="' + i + '">' + message + '</a>');
            }.bind(this));

            setTimeout(function () {
                TweenLite.to($msgCover, 1, { y: 0, ease: Expo.easeOut });
            }.bind(this), 500);

            $msgCover.on('click', '>a', this._clickCoverTxt.bind(this));

            /*
            $msgCover.addClass('overview'); 
            $msgContent.addClass('viewport'); 
            $msgWrap.prepend( this.TEMPLATE_CUSTOM_SCROLLBAR ); 

            var wspd, dura, tsize
            if(vcui.detect.isMobile){
                wspd = 180;
                dura = .9;
                tsize = parseInt($msgCover.height()*.16);
            } else{
                wspd = 76;
                dura = .86;
                tsize = parseInt($msgCover.height()*.6);
            }
            $msgWrap.tinyscrollbar( {wheelSpeed:wspd, duration:dura, ease:Power3.easeOut, trackSize:tsize} ); 
            
            $msgWrap.on( 'move', this._scrollMoveCover.bind(this) ); 

            this.coverScroller = $msgWrap.data("plugin_tinyscrollbar");
            */

            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
            vcui.util.delayedCall(this._delayCrewIn, 8000, this);

            this._addCoverScrollHandler();
        },

        _hideCover: function () {
            TweenLite.to(this.$coverWrap, 0.4, { autoAlpha: 0, y: -15, ease: Quad.easeOut });
        },

        _addCoverScrollHandler: function () {
            this.$coverWrap.find('.msg_wrap').on("scroll", this._scrollMoveCover.bind(this));
        },

        _removeCoverScrollHandler: function () {
            this.$coverWrap.find('.msg_wrap').off("scroll");
        },

        _scrollMoveCover: function () {
            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
            vcui.util.delayedCall(this._delayCrewIn, 4000, this);

            $(window).trigger('changeLogo.header', this.$coverWrap.find('.msg_wrap').scrollTop());
        },

        _overCoverTxt: function (evt) {
            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
        },

        _outCoverTxt: function (evt) {
            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
            vcui.util.delayedCall(this._delayCrewIn, this.autoPlayTime * 1000, this);
        },

        _clickCoverTxt: function (evt) {
            evt.preventDefault();

            var $a = $(evt.currentTarget);
            if (!!$a.data('clicked')) return;
            else $a.data('clicked', true);

            var index = $(evt.currentTarget).attr('data-index');
            this.index = parseInt(index);
            if (this.index < 2) this._immediatelyCrewIn();
            else this._lazyLoadCover(this._immediatelyCrewIn.bind(this));
        },

        // mobile gesture ----------------------------- 

        _touchStart: function (evt) {
            if (!this.isCrewIn) return;

            var touch = evt.originalEvent.touches[0];
            this._onDownHandler(touch.pageX, touch.pageY);
        },

        _onDownHandler: function (x) {
            if (this.isAnimation) return;

            this.autoPlay(false);
            this.isDown = true;
            this._offsetX = x;
            this._x = 0;
        },

        _touchMove: function (evt) {
            if (!this.isCrewIn) return;

            evt.preventDefault();
            var touch = evt.originalEvent.touches[0];
            this._onMoveHander(touch.pageX, touch.pageY);
        },

        _onMoveHander: function (x) {
            if (!this.isDown || this.isAnimation) return;

            this._x = Math.round(x - this._offsetX);

            var dir = this._getDirection({ x: this._offsetX }, { x: this._x }, 'horizontal');
            this.direction = (dir == 'left') ? -1 : 1;

            this.TWLeft.x = -this.windowWidth + this._x;
            this.TWLeft.bg = -this.TWLeft.x * this.parallax;
            this.TWLeft.o = Number(core.util.modulate(this.TWLeft.x, [-this.windowWidth, 0], [0.5, 0])).toFixed(2);
            this.TWCenter.x = this._x;
            this.TWCenter.bg = -this.TWCenter.x * this.parallax;
            this.TWCenter.o = Number(core.util.modulate(this.TWCenter.x, [0, this.windowWidth * (this.direction)], [0, 0.5])).toFixed(2);
            this.TWRight.x = this.windowWidth + this._x;
            this.TWRight.bg = -this.TWRight.x * this.parallax;
            this.TWRight.o = Number(core.util.modulate(this.TWRight.x, [this.windowWidth, 0], [0.5, 0])).toFixed(2);

            this._updateTransition();
        },

        _getDirection: function (start, end, direction) {
            var isHoriz = !direction || direction === 'horizontal' || direction === 'both';
            var isVert = !direction || direction === 'vertical' || direction === 'both';
            if (isHoriz != isVert) {
                if (isHoriz) {
                    if (start.x > end.x) return 'left';
                    else if (start.x == end.x) return '';
                    else return 'right';

                } else {
                    if (start.y > end.y) return 'up';
                    else if (start.y == end.y) return '';
                    else return 'down';
                }
            }

            var angle = this._getAngle(start, end);
            if (angle <= 45 && angle >= 0) return 'left';
            else if (angle <= 360 && angle >= 315) return 'left';
            else if (angle >= 135 && angle <= 225) return 'right';
            else if (angle > 45 && angle < 135) return 'down';
            else return 'up';
        },

        _getAngle: function (start, end) {
            var x = start.x - end.x;
            var y = end.y - start.y;
            var radian = Math.atan2(y, x);
            var degree = Math.round(radian * 180 / Math.PI);
            if (degree < 0) degree = 360 - Math.abs(degree);
            return degree;
        },

        _touchEnd: function (evt) {
            if (!this.isCrewIn) return;

            this._onUpHandler();
        },

        _onUpHandler: function () {
            if (!this.isDown || this.isAnimation) return;

            vcui.util.killDelayedCallsTo(this._delayAutoPlay, this);
            vcui.util.delayedCall(this._delayAutoPlay, this.autoPlayTime * 1000, this);
            this.isAnimation = false;
            this.isDown = false;

            if (Math.abs(this._x) < 50) {
                this._revertCenter();

            } else {
                if (this._x < 0) {
                    this._clickNext(true, Quint.easeOut, 0.75);

                } else {
                    this._clickPrev(true, Quint.easeOut, 0.75);
                }
            }
        },

        _revertCenter: function () {
            TweenLite.killTweensOf(this.TWLeft);
            TweenLite.to(this.TWLeft, 0.3, { x: -this.windowWidth, ease: Cubic.easeOut });
            TweenLite.killTweensOf(this.TWCenter);
            TweenLite.to(this.TWCenter, 0.3, { x: 0, ease: Cubic.easeOut, onUpdate: this._updateTransition.bind(this) });
            TweenLite.killTweensOf(this.TWRight);
            TweenLite.to(this.TWRight, 0.3, { x: this.windowWidth, ease: Cubic.easeOut });
        },

        // lazy load ---------------------------------- 

        _loadedCrewImage: function (index) {
            return !!this.items[index].bg.find('img').attr('src') ? true : false;
        },

        _getCrewImage: function (index) {
            return this.items[index].bg.find('img').attr('data-src');
        },

        _setCrewImage: function (index, src) {
            var $img = this.items[index].bg.find('img');
            $img.attr('src', src);
            this.$imgDimmed.css({ width: $img.width(), height: $img.height() });

            this.items[index].dom.css('display', 'block')

            return $img;
        },

        _lazyLoadCover: function (callback) {
            var imgArr = [];
            if (this.index == 0) {
                imgArr.push(this._getCrewImage(this.index));
                imgArr.push(this._getCrewImage(this.index + 1));
                imgArr.push(this._getCrewImage(this.length - 1));
            } else if (this.index == this.length - 1) {
                imgArr.push(this._getCrewImage(this.index - 1));
                imgArr.push(this._getCrewImage(this.index));
            } else {
                imgArr.push(this._getCrewImage(this.index - 1));
                imgArr.push(this._getCrewImage(this.index));
                imgArr.push(this._getCrewImage(this.index + 1));
            }

            this._preload(imgArr, {
                loadedAll: function () {
                    if (this.index == 0) {
                        this._setCrewImage(this.index, imgArr[0]);
                        this._setCrewImage(this.index + 1, imgArr[1]);
                        this._setCrewImage(this.length - 1, imgArr[2]);

                    } else if (this.index == this.length - 1) {
                        this._setCrewImage(this.index - 1, imgArr[0]);
                        this._setCrewImage(this.index, imgArr[1]);
                    } else {
                        this._setCrewImage(this.index - 1, imgArr[0]);
                        this._setCrewImage(this.index, imgArr[1]);
                        this._setCrewImage(this.index + 1, imgArr[2]);
                    }

                    if (callback && typeof callback === 'function') {
                        setTimeout(function () {
                            callback();
                        }.bind(this), 100);
                    }
                }.bind(this)
            });
        },

        _lazyLoadView: function (index, callback, evt) {
            if (index < 0 || index == this.length || this._loadedCrewImage(index)) {
                if (callback && typeof callback === 'function') {
                    callback(evt);
                }
                return;
            }

            var imgArr = [this._getCrewImage(index)];
            this._preload(imgArr, {
                loaded: function () {
                    this._setCrewImage(index, imgArr[0]);

                    if (callback && typeof callback === 'function') {
                        setTimeout(function () {
                            callback(evt);
                        }.bind(this), 100);
                    }
                }.bind(this)
            });
        },

        _preload: function (images, option) {
            var imgList = [];
            var loaded = 0, total = images.length;
            var obj = {};
            obj.init = function (loaded, total) { };
            obj.loaded = function (img, loaded, total) { };
            obj.loadedAll = function (loaded, total) { };
            var loader = $.extend(obj, option);
            loader.init(0, total);
            for (var i in images) {
                imgList.push($('<img/>').attr('src', images[i]).load(function () {
                    loaded++;
                    loader.loaded(this, loaded, total);
                    if (loaded == total) {
                        loader.loadedAll(loaded, total);
                    }
                }))
            }
        },

        // public ------------------------------------- 

        autoPlay: function (isPlay) {
            if (isPlay) {
                vcui.util.killDelayedCallsTo(this._delayAutoPlay, this);
                vcui.util.delayedCall(this._delayAutoPlay, this.autoPlayTime * 1000, this);
            } else {
                vcui.util.killDelayedCallsTo(this._delayAutoPlay, this);
            }
        }
    });

    return VinylCrews;
});