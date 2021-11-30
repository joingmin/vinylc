/*! 
 * module vcui.vinylc.VinylCrews 
 * extends vcui.ui.View 
 * description Crew content 
 * author VinylC UID Group 
 * create 2018-11-10 
 * update 2018-12-17 
*/

define('vinylc/vinylCrews_random', ['jquery', 'jquery.transit', 'vcui', 'greensock'], function ($, transit, core, greensock) {
    'use strict';

    var VinylCrews = core.ui('VinylCrews', {
        bindjQuery: 'vinylCrews',
        defaults: { speed: 1, state: 'list', ajax: '/json/vinylCrews.json' },
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
            this.CREW_IMAGE_WIDTH = 1920;
            this.CREW_IMAGE_HEIGHT = 1280;
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
            this.XP = { x: -this.windowWidth };
            this.XC = { x: 0 };
            this.XN = { x: this.windowWidth };
            this.autoPlayTime = vcui.detect.isTouch ? 8 : 4;
            this.previewWidth = this.windowWidth * 0.10462;
            this.viewMoveWidth = this.previewWidth * 0.67;
            this.alignCenterLeftX = this.windowWidth * 0.46;
            this.alignCenterRightX = -this.windowWidth * 0.275;
            this.isCrewIn = false;

            if (this.options.data === undefined) {
                this._loadCrewsData();

            } else {
                this._completeCrewsData(resource);
            }
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

        _errorCrewsData: function ($data, $status, $message) {
            console.log('JSON load error Status: ' + $status + ' - Message: ' + $message);
        },

        _completeCrewsData: function (data) {
            var vinylCrews = data.vinylCrews;
            this.crews = vinylCrews.crews;
            this.length = this.crews.length;
            this.index = core.number.random(0, this.length - 1);

            var template1 = {}, template2 = {};
            $.each(this.crews, function (i, crew) {
                template1.photo = { src: crew.photo.src, alt: crew.photo.alt };
                template1.answer = { direction: crew.answer.direction, message: crew.answer.message };
                var $item = $.tmpl($('#template-crew-item').html(), template1);
                $item.attr('data-index', i);
                $item.find('.txt_box').addClass(template1.answer.direction);
                TweenLite.set($item.find('.txt_box p'), { css: { opacity: 0, y: 15 } });
                TweenLite.set($item, { css: { x: this.windowWidth } });
                this.items[i] = this._createCrew($item);
                this.$itemWrap.append(this.items[i].dom);
                template2.info = {
                    direction: crew.info.direction,
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
            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
            vcui.util.delayedCall(this._delayCrewIn, this.autoPlayTime * 1000, this);
        },

        _createCrew: function ($item) {
            var $element = $item;
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

        _bindEvent: function () {
            if (!vcui.detect.isMobile) {
                this.$prev.on('mouseenter', this._overPrev.bind(this));
                this.$prev.on('mouseleave', this._outPrev.bind(this));
                this.$prev.on('click', this._clickPrev.bind(this));
                this.$next.on('mouseenter', this._overNext.bind(this));
                this.$next.on('mouseleave', this._outNext.bind(this));
                this.$next.on('click', this._clickNext.bind(this));
                $(document).on('keydown', this._keyDownHandler.bind(this));

            } else if (vcui.detect.isTouch) {
                $(document).on('touchstart', this._touchStart.bind(this));
                $(document).on('touchmove', this._touchMove.bind(this));
                $(document).on('touchend', this._touchEnd.bind(this));
                this.$prev.remove();
                this.$next.remove();
            }

            // its execution until after wait milliseconds have elapsed since the last time it was invoked
            $(window).on('resize.crew', core.util.debounce(this._resizeHandler.bind(this), 100));

            // DispatchEvent, Header GNB Close  
            $(window).on('autoPlay.crew', function (evt, isPlay) {
                this.autoPlay(isPlay);
            }.bind(this));
        },

        _keyDownHandler: function (evt) {
            switch (evt.keyCode) {
                case 37: this.keyValue = 'left'; break;
                case 39: this.keyValue = 'right'; break;
                default: return;
            }

            if (this.keyValue == 'left' && this.index == 0) return;
            if (this.keyValue == 'right' && this.index == this.length - 1) return;

            if (this.keyValue == 'left') {
                this.autoPlay(false);
                this._clickPrev();

            } else if (this.keyValue == 'right') {
                this.autoPlay(false);
                this._clickNext();
            }
        },

        _setCoverTxt: function () {
            this.$infoWrap.hide();
            var $questContent = this.$coverWrap.find('.quest_cont');
            var $msgWrap = this.$coverWrap.find('.msg_wrap');
            var $msgContent = $msgWrap.find('.msg_cont');
            var $msgCover = $msgContent.find('.msg_cover');
            TweenLite.set($msgCover, { css: { y: this.windowHeight * 0.5 } });
            $.each(this.crews, function (i, crew) {
                var message = this.crews[i].answer.message;
                message = vcui.string.replaceAll(message, '<br/>', '');
                $msgCover.append('<a href="#" data-index="' + i + '">' + message + '</a>');
            }.bind(this));

            setTimeout(function () {
                TweenLite.to($msgCover, 1, { y: 0, ease: Expo.easeOut });
            }.bind(this), 500);

            TweenLite.to($questContent, 0.5, { alpha: 1, ease: Quart.easeOut });
            $msgCover.on('mouseenter', '>a', this._overCoverTxt.bind(this));
            $msgCover.on('mouseleave', '>a', this._outCoverTxt.bind(this));
            $msgCover.on('click', '>a', this._clickCoverTxt.bind(this));

            $msgCover.addClass('overview');
            $msgContent.addClass('viewport');
            $msgWrap.prepend(this.TEMPLATE_CUSTOM_SCROLLBAR);
            $msgWrap.tinyscrollbar();
            $msgWrap.on('move', this._scrollMoveCover.bind(this));
        },

        _scrollMoveCover: function () {
            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
            vcui.util.delayedCall(this._delayCrewIn, this.autoPlayTime * 1000, this);
        },

        _overCoverTxt: function (evt) {
            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
        },

        _outCoverTxt: function (evt) {
            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
            vcui.util.delayedCall(this._delayCrewIn, this.autoPlayTime * 1000, this);
        },

        _clickCoverTxt: function (evt) {
            var $a = $(evt.currentTarget);
            if ($a.data('clicked')) return;
            else $a.data('clicked', true);

            var index = $(evt.currentTarget).attr('data-index');
            this.index = parseInt(index);
            this._lazyLoadCover(this._immediatelyCrewIn.bind(this));
            return false;
        },

        _showCoverTxt: function () {
            this.$coverTxt = this.$coverWrap.find('.txt_cover');
            this.$coverTxts = this.$coverTxt.find('>div');
            TweenLite.to(this.$coverTxts.eq(0).find('span'), 0.76, { y: 0, delay: 0.1, ease: Quart.easeOut });
            TweenLite.to(this.$coverTxts.eq(1).find('span'), 0.96, { y: 0, delay: 0.2, ease: Quart.easeOut });
        },

        _hideCoverTxt: function () {
            TweenLite.to(this.$coverWrap, 0.4, { autoAlpha: 0, y: -15, ease: Quad.easeOut });
        },

        _delayCrewIn: function () {
            if (this.isCrewIn) return;

            this.$coverWrap.find('.msg_cover>a').css({ 'pointer-events': 'none' });
            this._lazyLoadCover(this._immediatelyCrewIn.bind(this));
        },

        _immediatelyCrewIn: function () {
            vcui.util.killDelayedCallsTo(this._delayCrewIn, this);
            this.$coverWrap.css({ zIndex: 0 });
            this.direction = -1;
            this.isAnimation = true;
            this.isCrewIn = true;
            this._resetAlign();

            this.XC.x = this.windowWidth;
            this.XC.bg = -this.windowWidth * this.parallax;
            TweenLite.to(this.XC, this.options.speed, { x: 0, bg: 0, ease: Quart.easeInOut, onUpdate: this._updateCrewIn.bind(this) });
            TweenLite.delayedCall(this.options.speed, this._completeCrewIn.bind(this));
        },

        _updateCrewIn: function () {
            TweenLite.set(this.itemPrev.dom, { css: { x: this.XP.x } });
            TweenLite.set(this.itemCurrent.dom, { css: { x: this.XC.x } });
            var o = Number(core.util.modulate(this.XC.x, [this.windowWidth * (-1 * this.direction), 0], [0.5, 0])).toFixed(2);
            TweenLite.set(this.itemCurrent.dimmed, { css: { opacity: o } });
            TweenLite.set(this.itemCurrent.bg, { css: { x: this.XC.bg } });
            TweenLite.set(this.itemNext.dom, { css: { x: this.XN.x } });
        },

        _completeCrewIn: function () {
            this.XP.o = 0.5;
            this.XC.o = 0;
            this.XN.o = 0.5;
            this.update();
            TweenLite.set(this.XP, { x: -this.windowWidth });
            TweenLite.set(this.itemPrev.dom, { css: { x: this.XP.x } });
            this.complete();

            if (!vcui.detect.isMobile) {
                this._updateArrow();
            }

            this._hideCoverTxt();
            this._showIndicator();
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

        _prevIdx: function ($index) {
            var index = $index - 1;
            if (index < 0) index = this.length - 1;
            return index;
        },

        _nextIdx: function ($index) {
            var index = $index + 1;
            if (index == this.length) index = 0;
            return index;
        },

        _overPrev: function () {
            if (this.isAnimation) return;

            TweenLite.killTweensOf(this.XP);
            TweenLite.killTweensOf(this.XC);
            this.XP.bg = this.alignCenterLeftX - this.previewWidth * 0.5;
            this.XP.o = 1;
            var a = -this.windowWidth + this.previewWidth;
            var b = this.alignCenterLeftX - this.previewWidth;
            TweenLite.to(this.XP, 0.5, { x: a, bg: b, o: 0.5, ease: Quart.easeInOut });
            TweenLite.to(this.XC, 0.5, { x: this.viewMoveWidth, ease: Quart.easeInOut, onUpdate: this.update.bind(this) });
            TweenLite.delayedCall(0.5, this._completeOver.bind(this));
        },

        _outPrev: function () {
            TweenLite.killTweensOf(this.XP);
            TweenLite.killTweensOf(this.XC);
            TweenLite.to(this.XP, 0.5, { x: -this.windowWidth, bg: this.windowWidth * this.parallax, o: 1, ease: Quart.easeOut });
            TweenLite.to(this.XC, 0.5, { x: 0, bg: 0, o: 0, ease: Quart.easeOut, onUpdate: this.update.bind(this) });
            TweenLite.delayedCall(0.5, this._completeOut.bind(this));
        },

        _clickPrev: function (evt) {
            if (this.isAnimation) return;

            this.direction = 1;
            this.isAnimation = true;
            this.index = this._prevIdx(this.index);
            this.itemPrev = this.items[this._prevIdx(this.index)];
            this.itemCurrent = this.items[this.index];
            this.itemNext = this.items[this._nextIdx(this.index)];
            this._lazyLoadView(this.index - 1);
            this._hideArrow();

            TweenLite.killTweensOf(this.XN);
            TweenLite.killTweensOf(this.XC);
            TweenLite.killTweensOf(this.XP);

            this.XN.x = this.XC.x;
            this.XN.bg = !!evt ? this.XC.bg : 0;
            this.XN.o = this.XC.o;
            TweenLite.to(this.XN, this.options.speed, { x: this.windowWidth, bg: -this.windowWidth * this.parallax, o: 0.5, ease: Quart.easeInOut });

            this.XC.x = !!evt ? -this.windowWidth + this.previewWidth : this.XP.x;
            this.XC.bg = !!evt ? this.XP.bg : this.windowWidth * this.parallax;
            this.XC.o = !!evt ? this.XP.o : 0.5;
            if (vcui.detect.isTouch) {
                this.XC.x = this.XP.x;
                this.XC.bg = this.XP.bg;
            }
            TweenLite.to(this.XC, this.options.speed, { x: 0, bg: 0, o: 0, ease: Quart.easeInOut, onUpdate: this.update.bind(this) });
            TweenLite.delayedCall(this.options.speed, this.complete.bind(this));

            this.XP.x = -this.windowWidth;
            this.XP.bg = this.windowWidth * this.parallax;
            this.XP.o = 0.5;
            return false;
        },

        _overNext: function () {
            if (this.isAnimation) return;

            TweenLite.killTweensOf(this.XN);
            TweenLite.killTweensOf(this.XC);
            this.XN.bg = this.alignCenterRightX - this.previewWidth * 1.5;
            this.XN.o = 1;
            var a = this.windowWidth - this.previewWidth;
            var b = this.alignCenterRightX - this.previewWidth;
            TweenLite.to(this.XN, 0.5, { x: a, bg: b, o: 0.5, ease: Quart.easeInOut });
            TweenLite.to(this.XC, 0.5, { x: -this.viewMoveWidth, ease: Quart.easeInOut, onUpdate: this.update.bind(this) });
            TweenLite.delayedCall(0.5, this._completeOver.bind(this));
        },

        _outNext: function () {
            TweenLite.killTweensOf(this.XN);
            TweenLite.killTweensOf(this.XC);
            TweenLite.to(this.XN, 0.5, { x: this.windowWidth, bg: -this.windowWidth * this.parallax, o: 1, ease: Quart.easeOut });
            TweenLite.to(this.XC, 0.5, { x: 0, bg: 0, o: 0, ease: Quart.easeOut, onUpdate: this.update.bind(this) });
            TweenLite.delayedCall(0.5, this._completeOut.bind(this));
        },

        _clickNext: function (evt) {
            if (this.isAnimation) return;

            this.direction = -1;
            this.isAnimation = true;
            this.index = this._nextIdx(this.index);
            this.itemPrev = this.items[this._prevIdx(this.index)];
            this.itemCurrent = this.items[this.index];
            this.itemNext = this.items[this._nextIdx(this.index)];
            this._lazyLoadView(this.index + 1);
            this._hideArrow();

            TweenLite.killTweensOf(this.XP);
            TweenLite.killTweensOf(this.XC);
            TweenLite.killTweensOf(this.XN);

            this.XP.x = this.XC.x;
            this.XP.bg = !!evt ? this.XC.bg : 0;
            this.XP.o = this.XC.o;
            TweenLite.to(this.XP, this.options.speed, { x: -this.windowWidth, bg: this.windowWidth * this.parallax, o: 0.5, ease: Quart.easeInOut });

            this.XC.x = !!evt ? this.windowWidth - this.previewWidth : this.XN.x;
            this.XC.bg = !!evt ? this.XN.bg : -this.windowWidth * this.parallax;
            this.XC.o = !!evt ? this.XN.o : 0.5;
            if (vcui.detect.isTouch) {
                this.XC.x = this.XN.x;
                this.XC.bg = this.XN.bg;
            }
            TweenLite.to(this.XC, this.options.speed, { x: 0, bg: 0, o: 0, ease: Quart.easeInOut, onUpdate: this.update.bind(this) });
            TweenLite.delayedCall(this.options.speed, this.complete.bind(this));

            this.XN.x = this.windowWidth;
            this.XN.bg = -this.windowWidth * this.parallax;
            this.XN.o = 0.5;
            return false;
        },

        _getCrewBgImage: function (index) {
            return this.items[index].bg.find('img').attr('data-src');
        },

        _setCrewBgImage: function (index, src) {
            var $img = this.items[index].bg.find('img');
            $img.attr('src', src);
            this.$imgDimmed.css({ width: $img.width(), height: $img.height() });
            return $img;
        },

        _lazyLoadCover: function (callback) {
            var imgArr = [];
            if (this.index == 0) {
                imgArr.push(this._getCrewBgImage(this.index));
                imgArr.push(this._getCrewBgImage(this.index + 1));
                var aaa = this._getCrewBgImage(this.index);
                var bbb = this._getCrewBgImage(this.index + 1);

            } else if (this.index == this.length - 1) {
                imgArr.push(this._getCrewBgImage(this.index - 1));
                imgArr.push(this._getCrewBgImage(this.index));

            } else {
                imgArr.push(this._getCrewBgImage(this.index - 1));
                imgArr.push(this._getCrewBgImage(this.index));
                imgArr.push(this._getCrewBgImage(this.index + 1));
            }

            this._preload(imgArr, {
                loadedAll: function () {
                    if (this.index == 0) {
                        this._setCrewBgImage(this.index, imgArr[0]);
                        this._setCrewBgImage(this.index + 1, imgArr[1]);
                        console.log('BBB');

                    } else if (this.index == this.length - 1) {
                        this._setCrewBgImage(this.index - 1, imgArr[0]);
                        this._setCrewBgImage(this.index, imgArr[1]);

                    } else {
                        this._setCrewBgImage(this.index - 1, imgArr[0]);
                        this._setCrewBgImage(this.index, imgArr[1]);
                        this._setCrewBgImage(this.index + 1, imgArr[2]);
                    }

                    callback();
                    console.log('CCC');
                }.bind(this)
            });
        },

        _preload: function (imgArr, option) {
            var imgList = [];
            var loaded = 0, total = imgArr.length;
            var obj = {};
            obj.init = function (loaded, total) { };
            obj.loaded = function (img, loaded, total) { };
            obj.loadedAll = function (loaded, total) { };
            var loader = $.extend(obj, option);
            loader.init(0, total);
            for (var i in imgArr) {
                imgList.push($('<img/>').attr('src', imgArr[i]).load(function () {
                    loaded++;
                    loader.loaded(this, loaded, total);
                    if (loaded == total) {
                        loader.loadedAll(loaded, total);
                    }
                }))
            }
        },

        _loadedCrewBgImage: function (index) {
            return !!this.items[index].bg.attr('src') ? true : false;
        },

        _lazyLoadView: function (index) {
            if (index < 0 || index == this.length) return;
            if (this._loadedCrewBgImage(index)) return;

            var imgArr = [this._getCrewBgImage(index)];
            this._preload(imgArr, {
                loaded: function () {
                    this._setCrewBgImage(index, imgArr[0]);
                }.bind(this)
            });
        },

        _completeOver: function () {
            this.autoPlay(false);
            this.isAnimation = false;
        },

        _completeOut: function () {
            this.autoPlay(true);
            this.isDown = false;
        },

        _touchStart: function ($evt) {
            var touch = $evt.originalEvent.touches[0];
            this._onDownHandler(touch.pageX, touch.pageY);
        },

        _onDownHandler: function ($x) {
            if (this.isAnimation) return;

            this.autoPlay(false);
            this.isDown = true;
            this._offsetX = $x;
            this._x = 0;
        },

        _touchMove: function ($evt) {
            $evt.preventDefault();
            var touch = $evt.originalEvent.touches[0];
            this._onMoveHander(touch.pageX, touch.pageY);
        },

        _onMoveHander: function ($x) {
            if (!this.isDown || this.isAnimation) return;

            this._x = Math.round($x - this._offsetX);
            var isFirst = (this.index == 0 && this._x > 0) ? true : false;
            var isLast = (this.index == this.length - 1 && this._x < 0) ? true : false;
            if (isFirst || isLast) return;

            var dir = this._getDirection({ x: this._offsetX }, { x: this._x }, 'horizontal');
            this.direction = (dir == 'left') ? -1 : 1;

            this.XP.x = -this.windowWidth + this._x;
            this.XP.bg = -this.XP.x * this.parallax;
            this.XP.o = Number(core.util.modulate(this.XP.x, [-this.windowWidth, 0], [0.5, 0])).toFixed(2);

            this.XC.x = this._x;
            this.XC.bg = -this.XC.x * this.parallax;
            this.XC.o = Number(core.util.modulate(this.XC.x, [0, this.windowWidth * (this.direction)], [0, 0.5])).toFixed(2);

            this.XN.x = this.windowWidth + this._x;
            this.XN.bg = -this.XN.x * this.parallax;
            this.XN.o = Number(core.util.modulate(this.XN.x, [this.windowWidth, 0], [0.5, 0])).toFixed(2);

            this.update();
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

        _touchEnd: function ($evt) {
            this._onUpHandler();
        },

        _onUpHandler: function () {
            if (!this.isDown || this.isAnimation) return;
            vcui.util.killDelayedCallsTo(this._delayAutoPlay, this);
            vcui.util.delayedCall(this._delayAutoPlay, this.autoPlayTime * 1000, this);

            this.isAnimation = false;
            this.isDown = false;

            if (this.index == 0) {
                if (this._x > 0) return;

            } else if (this.index == this.length - 1) {
                if (this._x < 0) return;
            }

            if (Math.abs(this._x) < 50) {
                this._goRevert();

            } else {
                if (this._x < 0) {
                    this._clickNext(true);

                } else {
                    this._clickPrev(true);
                }
            }
        },

        _goRevert: function () {
            TweenLite.killTweensOf(this.XP);
            TweenLite.to(this.XP, 0.3, { x: -this.windowWidth, ease: Cubic.easeOut });
            TweenLite.killTweensOf(this.XC);
            TweenLite.to(this.XC, 0.3, { x: 0, ease: Cubic.easeOut, onUpdate: this.update.bind(this) });
            TweenLite.killTweensOf(this.XN);
            TweenLite.to(this.XN, 0.3, { x: this.windowWidth, ease: Cubic.easeOut });
        },

        _hideArrow: function () {
            this.$prev.hide();
            this.$next.hide();
        },

        _updateArrow: function () {
            if (this.index < 1) {
                this.$prev.hide();
                this.$next.show();

            } else if (this.index == this.length - 1) {
                this.$prev.show();
                this.$next.hide();

            } else {
                this.$prev.show();
                this.$next.show();
            }
        },

        update: function () {
            TweenLite.set(this.itemPrev.dom, { css: { x: this.XP.x } });
            TweenLite.set(this.itemPrev.bg, { css: { x: this.XP.bg } });
            TweenLite.set(this.itemPrev.dimmed, { css: { opacity: this.XP.o } });
            TweenLite.set(this.itemCurrent.dom, { css: { x: this.XC.x } });
            TweenLite.set(this.itemCurrent.bg, { css: { x: this.XC.bg } });
            TweenLite.set(this.itemCurrent.dimmed, { css: { opacity: this.XC.o } });
            TweenLite.set(this.itemNext.dom, { css: { x: this.XN.x } });
            TweenLite.set(this.itemNext.bg, { css: { x: this.XN.bg } });
            TweenLite.set(this.itemNext.dimmed, { css: { opacity: this.XN.o } });
        },

        complete: function () {
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
            vcui.util.killDelayedCallsTo(this._delayAutoPlay, this);
            vcui.util.delayedCall(this._delayAutoPlay, this.autoPlayTime * 1000, this);
            this.isAnimation = false;
            setTimeout(function () {
                this._updateArrow();
            }.bind(this), 0);
        },

        _fadeInAnswer: function () {
            for (var i = 0, len = this.length; i < len; i++) {
                var $p = this.items[i].txt;
                TweenLite.killTweensOf($p);
                if (i == this.index) {
                    TweenLite.to($p, 1, { opacity: 1, y: 0, ease: Quart.easeOut });

                } else {
                    TweenLite.set($p, { css: { opacity: 0, y: 15 } });
                }
            }
        },

        _fadeInInfo: function () {
            for (var i = 0, len = this.length; i < len; i++) {
                var $info = this.infos[i].find('.info_box');
                TweenLite.killTweensOf($info);

                if (i == this.index) {
                    TweenLite.set($info, { css: { x: 16 * -this.direction } });
                    TweenLite.to($info, 1, { opacity: 1, x: 0, delay: 0.5, ease: Quart.easeOut });

                } else if (i > this.index) {
                    TweenLite.to($info, 0.56, { opacity: 0, x: 50, ease: Quart.easeOut });

                } else {
                    TweenLite.to($info, 0.56, { opacity: 0, x: -50, ease: Quart.easeOut });
                }
            }
        },

        _showIndicator: function () {
            this.$indicatorWrap.css({ opacity: 1 });
            var w = this.$indicator.data('width') * 1.15;
            TweenLite.to(this.$indicator, 0.6, { opacity: 1, x: 0, delay: 0.46, ease: Quart.easeOut });
        },

        _updateIndicator: function () {
            this.$indicator.find('.now').text(this.index + 1);
            this.$indicator.find('.total').text(this.length);
        },

        _delayAutoPlay: function () {
            if (this.isDown || this.index == this.length - 1) return;

            this._clickNext();
        },

        _resizeHandler: function () {
            this.windowWidth = $(window).width();
            this.windowHeight = $(window).height();
            this.previewWidth = this.windowWidth * 0.10462;
            this.viewMoveWidth = this.previewWidth * 0.67;
            this.alignCenterLeftX = this.windowWidth * 0.46;
            this.alignCenterRightX = -this.windowWidth * 0.275;

            var img = { w: this.CREW_IMAGE_WIDTH, h: this.CREW_IMAGE_HEIGHT };
            this.$imgWrap.css({ width: this.windowWidth, height: this.windowHeight });
            this._resizeImage(this.$imgWrap, img.w, img.h, 'cover');
            var $img = this.$imgWrap.find('img');
            this.$imgDimmed.css({ width: $img.width(), height: $img.height() });
            if (!this.isCrewIn) return;

            TweenLite.killTweensOf(this.XP);
            TweenLite.killTweensOf(this.XC);
            TweenLite.killTweensOf(this.XN);
            TweenLite.set(this.itemPrev.dom, { css: { x: -this.windowWidth } });
            TweenLite.set(this.itemCurrent.dom, { css: { x: 0 } });
            TweenLite.set(this.itemNext.dom, { css: { x: this.windowWidth } });

            vcui.util.killDelayedCallsTo(this._delayAutoPlay, this);
            vcui.util.delayedCall(this._delayAutoPlay, this.autoPlayTime * 1000, this);
        },

        _resizeImage: function ($container, $imgW, $imgH, $resizeType) {
            var width = $container.width(), height = $container.height();
            var ratio = $imgW / $imgH;
            var size = { x: 0, y: 0, w: 0, h: 0 };
            var resizeType = $resizeType || 'contain';

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

            $container.find('img').css({ width: size.w, height: size.h });
            $container.css({ left: size.x, top: size.y });
        },

        // public ------------------------------- 

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