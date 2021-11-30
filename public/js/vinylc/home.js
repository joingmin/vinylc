/*! 
 * module vcui.vinylc.Home
 * extends vcui.ui.View 
 * description Home content 
 * author VinylC UID Group 
 * create 2018-12-06
*/

define('vinylc/home', ['jquery', 'jquery.transit', 'vcui', 'greensock'], function ($, transit, core, greensock) {
    'use strict';

    var Home = core.ui('Home', {
        bindjQuery: 'home',
        defaults: { ajax: '/json/home-list.json' },
        selectors: {
            wrap: '.main_wrap',
            imgWrap: '.img_wrap',
            imgContainer: '.img_wrap .img_container',
            titleWrap: '.title_wrap',
            pagingWrap: '.paging_wrap'
        },

        initialize: function initialize(el, options) {
            if (this.supr(el, options) === false) return;

            this.ajax = this.$wrap.attr('data-ajax') || this.options.ajax;
            this.windowWidth = this.initWindowWidth = $(window).width();
            this.windowHeight = this.initWindowHeight = $(window).height();

            this.contTotal;
            this.contID = 1;
            this.viewed = [];

            this.autoScroller;
            this.autoScrollValue = 1;
            this.autoScrollFps = 1000 / 60;

            this.dragScrollTimer;
            this.dragScrollChker = false;

            this.accelerate = { value: 0, limit: 200 };

            this.scrollstate = { value: $(window).scrollTop() };

            this.isChangeOri = false;

            this.isActive = true;
            this.isStart = false;

            this.dragStopTimer;

            this.isInteraction = false;

            this.wheelAccelerate = 6;
            this.WAreturnSpd = .03;

            this.titleInitHeight = 0;

            this.startDate = new Date();

            $(window).load(function () {
                setTimeout(function () {
                    $(window).scrollTop(0);
                }, 100);
            });

            window.addEventListener('mousewheel', this._tempStopWheelHandler, { passive: false })

            this._loadHomeData();
        },

        _tempStopWheelHandler: function (e) {
            e.preventDefault();
            e.stopPropagation();
        },

        _loadHomeData: function () {
            var settings = {};
            settings.dataType = 'json';
            settings.url = this.ajax;
            settings.error = this._errorHomeData.bind(this);
            settings.success = this._completeHomeData.bind(this);
            settings.async = false;
            $.ajax(settings);
        },

        _errorHomeData: function ($data, $status, $message) {
        },

        _completeHomeData: function (data) {

            var homelists = data.homeList;

            this.contTotal = homelists.length;

            var imgwidth = 0;
            var imgheight = 0;

            for (var i = 0; i < this.contTotal; i++) {

                var hlist = homelists[i];

                var title = hlist.title;
                var href = hlist.href;
                var target = hlist.target;
                var fontsize = hlist.fontsize;
                var language = hlist.classname;
                var photos = hlist.photo;

                var id = hlist.main_sn;

                var plusattr = vcui.detect.isMobile ? " m" : "";

                var element = "";
                element += "<div class='img_item'>";
                $.each(photos, function (j, photo) {
                    element += "    <div class='img_cont_element " + photo.align + plusattr + "' >";
                    if (photo.v_src != null && photo.v_src != undefined && photo.v_src != "") {
                        element += "<div class='main_video' data-width='" + photo.width + "' data-height='" + photo.height + "' >";
                        element += ' <iframe width="100%" height="100%" src="https://player.vimeo.com/video/';
                        element += photo.v_src;
                        element += '?background=1&muted=1&loop=1&autoplay=1" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen allow="autoplay"></iframe>';
                        element += '    <div class="mainVcover"></div>';
                        element += '</div>'
                    } else {
                        var src = plusattr == " m" && photo.m_src != null && plusattr != "" ? photo.m_src : photo.src;
                        element += "      <img src='" + src + "' alt='" + photo.alt + "' />";
                    }
                    element += "    </div>";
                });
                element += "</div>";
                this.$imgContainer.append(element);

                element = "";
                element += "<div class='title_item'>";
                element += "    <div class='title_block'>";
                element += "        <p class='title_txt " + fontsize + " " + language + "' data-href='" + href + "' data-target='" + target + "' data-id='" + id + "'><span>" + title + "</span></p>";
                element += "    </div>";
                element += "</div>";
                this.$titleWrap.append(element);

            };

            var self = this;
            this.$titleWrap.css('cursor', 'pointer').on('click', function () {
                var title = $(this).find('.title_item').eq(self.contID - 1);
                var titletxt = title.find('.title_txt');
                var href = titletxt.data('href');
                var target = titletxt.data('target');
                var txt = titletxt.text();
                var id = titletxt.data('id');

                gtag('event', '클릭', { 'event_category': "메인", 'event_label': txt });

                window.open(href, target);
            });

            this._setPaging();
            this._bindEvent();


            this.isFirstTitleTrnas = true;

            if (vcui.detect.isMobile) this.isFirstTitleTrnas = false;

            if (this.isFirstTitleTrnas) {
                this._resizeHandler();
                this._setFirstTransition();
            }

            //this._setTitleTxtPosition(0, this.$titleWrap.height());

            TweenLite.delayedCall(1.3, this._start.bind(this));
        },

        _start: function () {
            if (!this.isFirstTitleTrnas) {
                this._resizeHandler();
                this._setFirstTransition();
            }

            $('footer').show();

            this._startAutoScroll();
        },

        _setTitleState: function () {
            var self = this;
            var titleheight, maxheight = 0;
            var titlearea, titlemaxarea = parseInt($(window).height() * .55);
            $.each(self.$titleWrap.find('.title_item'), function (idx, item) {
                var fontsize = parseInt($(item).find('.title_block .title_txt span').css('font-size'));
                $(item).find('.title_block .title_txt span').css({
                    'line-height': (fontsize + 10) + 'px'
                });

                titleheight = $(item).find('.title_block .title_txt span').height() * 5;
                titlearea = Math.min(titleheight, titlemaxarea)
                maxheight = Math.max(maxheight, titlearea);
            });


            self.$titleWrap.css({
                left: self.windowWidth / 2 - self.$titleWrap.width() / 2,
                top: self.windowHeight / 2 - maxheight / 2,
                height: maxheight
            });

            $.each(self.$titleWrap.find('.title_item'), function (idx, item) {
                titleheight = $(item).find('.title_block .title_txt span').height();
                var middle = maxheight / 2 - titleheight / 2;
                $(item).find('.title_block .title_txt').css({
                    height: titleheight,
                    top: middle
                });
            });

            this.titleInitHeight = maxheight;
        },

        _setFirstTransition: function () {
            var self = this;

            var firsty = vcui.detect.isMobile ? 30 : 50;
            TweenLite.set(this.$titleWrap, { alpha: 0, y: firsty });
            TweenLite.to(this.$titleWrap, 1.2, { y: 0, ease: 'easeOutQuart' });

            TweenLite.set(this.$pagingWrap, { alpha: 0 });

            TweenLite.to(this.$titleWrap, 2, { alpha: 1, ease: 'easeOutQuart' });
            TweenLite.to(this.$pagingWrap, 2, { alpha: 1, ease: 'easeOutQuart' });


            $('.playvGoBtn').data('isClick', false);
            TweenLite.set($('.playvGoBtn'), { x: '100%', display: 'block' });
            TweenLite.to($('.playvGoBtn'), .8, { delay: 1, x: '0%', y: '-50%', ease: 'easeOutQuart' });

            $('.playvGoBtn').on('click', function () {
                //if (!vcui.detect.isMobile){
                $('.playvGoBtn').data('isClick', true);
                TweenLite.to($('.playvGoBtn'), .6, { x: '100%', ease: Power4.easeInOut, overwrite: 1 })
                TweenLite.to($('.playvGoBtn'), .3, { delay: .3, opacity: 0, ease: Power4.easeOut })

                $('.playvCover').css('display', 'block');
                $('.playvContainer').height('100vh');

                TweenLite.to($('.playvContainer'), 1.6, {
                    delay: .55, x: '-100vw', y: 0, ease: Power4.easeInOut, overwrite: 1, onComplete: function () {
                        location.href = self.options.playv_url;
                    }
                });
                //} else{
                //location.href=self.options.playv_url;
                //}
            });
        },

        _orientationchangeHandler: function (e) {
            this.isChangeOri = true;
        },

        _bindEvent: function () {
            if (!vcui.detect.isMobile) {
                window.removeEventListener('mousewheel', this._tempStopWheelHandler);
                window.addEventListener('mousewheel', this._mouseWheelHandler.bind(this), { passive: false });
                $(window).on('keydown', function (e) {
                    if (e.keyCode == 38 || e.keyCode == 40 || e.keyCode == 35 || e.keyCode == 36 || e.keyCode == 34 || e.keyCode == 33) return false;
                });
            } else if (vcui.detect.isTouch) {
                window.addEventListener('touchstart', this._touchStartHandler.bind(this), { passive: false });
                window.addEventListener('touchend', this._touchEndHandler.bind(this), { passive: false });

                $(window).on('orientationchange', this._orientationchangeHandler.bind(this));
            }

            $(window).on('scroll', this._scrollMoveHandler.bind(this));

            $(window).on('resize', this._resizeHandler.bind(this));

            $(window).on('autoPlay.home', this._autoPlayStatus.bind(this));
        },

        _autoPlayStatus: function (e, data) {
            this.isActive = data;

            if (data) {
                this._startAutoScroll();
            } else {
                this.dragScrollChker = false;
                clearTimeout(this.dragScrollTimer);

                clearInterval(this.autoScroller);
            }
        },

        _resizeHandler: function (e) {
            this.windowHeight = $(window).height();
            this.windowWidth = $(window).width();

            this._setTitleState();

            if (this.isChangeOri) {
                this.isChangeOri = false;

                if (window.orientation == 0) {
                    this.initWidndowWidth = Math.min(this.windowWidth, this.windowHeight);
                    this.initWindowHeight = Math.max(this.windowWidth, this.windowHeight);
                } else {
                    this.initWidndowWidth = Math.max(this.windowWidth, this.windowHeight);
                    this.initWindowHeight = Math.min(this.windowWidth, this.windowHeight);
                }

                this.$titleWrap.css({ top: this.initWindowHeight / 2 - this.titleInitHeight / 2 });
            }

            var self = this;
            $.each($('.main_video'), function (idx, item) {
                var width = parseInt($(item).data('width'));
                var height = parseInt($(item).data('height'));
                var newheight = height * self.windowWidth / width;
                $(item).css({
                    width: self.windowWidth,
                    height: newheight
                })
            });
        },

        _setPaging: function () {
            this.$pagingWrap.find('.num_curr').text(this.contID);
            this.$pagingWrap.find('.txt_slash').text("/");
            this.$pagingWrap.find('.num_total').text(this.contTotal);

            var uid = this.$titleWrap.find('.title_item').eq(this.contID - 1).find('.title_txt').data("id");
            var position = this.contID;

            var json = { "id": uid, "position": position };
            if (!this.viewed.some(item => item.id === json.id && item.position === json.position)) {
                this.viewed.push(json)
                console.log(this.viewed)
            }
            /*if(!$.inArray(json, this.viewed)){
                this.viewed.push(json)
                console.log(this.viewed)
            }*/
        },

        _setAcceleratePlus: function (course) {
            var plusvalue = this.wheelAccelerate * course;
            this.accelerate.value -= plusvalue;
        },

        _touchStartHandler: function (e) {
            if (this.isStart) {
                if (this.isActive) {
                    this.isInteraction = true;

                    this.dragScrollChker = false;
                    clearTimeout(this.dragScrollTimer);

                    clearInterval(this.autoScroller);
                }
            } else {
                e.preventDefault();
                e.stopPropagation();
            }
        },

        _touchEndHandler: function (e) {
            if (this.isStart) {
                if (this.isActive) {
                    this.dragScrollChker = true;
                    this.dragScrollTimer = setTimeout(this._dragScrollHandler.bind(this), 120);
                }
            } else {
                e.preventDefault();
                e.stopPropagation();
            }
        },

        _dragScrollHandler: function () {
            this.dragScrollChker = false;

            this.accelerate.value = 0;
            this.scrollstate.value = $(window).scrollTop();

            if (this.scrollstate.value == 0) {
                this.isInteraction = false;
                $(window).trigger('changeLogo.header', 0);
            }

            this._loopAutoScroll();
            this._startAutoScroll();
        },

        _mouseWheelHandler: function (e) {
            if (this.isStart) {
                if (this.isActive) {
                    this.isInteraction = true;

                    var delta = e.wheelDelta;
                    if (Math.abs(delta) < 120) {
                        clearTimeout(this.dragScrollTimer);

                        clearInterval(this.autoScroller);

                        this.dragScrollChker = true;
                        this.dragScrollTimer = setTimeout(this._dragScrollHandler.bind(this), 120);
                    } else {
                        var course = delta < 0 ? -1 : 1;
                        this._setAcceleratePlus(course);

                        e.preventDefault();
                        e.stopPropagation();
                    }
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                }
            } else {
                e.preventDefault();
                e.stopPropagation();
            }
        },

        _startAutoScroll: function () {
            this.isStart = true;
            this.autoScroller = setInterval(this._loopAutoScroll.bind(this), this.autoScrollFps);
        },

        _loopAutoScroll: function () {
            if (this.isActive) {
                this.scrollstate.value += this.autoScrollValue + this.accelerate.value;

                this.accelerate.value += (0 - this.accelerate.value) * this.WAreturnSpd;

                if (Math.abs(this.accelerate.value) < 0.01) this.accelerate.value = 0;

                if (this.scrollstate.value < 0) this.scrollstate.value = 0;
                else if (this.scrollstate.value > this.$imgContainer.height() + $('footer').height()) this.scrollstate.value = this.$imgContainer.height() + $('footer').height();

                $(window).scrollTop(this.scrollstate.value);
                if (this.scrollstate.value == 0) {
                    this.isInteraction = false;
                    $(window).trigger('changeLogo.header', 0);
                }
            }
        },

        _scrollMoveHandler: function (e) {
            if (this.isActive) {
                var scrolltop = $(window).scrollTop() * -1;

                if (this.isInteraction) {
                    $(window).trigger('changeLogo.header', $(window).scrollTop());

                    if ($(window).scrollTop() == 0) this.isInteraction = false;
                }

                var titleInitTopY = this.$titleWrap.position().top;
                var titleInitBottomY = titleInitTopY + this.titleInitHeight;

                var cid = this.contID;

                var imgItems = this.$imgContainer.children();

                $.each(imgItems, function (i, item) {

                    var titleItem = this.$titleWrap.find('.title_item').eq(i);
                    var topy = scrolltop + this.$imgContainer.position().top + $(item).position().top;
                    var bottomy = topy + $(item).height();

                    var titleheight;
                    if (topy > 0) {
                        titleheight = this._setTitleHeight(titleInitBottomY - topy);
                        if (i < 1) titleheight = this.titleInitHeight;

                        this._setTitleTxtPosition(i, titleheight);
                    }

                    if (bottomy < this.windowHeight) {
                        titleheight = this._setTitleHeight(bottomy - titleInitTopY);
                        if (i == this.contTotal - 1) titleheight = this.titleInitHeight;

                        titleItem.css({ height: titleheight });
                    }

                    if (topy < 0 && bottomy >= this.windowHeight) {
                        if (titleItem.height() < this.titleInitHeight) this._setTitleTxtPosition(i, this.titleInitHeight);
                    }

                    if (titleheight > this.titleInitHeight * .7) cid = i + 1;
                }.bind(this));

                if (cid != this.contID) {
                    this.contID = cid;
                    this._setPaging();
                }

                if (this.dragScrollChker) {
                    clearTimeout(this.dragScrollTimer);
                    this.dragScrollTimer = setTimeout(this._dragScrollHandler.bind(this), 120);
                }

                if (!vcui.detect.isMobile) {
                    var imgbottomy = scrolltop + this.$imgContainer.position().top + this.$imgContainer.height();
                    var pagingy = imgbottomy < this.windowHeight ? this.windowHeight - imgbottomy : 0;
                    this.$pagingWrap.find('.paging').css({
                        transform: 'translateY(-' + pagingy + 'px)'
                    });
                    this.$titleWrap.css({
                        transform: 'translateY(-' + pagingy + 'px)'
                    });

                    var copyright = this.$pagingWrap.find('.copyright');
                    var crheight = copyright.height();
                    var crtop = this.$pagingWrap.position().top;
                    var crarea = imgbottomy - crtop;
                    if (crarea > crheight) crarea = crheight;
                    else if (crarea < 0) crarea = 0;
                    copyright.find('.copyright_inner').height(crarea);

                    var foodisplay = this.contID == this.contTotal ? "block" : "none";
                    $('footer').css('display', foodisplay);
                }
            }
        },

        _setTitleTxtPosition: function (i, height) {
            var titleItem = this.$titleWrap.find('.title_item').eq(i);
            var titley = this.titleInitHeight - height;
            titleItem.css({ height: height, top: titley });

            var txtop = height - this.titleInitHeight;
            titleItem.find('.title_block').css({ top: txtop });
        },

        _setTitleHeight: function (height) {
            if (height < 0) return 0;
            else if (height > this.titleInitHeight) return this.titleInitHeight;

            return height;
        }
    });

    return Home;
});