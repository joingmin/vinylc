/*! 
 * module vcui.vinylc.goods 
 * extends vcui.ui.View 
 * description goods content 
 * author VinylC UID Group 
 * create 2018-10-10 
 * update 2018-11-07 
*/

define('vinylc/goods', ['jquery', 'jquery.transit', 'vcui', 'greensock'], function ($, transit, core, greensock) {
    'use strict';

    var Goods = core.ui('Goods', {
        bindjQuery: 'goods',
        defaults: { state: 'list', ajax: '/json/goods-list.json' },
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
            //this.MODULETYPE_VIDEO_START = 5; 
            this.MODULETYPE_VIDEO_START = 7;
            this.MODULETYPE_MAX_LENGTH = 10;
            this.$topTitle = this.$titleWrap.find('.em_txt');
            this.$listMore = this.$content.find('.btn_list_more > button');
            this.$listLoader = this.$content.find('.list_loading');
            this.ajax = this.$moduleWrap.attr('data-ajax') || this.options.ajax;
            this.pageCount = 1;
            this.pageTotal = 0;
            var a = this.$el.find('.header_wrap').css('padding-bottom');
            var b = (a.indexOf('.') > -1) ? a.split()[0] : a.replace(/[^0-9]/g, '');
            this.headerH = parseInt(b) || 120; // Header padding-bottom 
            this.footerH = this.$el.find('footer').height();
            this.listMoreH = this.$listMore.height();

            this.isFirstLoad = true;

            this._bindEvent();

            this._resizeHandler();

            this._loadListData();
        },

        // 01 List data load 
        _loadListData: function (pageCount) {
            this.pageCount = pageCount || this.pageCount;

            var settings = {};
            settings.dataType = 'json';
            settings.url = this.ajax + '?pageCount=' + this.pageCount;
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

            this.pageCount = data.pageCount;
            this.pageTotal = data.pageTotal;

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
        },

        _setThumnails: function (data) {

            if (data.pageCount === data.pageTotal) {
                this.$listMore.hide().parent().hide();
            } else {
                this.$listMore.show().parent().show();
            }

            this._parserData(data);
            this._setModule();

            if (!vcui.detect.isMobile) {
                $.each(this.$lists, function (idx, item) {
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

        _reLoadedScrollMove: function (newscrolltop) {
            var self = this;
            $('html,body').stop().animate({ scrollTop: newscrolltop }, 1600, 'easeInOutExpo', function () {
                self._returnScrollEvents();
            });
        },

        // Append module & list / random module type 
        _parserData: function (data) {
            var lists = data.module.list;
            var groupLen = data.module.set_length;
            var moduleLen = Math.ceil(lists.length / groupLen);
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

                if (type == 'image') templateObj.img_frame = { src: list.img_frame.src, alt: list.img_frame.alt, logo: list.img_frame.logo };
                else templateObj.img_frame = { src: '', alt: '', logo: list.img_frame.logo };

                if (type == 'video') {
                    videoNums++;
                    templateObj.video_frame = { title: list.video_frame.title, type: list.video_frame.type };
                    if (list.video_frame.m_src != null && list.video_frame.m_src != undefined && vcui.detect.isMobile && $(window).width() < 1024) {
                        templateObj.video_frame.src = list.video_frame.m_src;
                    } else {
                        templateObj.video_frame.src = list.video_frame.src;
                    }
                    templateObj.video_frame.poster = templateObj.video_frame.src + "_0frame.png";
                }


                var templateList = $.tmpl($('#template-list-' + type + '-type').html(), templateObj);
                templateList.attr('data-type', type);
                if (group == 0) {
                    var templateModule = $.tmpl('<ul class="list_type"></ul>');
                    this.$moduleWrap.append(templateModule);
                }

                if (list.on_sale == "on") {
                    var flag = "";
                    flag += '<div class="flag_wrap">';
                    flag += '   <span>ON SALE</span>';
                    flag += '</div>';

                    templateList.find('.img_frame').prepend(flag);
                }

                $modules = this.$moduleWrap.find('.list_type');
                $modules.eq(moduleCount - 1).append(templateList);
                /* $modules.data( {videoLen:0} ); 
                setTimeout( function() { 
                    $modules.find('video').load(); 
                }.bind(this), 0 ); */
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
                var a = ($(module).data('videoLen') > 0) ? this.MODULETYPE_VIDEO_START : 1;
                var moduleType = core.number.random(a, this.MODULETYPE_MAX_LENGTH);
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

        _setLayout: function () {
            if (this.state == 'list') {
                this._setTitle();
                // this._setModule(); 
            }
        },

        _bindEvent: function () {
            if (this.state == 'list') {
                this.$listMore.on('click', this._clickListMore.bind(this));
            }

            $(window).on('resize.goods', this._resizeHandler.bind(this));
            $(window).on('scroll.goods', this._scrollHandler.bind(this));
            $(document).on('mousewheel.goods', this._mouseWheelHandler.bind(this));
        },

        _clickListMore: function (evt) {
            this.$listMore.hide();
            this.$listLoader.show();
            this.pageCount = this.pageCount + 1;

            this._removeScrollEvents();
            this._loadListData();

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
        },

        _scrollHandler: function (evt) {
            var scrollTop = $(window).scrollTop();
            /* var isMoreData = ( this.pageCount < this.pageTotal ) ? true : false; 
            if( isMoreData && scrollTop >= $(document).height() - this.windowHeight ) { 
                this._loadListData();    
            } */

            if (this.state == 'list' && this.$lists != undefined && this.$lists != null) {
                this._motionModule();
            }
            return false;
        },

        _mouseWheelHandler: function (evt) {
            /* if( this.state == 'list' ) { 
                this._motionModule(); 
            } */

            $(window).trigger('scroll.goods');
            return; // evt.preventDefault(); 
        },

        _setTitle: function () {
            //            this.$topTitle.css('opacity',0);
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

        // public methode ------------------------------- 

        loadList: function (pageCount) {
            // Exception external call, no list data 
            if (this.pageCount == this.pageTotal) return;

            this._loadListData(pageCount);
        }
    });

    return Goods;
});