/*! 
 * module vcui.vinylc.news 
 * extends vcui.ui.View 
 * description news content 
 * author VinylC UID Group 
 * create 2018-10-10 
 * update 2018-11-07  
*/

define('vinylc/news', ['jquery', 'jquery.transit', 'vcui', 'greensock'], function ($, transit, core) {
    'use strict';

    var News = core.ui('News', {
        bindjQuery: 'news',
        defaults: { state: 'list', ajax: '/json/news-list.json', templatePrefix: 'template-list-' },
        selectors: {
            template: $('<div class="template"></div>'),
            content: '#content',
            titleWrap: '.head_info_txt',
            tabWrap: $('#tab01'),
            moduleWrap: '.list_comm',
            listMore: '.btn_list_more > button',
            tabContent: '.ui_tab_content'
        },
        initialize: function initialize(el, options) {
            if (this.supr(el, options) === false) return;

            // 기본 데이터 셋팅
            this.$tabLists = this.$tabWrap.find('> ul > li');
            this.$tabBar = this.$tabWrap.find('span.bar');
            this.tabIndex = 1;
            this.newsTop = 0;
            this.instTop = 0;

            this.currentModuleState = {};

            this.state = this.options.state;
            this.windowWidth = window.innerWidth;
            this.windowHeight = $(window).height();
            this.topPercent = 0.65;
            this.firstH1Top = $('.header_wrap > h1').position().top;

            this.tabMode = "";

            this.isFirstLoad = false;
            this.isInstaLoad = false;
            this.isInsightLoad = false;

            this.tabBarLeft;
            this.tabBarDist;
            this.firstImgY = '0.2083rem';

            this.maxVideoNums = vcui.detect.isMobile ? 10 : 1;

            this.$tabWrap.find('ul').css({ 'font-size': 0 });

            this.$listMore.data('listTarget', 'list-news');

            this._setWindowSizeData();
            this._setLayout();
            this._bindEvent();
            this._motionTab();
            this._loadTemplate();
            this._tabScrollMotion();
        },

        // 리스트 선택에 따른 모듈 설정
        _setTargetModule: function (target) {
            if (target === 'list-news') {
                return {
                    target: 'list-news',
                    moduleWrap: $('.list_comm'),
                    ajax: $('.list_comm').attr('data-ajax') || '/json/news-list.json',
                    templatePrefix: 'template-list-',
                    listClass: 'list_type',
                    lists: $('.list_comm').find('> ul > li'),

                    pageCount: $('.list_comm').attr('data-page-count') || 1,
                    pageTotal: $('.list_comm').attr('data-page-total') || 0
                }
            } else if (target === 'list-insight') {
                return {
                    target: 'list-insight',
                    moduleWrap: $('.list_insight'),
                    ajax: $('.list_insight').attr('data-ajax') || '/json/insight-list.json',
                    templatePrefix: 'template-list-',
                    listClass: 'list_type',
                    lists: $('.list_insight').find('> ul > li'),

                    pageCount: $('.list_insight').attr('data-page-count') || 1,
                    pageTotal: $('.list_insight').attr('data-page-total') || 0
                }
            } else {
                return {
                    target: 'list-instagram',
                    moduleWrap: $('.list_inst'),
                    ajax: $('.list_inst').attr('data-ajax') || '/json/instagram-list.json',
                    templatePrefix: 'template-list-instagram-',
                    listClass: '',
                    lists: $('.list_inst').find('> ul > li'),

                    pageCount: $('.list_inst').attr('data-page-count') || 1,
                    pageTotal: $('.list_inst').attr('data-page-total') || 0
                }
            }
        },

        // 00 List template load 
        _loadTemplate: function () {
            var templateUrl = $('.ui_tab_panel').attr('data-template');

            this.$template.load(templateUrl, this._completeTemplate.bind(this));
        },

        _completeTemplate: function (html) {
            var a = this.$el.find('.header_wrap').css('padding-bottom');
            var b = (a.indexOf('.') > -1) ? a.split()[0] : a.replace(/[^0-9]/g, '');

            $(html).insertAfter(this.$el);

            this.$template.empty();
            this.MODULETYPE_FIRST_FULLS = [5, 8, 10];
            this.MODULETYPE_LAST_FULLS = [6, 7, 9];
            this.MODULETYPE_VIDEO_START = 5;
            this.MODULETYPE_MAX_LENGTH = 10;
            this.headerH = parseInt(b) || 120; // Header padding-bottom 
            this.footerH = this.$el.find('footer').height();
            this.listMoreH = this.$listMore.height();

            this._loadListData('list-news', 1);
        },

        // 01 List data load 
        _loadListData: function (target, pageCount) {
            var settings = {};

            var modules = this._setTargetModule(target);

            settings.dataType = 'json';
            settings.url = modules.ajax + '?pageCount=' + pageCount;
            settings.error = this._errorListData.bind(this);
            settings.success = this._completeListData.bind(this);
            settings.async = false;
            $.ajax(settings);
        },

        _errorListData: function ($data, $status, $message) {
        },

        // 02 Initialize page render 
        _completeListData: function (data) {
            var modules = this._setTargetModule(data.category);

            // 각 모듈별로 페이징 관련 데이터를 기록한다.  
            modules.moduleWrap.attr('data-load', 'true');
            modules.moduleWrap.attr('data-page-count', data.pageCount);
            modules.moduleWrap.attr('data-page-total', data.pageTotal);

            // reLoadList, moveScrollTop
            var moduleheight = modules.moduleWrap.height();
            if (!!modules.moduleWrap.children().length && moduleheight > 0) {
                var newscrolltop = modules.moduleWrap.position().top + moduleheight - ($('.header_wrap > h1').position().top + $('.header_wrap > h1').height() + 30);
                this._reLoadedScrollMove(newscrolltop)
            }

            modules.target === 'list-instagram' ? this._parserDataNormal(modules, data) : this._parserDataRandom(modules, data);

            if (!this.isFirstLoad) {
                this.isFirstLoad = true;
                this._loadListData('list-instagram', 1);
                this._loadListData('list-insight', 1);

                $('footer').show();
            }

            if (modules.target === 'list-instagram') {
                this.isInstaLoad = true;
                this._resetInstaState();
            } else {
                if (modules.target === 'list-insight') {
                    if (!this.isInsightLoad) {
                        this.isInsightLoad = true;
                        return;
                    }
                }
                console.log(modules.target)

                TweenLite.delayedCall(0.1, this._motionModule.bind(this));

                this._setListMore();
            }
        },

        _resetInstaState: function () {
            var listwidth = $('.list_inst ul li').css('width') == "100%" ? $('.list_inst').eq(0).width() : $('.list_inst ul li').eq(0).width();
            $.each($('.list_inst ul li'), function (idx, item) {
                var initwidth = $(item).find('.crop_wrap').data('width');
                var initheight = $(item).find('.crop_wrap').data('height');
                var scalex = listwidth / initwidth;
                var scaley = listwidth / initheight;
                var scale = Math.max(scalex, scaley);
                var newwidth = initwidth * scale;
                var newheight = initheight * scale;
                var newx = listwidth / 2 - newwidth / 2;
                var newy = listwidth / 2 - newheight / 2;
                $(item).find('.crop_wrap').css({
                    width: newwidth,
                    height: newheight,
                    left: newx,
                    top: newy
                });
            });
        },

        _reLoadedScrollMove: function (scrolltop) {
            var self = this;
            $('html,body').stop().animate({ scrollTop: scrolltop }, 1600, 'easeInOutExpo', function () {
                self._returnScrollEvents();
            });
        },

        // Append module & list / random module type 
        _parserDataRandom: function (modules, data) {
            var lists = data.module.list;
            var groupLen = data.module.set_length;
            var moduleCount = modules.moduleWrap.find('> ul').length;
            var $modules = null;

            var videoNums = 0;

            // ① Detect HTML Template, list type sectect 
            $.each(lists, function (i, list) {
                var group = i % groupLen;
                if (group == 0) {
                    moduleCount++;
                    videoNums = 0;
                }
                var type = (list.video_frame !== undefined && videoNums < this.maxVideoNums) ? 'video' : 'image';
                var templateObj = {};
                templateObj.href = list.href;
                templateObj.txt_cont = { txt: list.txt_frame.txt, date: list.txt_frame.date };

                if (type == 'image') {
                    templateObj.img_frame = { src: list.img_frame.src, alt: list.img_frame.alt, logo: list.img_frame.logo, context: list.img_frame.context };
                } else templateObj.img_frame = { src: '', alt: '', logo: list.img_frame.logo };

                if (type == 'video') {
                    videoNums++;
                    templateObj.video_frame = { title: list.video_frame.title, type: list.video_frame.type };
                    if (list.video_frame.m_src != null && list.video_frame.m_src != undefined && vcui.detect.isMobile && $(window).width() < 1024) {
                        templateObj.video_frame.src = list.video_frame.m_src;
                    } else {
                        templateObj.video_frame.src = list.video_frame.src;
                    }
                }


                var templateList = $.tmpl($('#' + modules.templatePrefix + type + '-type').html(), templateObj);
                templateList.attr('data-type', type);

                if (group == 0) {
                    var templateModule = $.tmpl('<ul class="' + modules.listClass + '"></ul>');
                    modules.moduleWrap.append(templateModule);
                }

                $modules = modules.moduleWrap.find(' > ul');
                $modules.eq(moduleCount - 1).append(templateList);
            }.bind(this));

            $modules = modules.moduleWrap.find('> ul').not('.ui-render');
            $.each($modules, function (i, module) {
                if (!$(module).data('render')) {
                    $(module).data({ videoLen: 0 });
                    setTimeout(function () {
                        $(module).find('video').load();
                    }.bind(this), 0);
                }
            }.bind(this));

            // ② When moduleType random, image 1~10 & video 5~10 
            $.each($modules, function (i, module) {
                if ($(module).data('render')) return;

                // Detect video type in list & video list count 
                var videoCount = 0;
                $.each($(module).find('li'), function (j, list) {
                    if ($(list).attr('data-type') == 'video') {
                        videoCount = videoCount + 1;
                        $(module).data('videoLen', videoCount);
                    }
                }.bind(this));

                // Set moduleType, random count 
                var a, b;
                a = 1;
                b = 4;
                var moduleType = core.number.random(a, b);
                $(module).addClass('type_' + moduleType);

                var moduleTypeNo = parseInt($(module).attr('class').replace(/[^0-9]/g, ''));
                if (this.MODULETYPE_VIDEO_START <= moduleTypeNo && moduleTypeNo <= this.MODULETYPE_MAX_LENGTH) {
                    // MODULETYPE_FIRST_FULLS - moduleTypeNo 5, 8, 10 
                    if (this._isFirstFullList(moduleTypeNo)) {
                        $(module).attr('data-fullSize-index', 1);

                        if (!!$(module).data('videoLen')) {
                            var videoLen = $(module).data('videoLen');
                            if (videoLen == 1) {
                                $.each($(module).find('li'), function (j, list) {
                                    if ($(list).attr('data-type') == 'video') {
                                        $(list).addClass('full');
                                        $(module).find('li').eq(0).before($(list));
                                    }
                                }.bind(this));

                            } else if (videoLen > 1) {
                                var checkFirstVideo = false;
                                $.each($(module).find('li'), function (j, list) {
                                    if ($(list).attr('data-type') == 'video') {
                                        if (!checkFirstVideo) {
                                            checkFirstVideo = true;
                                            $(list).addClass('full');
                                            $(module).find('li').eq(0).before($(list));

                                        } else {
                                            $(list).find('.video_frame').hide();
                                            $(list).find('.img_frame').show();
                                        }
                                    }
                                }.bind(this));
                            }

                        } else {
                            $(module).find('li').eq(0).addClass('full');
                        }

                        // MODULETYPE_LAST_FULLS - moduleTypeNo 6, 7, 9 
                    } else if (this._isLastFullList(moduleTypeNo)) {
                        $(module).attr('data-fullSize-index', 4);

                        if (!!$(module).data('videoLen')) {
                            var videoLen = $(module).data('videoLen');
                            var len = $(module).find('li').length;
                            if (videoLen == 1) {
                                $.each($(module).find('li'), function (j, list) {
                                    if ($(list).attr('data-type') == 'video') {
                                        $(list).addClass('full');
                                        $(module).find('li').eq(len - 1).after($(list));
                                    }
                                }.bind(this));

                            } else if (videoLen > 1) {
                                var checkFirstVideo = false;
                                $.each($(module).find('li'), function (j, list) {
                                    if ($(list).attr('data-type') == 'video') {
                                        if (!checkFirstVideo) {
                                            checkFirstVideo = true;
                                            $(list).addClass('full');
                                            $(module).find('li').eq(len - 1).after($(list));

                                        } else {
                                            $(list).find('.video_frame').hide();
                                            $(list).find('.img_frame').show();
                                        }
                                    }
                                }.bind(this));
                            }

                        } else {
                            var len = $(module).find('li').length;
                            $(module).find('li').eq(len - 1).addClass('full');
                        }
                    }
                }

                $(module).addClass('ui-render').data({ render: true });
            }.bind(this));

            // ③ upate global variable, $lists 
            if (modules.target == 'list-insight') {
                if (this.isInsightLoad) this.$lists = $modules.find('>li');
            } else {
                this.$lists = $modules.find('>li');
            }

            if (!vcui.detect.isMobile) {
                $.each($modules.find('>li'), function (idx, item) {
                    if ($(item).data('type') == "image") {
                        $(item).find('.img_frame .overlay').css('opacity', 0);
                        $(item).find('.img_frame').hover(function () {
                            TweenLite.to($(this).find('img.img'), 2, { transformOrigin: "50% 50%", scale: 1.1, rotation: '.001deg', ease: 'easeOutQuart', overwrite: 1 });
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: .2, ease: 'easeOutQuart', overwrite: 1 })
                        }, function () {
                            TweenLite.to($(this).find('img.img'), 2, { transformOrigin: "50% 50%", scale: 1, rotation: '.001deg', ease: 'easeOutQuart', overwrite: 1 });
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: 0, ease: 'easeOutQuart', overwrite: 1 })
                        });
                    } else {
                        $(item).find('.video_frame .overlay').css('opacity', 0);
                        $(item).find('.video_frame').hover(function () {
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: .2, ease: 'easeOutQuart', overwrite: 1 })
                        }, function () {
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: 0, ease: 'easeOutQuart', overwrite: 1 })
                        });
                    }
                }.bind(this));
            }
        },

        _parserDataNormal: function (modules, data) {
            var lists = data.module.list;
            var $modules = null;

            // ① Detect HTML Template, list type sectect 
            $.each(lists, function (i, list) {
                var type = (list.video_frame !== undefined) ? 'video' : 'image';
                var templateObj = {};
                templateObj.href = list.href;
                templateObj.img_frame = { src: list.img_frame.src, alt: list.img_frame.alt, logo: list.img_frame.logo, width: list.img_frame.width, height: list.img_frame.height };
                templateObj.txt_cont = { txt: list.txt_frame.txt, date: list.txt_frame.date };
                if (type == 'video') {
                    templateObj.video_frame = { title: list.video_frame.title, type: list.video_frame.type, width: list.video_frame.width, height: list.video_frame.height };
                    if (list.video_frame.m_src != null && list.video_frame.m_src != undefined && vcui.detect.isMobile && $(window).width() < 1024) {
                        templateObj.video_frame.src = list.video_frame.m_src;
                    } else {
                        templateObj.video_frame.src = list.video_frame.src;
                    }
                    templateObj.video_frame.poster = templateObj.video_frame.src + "_0frame.png";
                }

                var templateList = $.tmpl($('#' + modules.templatePrefix + type + '-type').html(), templateObj);
                templateList.attr('data-type', type);

                if (modules.moduleWrap.find('> ul').length == 0) {
                    var templateModule = $.tmpl('<ul class="' + modules.listClass + '"></ul>');
                    modules.moduleWrap.append(templateModule);
                }

                $modules = modules.moduleWrap.find(' > ul');
                $modules.append(templateList);
            }.bind(this));

            $modules = modules.moduleWrap.find('> ul').not('.ui-render');
            $.each($modules, function (i, module) {
                if (!$(module).data('render')) {
                    $(module).data({ videoLen: 0 });
                    setTimeout(function () {
                        $(module).find('video').load();
                    }.bind(this), 0);
                }
            }.bind(this));

            if (this.isInstaLoad) {
                // ③ upate global variable, $lists 
                this.$lists = $modules.find('>li');
            }

            if (!vcui.detect.isMobile) {
                $.each($modules.find('>li'), function (idx, item) {
                    if ($(item).data('type') == "image") {
                        $(item).find('.img_frame .overlay').css('opacity', 0);
                        $(item).find('.img_frame').hover(function () {
                            TweenLite.to($(this).find('img.img'), 2, { transformOrigin: "50% 50%", scale: 1.1, rotation: '.001deg', ease: 'easeOutQuart', overwrite: 1 });
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: .2, ease: 'easeOutQuart', overwrite: 1 })
                        }, function () {
                            TweenLite.to($(this).find('img.img'), 2, { transformOrigin: "50% 50%", scale: 1, rotation: '.001deg', ease: 'easeOutQuart', overwrite: 1 });
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: 0, ease: 'easeOutQuart', overwrite: 1 })
                        });
                    } else {
                        $(item).find('.video_frame .overlay').css('opacity', 0);
                        $(item).find('.video_frame').hover(function () {
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: .2, ease: 'easeOutQuart', overwrite: 1 })
                        }, function () {
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: 0, ease: 'easeOutQuart', overwrite: 1 })
                        });
                    }
                }.bind(this));
            }
        },

        _setLayout: function () {
            if (this.state == 'list') {
                this.$tabLists.css({ 'transform': 'translateY(0rem)', '-webkit-transform': 'translateY(0rem)' });
            }
        },

        _bindEvent: function () {
            if (this.state == 'list') {
                this.$tabWrap.on('mouseenter', 'li>a', this._overTab.bind(this));
                this.$tabWrap.on('mouseleave', 'li>a', this._outTab.bind(this));
                this.$tabWrap.on('click', 'li>a', this._clickTab.bind(this));
                this.$listMore.on('click', this._clickListMore.bind(this));
            }

            $(window).on('resize.news', this._resizeHandler.bind(this));
            $(window).on('scroll.news', this._scrollHandler.bind(this));
        },

        _clickListMore: function (evt) {
            this.$listMore.hide();

            var listTarget = this.$listMore.data('listTarget');
            var modules = this._setTargetModule(listTarget);

            this._loadListData(listTarget, parseInt(modules.pageCount) + 1);
            this._removeScrollEvents();

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

        _overTab: function (evt) {
            vcui.util.killDelayedCallsTo(this._activateTab, this);
            var $target = $(evt.currentTarget);
            var index = $target.parent().index() + 1;
            this._activateTab(index);
        },

        _activateTab: function (index, duration) {
            var index = index || this.tabIndex;

            var aniAttr = {
                duration: duration || 300,
                easing: 'easeOutQuart'
            };

            var x = this.tabBarLeft;
            var leng = this.$tabLists.length;
            for (var i = 0, len = leng; i < len; i++) {
                var $a = this.$tabLists.eq(i).find('a');
                var cssAttr = { color: 'rgba(0,0,0,opct)'.replace(/opct/, (i === index - 1) ? '1' : '0.35') };
                $a.stop().animate(cssAttr, aniAttr);

                if (i + 1 < index) {
                    x += this.tabBarLeft + this.tabBarDist + this.$tabLists.eq(i).width();
                }
            }

            var w = this.$tabLists.eq(index - 1).width();
            this.$tabBar.stop(true, true).animate({ left: x, width: w }, aniAttr);
        },

        _outTab: function (evt) {
            vcui.util.delayedCall(this._activateTab, 500, this);
        },

        _clickTab: function (evt) {
            var $target = $(evt.currentTarget);
            var index = $target.parent().index() + 1;

            if (this.tabIndex !== index) {

                this.firstImgY = index == 1 ? '0.2083rem' : '0.3125rem';

                this.$tabContent.hide().eq($target.parent().index()).show();

                var listTarget = $target.attr('data-module');
                var modules = this._setTargetModule(listTarget);

                this.$lists = modules.lists;

                $.each(this.$lists, function (i, item) {
                    $(item).data('play', false);
                }.bind(this));

                this._motionModule();

                this.$listMore.data('listTarget', listTarget);
                this._setListMore();

                this.tabIndex = index;
            }

            var scrolltop;
            var position = this.$tabWrap.css('position');
            if (position == 'fixed') {
                if (vcui.detect.isMobile) {
                    scrolltop = 0;
                } else {
                    scrolltop = $('.hd_txt').height() - ($('.header_wrap h1').position().top + $('.header_wrap h1').height() + 50);
                }
            } else {
                scrolltop = $(window).scrollTop();
            }
            $(window).scrollTop(scrolltop);

            $('.footer_inner').css({ 'z-index': -1 });

            return false;
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
            this.windowWidth = window.innerWidth;
            this.windowHeight = $(window).height();
            this.firstH1Top = $('.header_wrap > h1').position().top;

            if (this.state == 'list') {
                this._setWindowSizeData();
                this._tabScrollMotion();
                this._resizeTab();
                this._activateTab('', 0);
            }

            this._resetInstaState();
        },

        _scrollHandler: function (evt) {
            if (this.state == 'list') {
                if (this.$lists != undefined && this.$lists != null) this._motionModule();
                this._tabScrollMotion();
                this._tabFooterStoper();
            }
            return false;
        },

        _setWindowSizeData: function () {
            if (this.windowWidth > 1280) {
                if (this.windowWidth > 1920) {
                    this.startPosition = 720;
                    this.endPosition = 84;
                    this.fonSize = '40';
                } else {
                    this.startPosition = 7.5 * (($(window).width() / 100) * 5);
                    //this.endPosition = 0.875 * (($(window).width() / 100) * 5);
                    this.endPosition = '0.875rem';
                    this.fonSize = '0.4166';
                }
            } else {
                if (this.windowWidth > 768) {
                    this.startPosition = 11.25 * (($(window).width() / 100) * 5);
                    //this.endPosition = 1.3125 * (($(window).width() / 100) * 5);
                    this.endPosition = '1.3125rem';
                    this.fonSize = '0.625';
                } else {
                    this.startPosition = 0;
                    this.endPosition = 0;
                    this.fonSize = '1.0666';
                }
            }
        },

        _resizeTab: function () {
            var leftvalue, distvalue;
            var ori = window.orientation;
            if (ori !== undefined && ori !== 0 && this.windowWidth < 1024) {
                leftvalue = 0;
                distvalue = 0.7832;
            } else {
                if (this.windowWidth > 1280) {
                    leftvalue = distvalue = 0.3125;
                } else {
                    if (this.windowWidth > 768) {
                        leftvalue = distvalue = 0.46875;
                    } else {
                        leftvalue = 0;
                        distvalue = 1.4933;
                    }
                }
            }

            if (this.windowWidth > 1920) {
                this.tabBarLeft = this.tabBarDist = 30;
            } else {
                this.tabBarLeft = this.windowWidth * .05 * leftvalue;
                this.tabBarDist = this.windowWidth * .05 * distvalue;
            }

            var tabListW = this.$tabWrap.find('li>a').width();
            var tabListH = this.$tabWrap.find('li>a').height();
            this.$tabBar.css({ top: tabListH + 10, height: tabListH * 0.25 });
        },

        _tabScrollMotion: function () {
            var scrollTop = $(window).scrollTop(),
                firstTabTop = this.startPosition * 3,
                fontPercent = 0,
                offsetTop = $(window).data('breakpoint').isPc ? 0 : 50;

            if (this.windowWidth > 768) {
                var uint = this.windowWidth > 1920 ? 'px' : 'rem';

                // 폰트 크기 변경 초기 사이즈의 70%까지 작아짐
                fontPercent = (((firstTabTop - scrollTop) / firstTabTop) < 0.7) ? 0.7 : (firstTabTop - scrollTop) / firstTabTop;
                this.$tabWrap.find('li>a').css({ 'fontSize': this.fonSize * fontPercent + uint });
                this._activateTab('', 0);

                // 스크롤시 탭 영역 위치 고정
                var position = this.$tabWrap.css('position');
                if (scrollTop >= (this.startPosition - this.firstH1Top - offsetTop)) {
                    this.scrollTop = position == 'fixed' ? this.scrollTop : $(window).scrollTop();
                    this.$tabWrap.css({ 'position': 'fixed', 'top': this.endPosition });
                } else {
                    this.scrollTop = $(window).scrollTop();
                    this.$tabWrap.css({ 'position': 'absolute', 'top': this.startPosition });
                }

                this.tabMode = "TOP";
            } else {
                this.$tabWrap.css({ 'position': '', 'top': '' });
                this.$tabWrap.find('li>a').css({ 'fontSize': this.fonSize + 'rem' });
                this._activateTab('', 0);

                this.tabMode = "BOTTOM";
            }
        },

        _tabFooterStoper: function () {
            if (this.tabMode == "BOTTOM") {
                var $footer = $('footer');
                var scrolltop = $(window).scrollTop();
                var footery = $footer.position().top - scrolltop;
                var footerpadding = parseInt($footer.find('.left').css('padding-top'));
                var taby = this.$tabWrap.position().top;
                var tabheight = this.$tabWrap.find('ul').height();
                var disty = taby + tabheight + footerpadding;
                if (disty > footery) {
                    var newy = footery - disty;
                    this.$tabWrap.find('ul').css('top', newy + 'px');
                } else {
                    this.$tabWrap.find('ul').css({ top: 0 })
                }
            } else {
                this.$tabWrap.find('ul').css({ top: 0 })
            }
        },

        _motionTab: function () {
            this.$tabLists.transition({ y: 0, duration: 700, easing: 'easeOutQuart' });

            setTimeout(function () {
                this._resizeTab();
                this.$tabBar.css({ width: 0, left: 0 });
                var w = this.$tabLists.eq(0).width();
                this.$tabBar.stop().animate({ left: this.tabBarLeft, width: w }, { duration: 600, easing: 'easeInOutExpo' });
            }.bind(this), 700);
        },

        _motionModule: function () {
            var scrollTop = -$(window).scrollTop();

            if (this.$lists !== undefined) {
                $.each(this.$lists, function (i, item) {

                    // Appearance image 
                    var moduleTop = this.windowHeight - $(item).position().top;
                    if (!$(item).data('play') && scrollTop < moduleTop) {
                        $(item).data('play', true);

                        TweenLite.set($(item).find('a'), { y: 80 });
                        TweenLite.to($(item).find('a'), 2, { opacity: 1, ease: 'easeOutQuart' });
                        TweenLite.to($(item).find('a'), 1.5, { y: 0, ease: 'easeOutQuart' });
                    };
                }.bind(this));
            };
        },

        _setListMore: function () {
            var listTarget = this.$listMore.data('listTarget');
            var modules = this._setTargetModule(listTarget);
            if (modules.pageCount === modules.pageTotal) {
                this.$listMore.hide().parent().hide();
            } else {
                this.$listMore.show().parent().show();
            }
        },

        // public methode ----------------------------- 

        load: function (target, pageCount) {
            // Exception external call, no list data 
            var modules = this._setTargetModule(target);
            if (modules.pageCount === modules.pageTotal) return;

            this._loadListData(target, pageCount);
        }
    });

    return News;
});