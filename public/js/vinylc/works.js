/*! 
 * module vcui.vinylc.works 
 * extends vcui.ui.View 
 * description works content 
 * author VinylC UID Group 
 * create 2018-10-10 
 * update 2018-11-07 
*/

define('vinylc/works', ['jquery', 'jquery.transit', 'vcui', 'greensock'], function ($, transit, core, greensock) {
    'use strict';

    var Works = core.ui('Works', {
        bindjQuery: 'works',
        defaults: { state: 'list', ajax: '/json/works-list.json' },
        selectors: {
            template: $('<div class="template"></div>'),
            content: '#content',
            titleWrap: '.head_info_txt',
            moduleWrap: '.list_comm',
            loading: '.list_loading'
        },
        initialize: function initialize(el, options) {
            if (this.supr(el, options) === false) return;

            this.state = this.options.state;
            this.windowWidth = $(window).width();
            this.windowHeight = $(window).height();

            this.isFirstLoad = true;

            this.maxVideoNums = vcui.detect.isMobile ? 10 : 1;

            this._resizeHandler();
            this._loadTemplate();
        },

        // 00 List template load 
        _loadTemplate: function () {
            var templateUrl = this.$moduleWrap.attr('data-template');
            this.$template.load(templateUrl, this._completeTemplate.bind(this));
        },

        _completeTemplate: function (html) {
            $(html).insertAfter(this.$el);
            this.$template.empty();

            this.MODULETYPE_FIRST_FULLS = [5, 8, 10];
            this.MODULETYPE_LAST_FULLS = [6, 7, 9];
            this.MODULETYPE_VIDEO_START = 5;
            this.MODULETYPE_MAX_LENGTH = 10;
            this.$topTitle = this.$titleWrap.find('.em_txt');
            this.$listMore = this.$content.find('.btn_list_more > button');
            this.$listLoader = this.$content.find('.list_loading');
            this.ajax = this.$moduleWrap.attr('data-ajax') || this.options.ajax;
            var a = this.$el.find('.header_wrap').css('padding-bottom');
            var b = (a.indexOf('.') > -1) ? a.split()[0] : a.replace(/[^0-9]/g, '');
            this.headerH = parseInt(b) || 120; // Header padding-bottom 
            this.footerH = this.$el.find('footer').height();
            this.listMoreH = this.$listMore.height();

            this.moduleItems = [];

            this.pageTotal = 0;
            this.startCount = 1;
            this.endCount = 1;
            this.scrollPosition = 0;
            this.isSaveData = sessionStorage.getItem('isSaveData');
            if (this.isSaveData != null && this.isSaveData == 'true') {
                this.startCount = sessionStorage.getItem('startCount');
                this.endCount = sessionStorage.getItem('endCount');
                this.scrollPosition = parseInt(sessionStorage.getItem('scrollPosition'));
                this.moduleItems = sessionStorage.getItem('moduleItems').split("|");
            }

            this._bindEvent();

            this._loadListData();
        },

        // 01 List data load 
        _loadListData: function (more) {
            var settings = {};
            settings.dataType = 'json';
            settings.url = this.ajax + '?startCount=' + this.startCount + '&endCount=' + this.endCount;
            settings.error = this._errorListData.bind(this);
            settings.success = this._completeListData.bind(this);
            settings.async = false;
            $.ajax(settings);
        },

        _errorListData: function ($data, $status, $message) {
        },

        // 02 Initialize page render 
        _completeListData: function (data) {
            this.$listLoader.hide();

            this.startCount = this.endCount = data.endCount;
            this.pageTotal = data.pageTotal;

            if (this.isSaveData == 'true') {
                this.isFirstLoad = false;
                this._setThumnails(data);

                this.$topTitle.css('opacity', 1);

                $('footer').show();

                $(window).scrollTop(this.scrollPosition);

                $.each($('.list_comm .list_type'), function (idx, item) {
                    var moduleTop = $('.list_comm').position().top + $(item).position().top;
                    var bottomy = $(window).scrollTop() + $(window).height();

                    if (moduleTop < bottomy) {
                        $(item).find('li').data('play', true);
                        $(item).find('li a').css('opacity', 1);
                    } else {
                        $(item).find('li').data('play', false);
                    }
                });

                this.isSaveData = null;
            } else {
                if (this.isFirstLoad) {
                    this.isFirstLoad = false;

                    this.$topTitle.css('opacity', 0).stop(true, true).animate({ opacity: 1 }, 2000, 'easeOutQuart');

                    TweenLite.delayedCall(1, this._setThumnails.bind(this), [data]);

                    TweenLite.delayedCall(1.1, this._motionModule.bind(this));

                    TweenLite.delayedCall(1.2, function () { $('footer').show(); });
                } else {
                    var newscrolltop = this.$moduleWrap.position().top + this.$moduleWrap.height() - ($('.header_wrap > h1').position().top + $('.header_wrap > h1').height() + 30);

                    this._setThumnails(data);

                    TweenLite.delayedCall(0.5, this._reLoadedScrollMove.bind(this), [newscrolltop]);
                }
            }
        },

        _setThumnails: function (data) {

            if (data.endCount === data.pageTotal) {
                this.$listMore.hide().parent().hide();
            } else {
                this.$listMore.show().parent().show();
            }

            this._parserData(data);
        },

        _reLoadedScrollMove: function (newscrolltop) {
            var self = this;
            $('html,body').stop().animate({ scrollTop: newscrolltop }, 1600, 'easeInOutExpo', function () {
                self._returnScrollEvents();
            });
        },

        // Append module & list / random module type 
        _parserData: function (data) {
            var lists = data.module.list;
            var leng = lists.length;
            var groupLen = data.module.set_length;

            var moduleIdx = 0;

            var moduleGroup, visualSource, visualPoster, moduleType;

            var self = this;

            // ① Detect HTML Template, list type sectect 
            $.each(lists, function (i, list) {
                var group = i % groupLen;
                if (group == 0) {
                    if (self.isSaveData == "true") {
                        moduleType = self.moduleItems[moduleIdx];
                        moduleIdx++;
                    } else {
                        var firstvideo = lists[i].video_frame;

                        var last = Math.min(i + groupLen - 1, leng - 1);
                        var lastvideo = lists[last].video_frame;
                        var a, b;

                        if (firstvideo != undefined) {
                            if (Math.random() < .4) a = b = 5;
                            else {
                                if (Math.random() < .5) a = 1, b = 4;
                                else a = 7, b = 10;
                            }
                        } else {
                            if (lastvideo != undefined) {
                                if (Math.random() < .4) a = b = 6;
                                else {
                                    if (Math.random() < .5) a = 1, b = 4;
                                    else a = 7, b = 10;
                                }
                            } else {
                                if (Math.random() < .5) a = 1, b = 4;
                                else a = 7, b = 10;
                            }
                        }

                        moduleType = core.number.random(a, b);
                        self.moduleItems.push(moduleType);
                    }

                    moduleGroup = $.tmpl('<ul class="list_type type_' + moduleType + '"></ul>');
                    self.$moduleWrap.append(moduleGroup);
                }
                var type = (list.video_frame !== undefined) ? 'video' : 'image';

                var confidential = list.confidential;
                //confidential = "/images/confidential_ko.png";
                //confidential = "Confidential";

                var templateObj = {};
                templateObj.href = list.href;
                templateObj.txt_cont = { txt: list.txt_frame.txt, date: list.txt_frame.date };
                templateObj.awards = list.aword;
                templateObj.confidential = confidential;

                visualSource = "";
                visualPoster = "";

                if (type == 'video') {
                    templateObj.video_frame = { title: list.video_frame.title, type: list.video_frame.type, poster: "" };
                    if (list.video_frame.m_src != null && list.video_frame.m_src != undefined && vcui.detect.isMobile && $(window).width() < 1024) {
                        templateObj.video_frame.src = list.video_frame.m_src;
                    } else {
                        if (self._isFirstFullList(moduleType) && group == 0) {
                            templateObj.video_frame.src = list.video_frame.src;
                        } else if (self._isLastFullList(moduleType) && group == groupLen - 1) {
                            templateObj.video_frame.src = list.video_frame.src;
                        } else {
                            templateObj.video_frame.src = list.video_frame.m_src;
                        }
                    }
                    visualSource = templateObj.video_frame.src;
                    visualPoster = visualSource + "_0frame.png";
                    templateObj.video_frame.src = "";
                }

                if (type == 'image') {
                    templateObj.img_frame = { src: list.img_frame.src, alt: list.img_frame.alt, logo: list.img_frame.logo };
                    visualSource = templateObj.img_frame.src;
                    templateObj.img_frame.src = "";
                }
                else templateObj.img_frame = { src: '', alt: '', logo: list.img_frame.logo };

                var isConfidential = (confidential != undefined && confidential != "" && confidential != null) ? true : false;
                var templateList = $.tmpl($('#template-list-' + type + '-type').html(), templateObj);
                templateList.attr('data-type', type);
                templateList.attr('data-active', false);
                templateList.attr('data-src', visualSource);
                templateList.attr('data-poster', visualPoster);
                templateList.attr('data-confidential', isConfidential);

                if (self._isFirstFullList(moduleType) && group == 0) {
                    $(templateList).addClass("full");
                } else if (self._isLastFullList(moduleType) && group == groupLen - 1) {
                    $(templateList).addClass("full");
                }

                if (!vcui.detect.isMobile) {
                    templateList.find('a').hover(function () {
                        self._listOver(templateList);
                    }, function () {
                        self._listOut(templateList);
                    });
                }

                templateList.on('click', 'a', function (e) {
                    if ($(this).parent().data('confidential')) {
                        e.preventDefault();

                        if (vcui.detect.isMobile) {
                            if ($(this).find('.img_confidential').css('opacity') > 0) {
                                self._listOut(templateList);
                            } else {
                                self._listOver(templateList);
                            }
                        }
                    } else {
                        sessionStorage.setItem('isSaveData', 'true');
                        sessionStorage.setItem('startCount', 1);
                        sessionStorage.setItem('endCount', self.endCount);
                        sessionStorage.setItem('scrollPosition', $(window).scrollTop());

                        var moduleItems = self.moduleItems[0];
                        var leng = self.moduleItems.length;
                        for (var i = 1; i < leng; i++) {
                            moduleItems += "|" + self.moduleItems[i];
                        }
                        sessionStorage.setItem('moduleItems', moduleItems);

                        $.each($('video'), function (vdx, video) {
                            try {
                                $(video)[0].pause();
                            } catch (err) { }
                        });
                    }
                });

                $(moduleGroup).append(templateList);
            });
        },

        _listOver: function (list) {
            var overlayOpacity = .4;
            var logoOpacity = 1;
            if ($(list).data('confidential')) {
                overlayOpacity = .7;
                logoOpacity = .3;

                TweenLite.to($(list).find('.img_confidential'), 2, { opacity: 1, ease: 'easeOutQuart', overwrite: 1 });
            }
            TweenLite.to($(list).find('img.img'), 2, { transformOrigin: "50% 50%", scale: 1.1, rotation: '.001deg', ease: 'easeOutQuart', opacity: 1, overwrite: 1 });
            TweenLite.to($(list).find('.overlay'), 2, { opacity: overlayOpacity, ease: 'easeOutQuart', overwrite: 1 });
            TweenLite.to($(list).find('.img_logo'), 2, { opacity: logoOpacity, ease: 'easeOutQuart', overwrite: 1 });
        },
        _listOut: function (list) {
            TweenLite.to($(list).find('img.img'), 2, { transformOrigin: "50% 50%", scale: 1, rotation: '.001deg', ease: 'easeOutQuart', opacity: 1, overwrite: 1 });
            TweenLite.to($(list).find('.overlay'), 2, { opacity: 0.2, ease: 'easeOutQuart', overwrite: 1 });
            TweenLite.to($(list).find('.img_logo'), 2, { opacity: 1, ease: 'easeOutQuart', overwrite: 1 });

            if ($(list).data('confidential')) {
                TweenLite.to($(list).find('.img_confidential'), 2, { opacity: 0, ease: 'easeOutQuart', overwrite: 1 });
            }
        },

        _bindEvent: function () {
            if (this.state == 'list') {
                this.$listMore.on('click', this._clickListMore.bind(this));
            }

            $(window).on('resize.works', this._resizeHandler.bind(this));
            $(window).on('scroll.works', this._scrollHandler.bind(this));
            $(document).on('mousewheel.works', this._mouseWheelHandler.bind(this));
        },

        _clickListMore: function (evt) {
            this.$listMore.hide();
            this.$listLoader.show();
            this.startCount = this.endCount = this.endCount + 1;

            this._removeScrollEvents();
            this._loadListData(true);

            $('.footer_inner').css({ 'z-index': -1 });
        },

        _removeScrollEvents: function () {
            window.addEventListener("mousewheel", this._stopWheelEvent, { passive: false });
            window.addEventListener("touchstart", this._stopWheelEvent, { passive: false });
            window.addEventListener("touchmove", this._stopWheelEvent, { passive: false });
            window.addEventListener("touchend", this._stopWheelEvent, { passive: false });
        },

        _stopWheelEvent: function (e) {
            e.preventDefault();
            e.stopPropagation();
        },

        _returnScrollEvents: function () {
            window.removeEventListener('mousewheel', this._stopWheelEvent);
            window.removeEventListener('touchstart', this._stopWheelEvent);
            window.removeEventListener('touchmove', this._stopWheelEvent);
            window.removeEventListener('touchend', this._stopWheelEvent);
        },

        _isFirstFullList: function (no) {
            var arr = this.MODULETYPE_FIRST_FULLS;
            for (var i = 0, len = arr.length; i < len; i++) {
                if (arr[i] == no) return true;
            }
            return false;
        },

        _isLastFullList: function (no) {
            var arr = this.MODULETYPE_LAST_FULLS;
            for (var i = 0, len = arr.length; i < len; i++) {
                if (arr[i] == no) return true;
            }
            return false;
        },

        _resizeHandler: function (evt) {
            this.windowHeight = $(window).height();

            var winwidth = window.innerWidth;
            if (winwidth > 768) {

                if (window.orientation != undefined && window.orientation == 90) {
                    winwidth = Math.max($(window).width(), $(window).height());
                }

                var infowidth = $('.head_info_txt .hd_txt').width();
                var infox = $('.head_info_txt .hd_txt .em_txt').position().left;
                var dist = (winwidth - infowidth) / 2;
                var txtwidth = infowidth - infox - dist - dist * .5;
                $('.head_info_txt .hd_txt .em_txt').width(txtwidth);
            } else {
                $('.head_info_txt .hd_txt .em_txt').width('auto');
            }


            var listModules = this.$moduleWrap.find('.list_type li[data-active="true"]');
            $.each(listModules, function (i, item) {
                var type;
                type = $(item).attr('data-type');
                if (type == "video") {
                    if (!vcui.detect.isMobile && $(item).hasClass('full')) {
                        var hei = $(item).find('.video_frame').width() * 9 / 16;
                        $(item).find('.img_logo').height(hei);
                    } else {
                        $(item).find('.img_logo').height($(item).width());
                    }
                }
            });

            this._motionModule();
        },

        _scrollHandler: function (evt) {
            this._motionModule();

            return false;
        },

        _mouseWheelHandler: function (evt) {
            $(window).trigger('scroll.works');
            return; // evt.preventDefault(); 
        },

        _motionModule: function () {
            var scrollTop = $(window).scrollTop();

            var self = this;
            var listModules = this.$moduleWrap.find('.list_type li[data-active="false"]');
            $.each(listModules, function (i, item) {
                var itemy = $(item).position().top - scrollTop;
                var itemheight = $(item).height();
                if (itemy + itemheight > 0 && itemy < self.windowHeight) {
                    $(item).attr('data-active', 'true');

                    if (itemy > 0) {
                        TweenLite.set($(item).find('a'), { y: 80 });
                        TweenLite.to($(item).find('a'), 1.5, { y: 0, ease: 'easeOutQuart' });
                    }
                    TweenLite.to($(item).find('a'), 2, { opacity: 1, ease: 'easeOutQuart' });

                    var type, src, poster, newimg, media;
                    type = $(item).attr('data-type');
                    src = $(item).attr('data-src');
                    if (type == "video") {
                        media = $(item).find('.video_frame video');
                        poster = $(item).attr('data-poster');
                        media.attr('poster', poster);
                        media.find('source').attr('src', src);
                        media.load();

                        if (!vcui.detect.isMobile && $(item).hasClass('full')) {
                            var hei = $(item).find('.video_frame').width() * 9 / 16;
                            $(item).find('.img_logo').height(hei);
                        } else {
                            $(item).find('.img_logo').height($(item).width());
                        }
                    } else {
                        media = $(item).find('.img_frame .img');
                        media.css('opacity', 0);

                        newimg = new Image();
                        newimg.onload = function () {
                            TweenLite.to(media, 2, { opacity: 1, ease: 'easeOutQuart' })
                        }
                        newimg.src = src;
                        media.attr('src', newimg.src);
                    }

                    $(item).removeAttr('data-src').removeAttr('data-poster');
                };
            });
        },

        // public methode ------------------------------- 

        loadList: function (start, end) {
            // Exception external call, no list data 
            if (this.endCount == this.pageTotal) return;

            this.startCount = start;
            this.endCount = end;

            this._loadListData();
        }
    });

    return Works;
});