/*! 
 * module vcui.vinylc.works 
 * extends vcui.ui.View 
 * description works content 
 * author VinylC UID Group 
 * create 2018-10-10 
 * update 2018-11-07 
*/

define('vinylc/works_dev', ['jquery', 'jquery.transit', 'vcui', 'greensock'], function ($, transit, core, greensock) {
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

            console.log("########################")
            console.log("isSaveData : " + this.isSaveData);
            console.log("startCount : " + this.startCount);
            console.log("endCount : " + this.endCount);
            console.log("scrollPosition : " + this.scrollPosition);
            console.log("moduleItems : " + this.moduleItems);
            console.log("########################")

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
            // console.log( 'AJAX Call URL: '+settings.url ); 
        },

        _errorListData: function ($data, $status, $message) {
            console.log('JSON load error Status: ' + $status + ' - Message: ' + $message);
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
            this._setModule();
            //this._setImgOnLoad();

            if (!vcui.detect.isMobile) {
                $.each(this.$lists, function (idx, item) {
                    if ($(item).data('type') == "image") {
                        $(item).find('.img_frame').hover(function () {
                            TweenLite.to($(this).find('img.img'), 2, { transformOrigin: "50% 50%", scale: 1.1, rotation: '.001deg', ease: 'easeOutQuart', overwrite: 1 });
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: .4, ease: 'easeOutQuart', overwrite: 1 })
                        }, function () {
                            TweenLite.to($(this).find('img.img'), 2, { transformOrigin: "50% 50%", scale: 1, rotation: '.001deg', ease: 'easeOutQuart', overwrite: 1 });
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: 0.2, ease: 'easeOutQuart', overwrite: 1 })
                        });
                    } else {
                        $(item).find('.video_frame').hover(function () {
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: .4, ease: 'easeOutQuart', overwrite: 1 })
                        }, function () {
                            TweenLite.to($(this).find('.overlay'), 2, { opacity: 0.2, ease: 'easeOutQuart', overwrite: 1 })
                        });
                    }
                }.bind(this));
            }

            var self = this;
            $.each(this.$lists, function (idx, item) {
                $(item).on('click', 'a', function () {
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
                });
            });
        },

        _reLoadedScrollMove: function (newscrolltop) {
            $('html,body').stop().animate({ scrollTop: newscrolltop }, 1600, 'easeInOutExpo');
        },

        // Append module & list / random module type 
        _parserData: function (data) {
            var lists = data.module.list;
            var groupLen = data.module.set_length;
            var moduleCount = this.$moduleWrap.find('.list_type').length;
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
                templateObj.awards = list.aword;

                if (type == 'image') {
                    templateObj.img_frame = { src: list.img_frame.src, alt: list.img_frame.alt, logo: list.img_frame.logo };
                }
                else templateObj.img_frame = { src: '', alt: '', logo: list.img_frame.logo };

                if (type == 'video') {
                    videoNums++;
                    templateObj.video_frame = { title: list.video_frame.title, type: list.video_frame.type };
                    if (list.video_frame.m_src != null && list.video_frame.m_src != undefined && vcui.detect.isMobile && $(window).width() < 1024) {
                        templateObj.video_frame.src = list.video_frame.m_src;
                    } else {
                        templateObj.video_frame.src = list.video_frame.src;
                    }
                }

                var templateList = $.tmpl($('#template-list-' + type + '-type').html(), templateObj);
                templateList.attr('data-type', type);

                if (group == 0) {
                    var templateModule = $.tmpl('<ul class="list_type"></ul>');
                    this.$moduleWrap.append(templateModule);
                }

                $modules = this.$moduleWrap.find('.list_type');
                $modules.eq(moduleCount - 1).append(templateList);
            }.bind(this));

            $modules = this.$moduleWrap.find('.list_type').not('.ui-render');
            $.each($modules, function (i, module) {
                if (!$(module).data('render')) {
                    $(module).data({ videoLen: 0 });
                    setTimeout(function () {
                        $(module).find('video').load();
                    }.bind(this), 0);
                }
            }.bind(this));

            var moduleIdx = 0;

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

                var moduleType;
                if (this.isSaveData == "true") {
                    moduleType = this.moduleItems[moduleIdx];
                    moduleIdx++;
                } else {
                    // Set moduleType, random count                     
                    if ($(module).data('videoLen') > 0) {
                        moduleType = core.number.random(this.MODULETYPE_VIDEO_START, this.MODULETYPE_MAX_LENGTH);
                    } else {
                        if (Math.random() < .5) {
                            moduleType = core.number.random(1, 4);
                        } else {
                            moduleType = core.number.random(7, 10);
                        }
                    }
                    this.moduleItems.push(moduleType);
                }
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
            this.$lists = $modules.find('>li');
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

            // Loading motion ... 
            setTimeout(function () {
                this._loadListData(true);
            }.bind(this), 500);
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

            var self = this;
            $.each($('.list_type li.full .img_frame .img'), function (idx, item) {
                self._setImgCenter($(item));
            });
        },

        _scrollHandler: function (evt) {
            if (this.state == 'list' && this.$lists != undefined && this.$lists != null) {
                this._motionModule();
            }
            return false;
        },

        _mouseWheelHandler: function (evt) {
            $(window).trigger('scroll.works');
            return; // evt.preventDefault(); 
        },

        _setModule: function () {
            $.each(this.$lists, function (i, item) {
                $(item).data('play', false);
            }.bind(this));
        },

        _motionModule: function () {
            var scrollTop = -$(window).scrollTop();

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
        },

        _setImgOnLoad: function () {
            var self = this;
            $.each(this.$lists, function (idx, item) {
                if ($(item).hasClass('full')) {
                    $(item).find('.img_frame .img').load(function () {
                        self._setImgCenter($(this))
                    });
                }
            });
        },

        _setImgCenter: function (item) {
            var imgframe = item.parent();
            var frameheight = imgframe.height();
            var imgheight = item.height();
            item.css({
                top: frameheight / 2 - imgheight / 2
            })
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