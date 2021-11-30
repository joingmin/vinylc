
define('vinylc/playv', ['jquery', 'jquery.transit', 'vcui', 'greensock', 'libs/froogaloop'], function ($, transit, core, greensock) {
    'use strict';

    var PlayV = core.ui('PlayV', {
        bindjQuery: 'PlayV',
        defaults: {
            playList: '/json/playv_list.json',
            homeLink: "/gr/FCO10.html"
        },
        selectors: {
            description: '.descriptionContainer',
            thumContainer: '.thumContainer',
            videoContainer: '.videoContainer',
            goHome: '.goHome'
        },

        initialize: function initialize(el, options) {
            if (this.supr(el, options) === false) return;

            this.ajax = this.options.playList;

            this.home = this.options.homeLink;

            this.windowWidth;
            this.windowHeight;
            this.stageScaleX;
            this.stageScaleY;
            this.stageScaleMin;
            this.stageScaleMax;
            this.thumMarginTop;
            this.videoWidth;
            this.videoHeight;

            this.isActive = true;

            this.firstChange = true;

            this.listScrollY = 0;
            this.listScrollValue;

            this.selectVID = 0;
            this.prevVID = 0;

            this.videoTotal;

            this.currentVplayer = null;

            this.ctrlHiddenTimer = null;
            this.isCtrlHidden = false;

            this.PARAM_ID = this._getHashData('playv_id');

            this.loadNum = 0;

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

        _getHashData: function (name) {
            var name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
            var results = regex.exec(location.search);

            return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
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
            var self = this;
            var elements;

            self.videoTotal = data.playVideoList.length;

            elements = "<ul>";
            $.each(data.playVideoList, function (idx, list) {
                elements += "<li data-sn='" + list.playv_sn + "' data-vid='" + list.playv_id + "'>";
                elements += "   <img src='" + list.playv_thum + "' />";
                elements += "   <div class='title'>";
                elements += "       <p>" + list.playv_client + "</p>";
                elements += "       <p>" + list.playv_title + "</p>";
                elements += "   </div>";
                elements += "</li>";

            });
            elements += "</ul>";

            self.$thumContainer.append(elements);

            if (!vcui.detect.isMobile) {
                $('#id_sns.sns_cont').addClass('pc');
            }
            self._resizeHandler();

            self._bindEvent();
            self._start();
        },

        _start: function () {
            var self = this;

            $.each(self.$description.find('p'), function (idx, item) {
                TweenLite.to($(item), 1.6, { delay: idx * .2, opacity: 1, ease: Power4.easeInOut })
            });

            $.each(self.$thumContainer.find('ul li'), function (idx, item) {
                if ($(item).offset().top < self.windowHeight) {
                    TweenLite.set($(item), { y: 200, opacity: 0 });
                    TweenLite.to($(item), 1.6, { delay: .6 + idx * .08, y: 0, opacity: 1, ease: Power4.easeInOut });
                }
            });

            TweenLite.to(self.$thumContainer, 1.8, { delay: .6, opacity: 1, ease: Power4.easeInOut, onComplete: function () { self._controllEvent() } });

            TweenLite.set(self.$goHome, { x: -80 });
            TweenLite.to(self.$goHome, 1.2, { delay: 1.2, x: 0, ease: Power4.easeInOut });
            TweenLite.to(self.$goHome, .6, { delay: 1.1, opacity: 1, ease: Power4.easeInOut });
        },

        _bindEvent: function () {
            var self = this;

            $(window).on('resize', function () {
                self._resizeHandler();
            });
        },

        _controllEvent: function () {
            var self = this;

            window.removeEventListener('mousewheel', self._tempStopWheelHandler)

            if (vcui.detect.isMobile) {
            } else {
                /*
                self.$goHome.hover(function(){
                    if(self.isActive) TweenLite.to($(this), .45, {opacity:1, ease:Power4.easeInOut, overwrite:1});
                }, function(){
                    if(self.isActive) TweenLite.to($(this), .3, {opacity:.1, ease:Power4.easeOut, overwrite:1})
                });
                */

                self.$videoContainer.find('.videoCloser').hover(function () {
                    if (self.isActive) {
                        self.isCtrlHidden = false;
                        self._removeHiddenTimer();
                    }
                }, function () {
                    if (self.isActive) self.isCtrlHidden = true;
                });

                self.$videoContainer.find('.playProgress').hover(function () {
                    TweenLite.to($(this), .4, { scaleY: 2.2, ease: Power4.easeOut, overwrite: 1 });
                }, function () {
                    TweenLite.to($(this), .3, { scaleY: 1, ease: Power4.easeOut, overwrite: 1 });
                });


                $(window).on('mousemove', function (e) {
                    if (self.isActive && self.isCtrlHidden) {
                        self._setHiddenTimer();
                        self._showVideoUtils();
                    }
                })
            };

            self.$goHome.on('click', function () {
                if (self.isActive) self._setWhiteCover();
            });

            self.$videoContainer.find('.videoCloser').on('click', function () {
                if (self.isActive) self._hideVideoCont();
            });

            $.each(self.$thumContainer.find("ul li"), function (idx, item) {
                $(item).on('click', function () {
                    self._changeVideoMode(idx);
                });
            });

            self.$videoContainer.find('.playProgress').on('click', function (e) {
                var percent = e.offsetX / $(this).width();
                self.currentVplayer.api("getDuration", function (duration) {
                    var seek = duration * percent;
                    self.currentVplayer.api("setCurrentTime", seek);
                });
            });

            $(window).on("scroll", function () { self._scrollMoved(); })
        },

        _setWhiteCover: function () {
            var self = this;

            self.isActive = false;

            var whitecover = "<div class='whiteCover' style='position:fixed;left:-105%;top:0;width:100%;height:100%;background:#fff;'></div>";
            $('#content').append(whitecover);

            TweenLite.to(self.$goHome, .35, { x: -self.$goHome.width(), ease: Power4.easeInOut });

            TweenLite.to($('.whiteCover'), 1.6, {
                delay: .3, left: 0, ease: Power4.easeInOut, onComplete: function () {
                    location.href = self.home;
                }
            })
        },

        _changeVideoMode: function (idx) {
            var self = this;

            if (self.isActive) {
                self.isActive = false;

                self.selectVID = idx;

                $.each(self.$thumContainer.find('ul li'), function (cdx, item) {
                    if (cdx != self.selectVID) {
                        TweenLite.to($(item), .4, { opacity: 0, ease: Power4.easeInOut });
                    }
                });

                TweenLite.to(self.$goHome, .4, { opacity: 0, ease: Power4.easeInOut });
                TweenLite.to(self.$description, .4, { opacity: 0, ease: Power4.easeInOut });
                TweenLite.to($('footer'), .4, { startAt: { 'z-index': -1 }, opacity: 0, ease: Power4.easeInOut });

                var thuminfo = self._getLargeThumStatus(idx);
                TweenLite.to(thuminfo.title, .9, { opacity: 0, ease: Power4.easeInOut });
                TweenLite.to(thuminfo.thum, 1, {
                    width: self.videoWidth, height: self.videoHeight, y: thuminfo.vtop, x: thuminfo.vleft, ease: Power4.easeInOut, onComplete: function () {
                        self._showVideoCont();
                    }
                });

                self.$thumContainer.css({ 'z-index': 999 })

                $('html.playv').css({ overflow: 'hidden' });
            }
        },

        _getLargeThumStatus: function (idx) {
            var self = this;

            var scrolltop = $(window).scrollTop();
            var thum, vleft, vtop;

            thum = self.$thumContainer.find('ul li').eq(idx);
            vtop = scrolltop - thum.offset().top + self.windowHeight / 2 - self.videoHeight / 2;
            vleft = thum.parent().width() / 2 - self.videoWidth / 2;

            return {
                thum: thum,
                vleft: vleft,
                vtop: vtop,
                thumscrolltop: thum.offset().top - self.windowHeight / 2 + thum.height() / 2,
                title: thum.find('.title')
            }
        },

        _hideVideoCont: function () {
            var self = this;

            var thuminfo, thumwidth, thumheight;

            self.isActive = false;
            self.isCtrlHidden = false;

            self.firstChange = true;

            self.currentVplayer.api('pause');
            self.currentVplayer.removeEvent('finish');
            self.currentVplayer.removeEvent('playProgress');
            self.currentVplayer = null;

            self._removeHiddenTimer();

            TweenLite.to(self.$videoContainer.find('.playProgress'), .3, { opacity: 0, ease: Power4.easeOut, overwrite: 1 });
            TweenLite.to(self.$videoContainer.find('.videoCloser'), .3, { opacity: 0, ease: Power4.easeOut, overwrite: 1 });

            self.$thumContainer.show();
            self.$description.show();
            self.$goHome.show();
            $('footer').show();

            self.$description.css('opacity', 0);

            self.$thumContainer.find('ul li').removeAttr('style');
            self.$thumContainer.find('ul li .title').removeAttr('style');

            $.each(self.$thumContainer.find('ul li'), function (idx, item) {
                if (idx != self.selectVID) {
                    TweenLite.set($(item), { opacity: 0 });
                }
            });

            thuminfo = self._getLargeThumStatus(self.selectVID);
            thumwidth = thuminfo.thum.width();
            thumheight = thuminfo.thum.height();
            thuminfo.title.css('opacity', 0);
            TweenLite.set(thuminfo.thum, { width: self.videoWidth, height: self.videoHeight, x: thuminfo.vleft, y: thuminfo.vtop });

            TweenLite.to(self.$videoContainer, .8, {
                opacity: 0, ease: Power4.easeInOut, onComplete: function () {
                    $('html.playv').removeAttr('style');

                    self.$videoContainer.css({ opacity: 1, display: 'none' });
                    self.$videoContainer.find('.videos').empty();

                    self.isCtrlHidden = false;

                    $.each(self.$thumContainer.find('ul li'), function (idx, item) {
                        if (idx != self.selectVID) {
                            TweenLite.to($(item), 1, { delay: 1.2, opacity: 1, ease: Power4.easeInOut })
                        }
                    });

                    var percent = self._getDescriptionOpacity(thuminfo.thumscrolltop);
                    if (percent > 0) TweenLite.to(self.$description, 1.2, { opacity: percent, ease: Power4.easeInOut });

                    TweenLite.to(self.$goHome, 1.2, { opacity: 1, ease: Power4.easeInOut });
                    $('footer').css('opacity', 1);


                    TweenLite.to($('html, body'), 1.2, { scrollTop: thuminfo.thumscrolltop, ease: Power4.easeInOut });

                    TweenLite.to(thuminfo.thum, 1.2, {
                        width: thumwidth, height: thumheight, x: 0, y: 0, ease: Power4.easeInOut, onComplete: function () {
                            self.isActive = true;

                            thuminfo.thum.removeAttr('style');

                            self.$thumContainer.removeAttr('style');
                            self.$thumContainer.css('opacity', 1);

                            TweenLite.to(thuminfo.title, .45, { opacity: 1, ease: Power4.easeInOut });
                        }
                    });
                }
            })
        },

        _showVideoCont: function () {
            var self = this;

            self.$videoContainer.css('display', 'block');

            self._addVideo();
        },

        _getDescriptionOpacity: function (scrolltop) {
            var self = this;

            var dist = self.windowWidth * .2;
            var percent = 1 - scrolltop / dist;
            if (percent < 0) percent = 0;
            else if (percent > 1) percent = 1;

            return percent;
        },

        _scrollMoved: function () {
            var self = this;
            var scrolltop = $(window).scrollTop();
            var percent = self._getDescriptionOpacity(scrolltop);

            if (self.isActive && self.$description.css('opacity') != percent) {
                self.$description.css('opacity', percent);
            }

            var contbottom = -scrolltop + $('#container').height() - self.windowWidth * .1;
            var gohomeheight = self.$goHome.height();
            var gohomebottom = self.windowHeight / 2 + gohomeheight / 2;

            var gohomedist = gohomebottom - contbottom;
            if (gohomedist < 0) gohomedist = 0;
            TweenLite.set(self.$goHome.find('img'), { y: -gohomedist });
        },

        _getVimeoBlock: function (vdx, autoplay) {
            var iframe = '';
            iframe += "<div class='playv_video'>";
            iframe += ' <iframe width="100%" height="100%" src="https://player.vimeo.com/video/';
            iframe += vdx;
            iframe += '?background=1&muted=0&autopause=1&loop=0&autoplay=' + autoplay + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen allow="autoplay"></iframe>';
            iframe += '</div>'

            return iframe;
        },

        _getVideoID: function (idx) {
            var item = this.$thumContainer.find('ul li').eq(idx);
            return item.data('vid');
        },

        _changeNextVideo: function () {
            var self = this;

            self.isActive = false;

            if (self.selectVID == self.videoTotal - 1) self.selectVID = 0;
            else self.selectVID++;

            self._addVideo();
        },

        _addVideo: function () {
            var self = this;
            var vcontainer, iframe, playv;

            self._setVideoPlayProgress(0);

            vcontainer = self.$videoContainer.find('.videos');
            vcontainer.append(self._getVimeoBlock(self._getVideoID(self.selectVID), 1));

            if (!self.firstChange) {
                playv = vcontainer.find('.playv_video').eq(1);
                TweenLite.set(playv, { y: self.windowHeight + self.windowWidth * .1 });

                self.currentVplayer.removeEvent('finish');
                self.currentVplayer.removeEvent('playProgress');
            } else {
                playv = vcontainer.find('.playv_video').eq(0);
            }

            iframe = playv.find('iframe');
            self.currentVplayer = $f(iframe[0]);

            self.currentVplayer.addEvent('ready', function () {
                self.currentVplayer.addEvent("finish", function () {
                    self._changeNextVideo();
                });

                self.currentVplayer.addEvent("playProgress", function (data) {
                    self._setVideoPlayProgress(data.percent);
                });

                self.currentVplayer.addEvent('play', function () {
                    if (self.firstChange) {
                        self.firstChange = false;
                        self.isActive = true;
                        self.isCtrlHidden = true;

                        self.$videoContainer.find('.playProgress').css('opacity', 1);

                        TweenLite.to(vcontainer, .8, {
                            opacity: 1, ease: Power4.easeInOut, onComplete: function () {
                                self.$thumContainer.hide();
                                self.$description.hide();
                                self.$goHome.hide();
                                $('footer').hide();
                            }
                        });
                    } else {
                        self._changePlayvBlock();
                    }

                    if (vcui.detect.isMobile) TweenLite.to(self.$videoContainer.find('.videoCloser'), 1.2, { opacity: 1, ease: Power4.easeInOut })

                    self.currentVplayer.removeEvent('ready');
                    self.currentVplayer.removeEvent('play');
                });
            });
        },

        _changePlayvBlock: function () {
            var self = this;
            var oblock, cblock;

            oblock = self.$videoContainer.find('.videos .playv_video').eq(0);
            cblock = self.$videoContainer.find('.videos .playv_video').eq(1);

            TweenLite.to(oblock, .8, { y: -self.windowHeight - self.windowWidth * .1, ease: Power4.easeInOut });
            TweenLite.to(cblock, .9, {
                y: 0, ease: Power4.easeInOut, onComplete: function () {
                    self.isActive = true;
                    self.isCtrlHidden = true;

                    self.$videoContainer.find('.videos .playv_video').eq(0).remove();
                }
            });
        },

        _changeVideo: function () {
            var self = this;
            var thum, left, top, wid, hei, thumwidth;

            self._hideVideoUtils();
        },

        _addHiddenTimer: function () {
            var self = this;

            self.ctrlHiddenTimer = setTimeout(function () {
                self._hideVideoUtils();
            }, 700);
        },

        _removeHiddenTimer: function () {
            var self = this;

            if (self.ctrlHiddenTimer != null) {
                clearTimeout(self.ctrlHiddenTimer);

                self.ctrlHiddenTimer = null;
            }
        },

        _setHiddenTimer: function () {
            var self = this;

            self._removeHiddenTimer();
            self._addHiddenTimer();
        },

        _hideVideoUtils: function () {
            var self = this;

            if (self.$videoContainer.find('.videoCloser').css('opacity') > 0) {
                //TweenLite.to(self.$videoContainer.find('.playProgress'), .3, {opacity:0, ease:Power4.easeOut, overwrite:1});
                TweenLite.to(self.$videoContainer.find('.videoCloser'), .8, { opacity: 0, ease: Power4.easeOut, overwrite: 1 });
            }
        },

        _showVideoUtils: function () {
            var self = this;

            if (self.$videoContainer.find('.videoCloser').css('opacity') < 1) {
                //TweenLite.to(self.$videoContainer.find('.playProgress'), .45, {opacity:1, ease:Power4.easeOut, overwrite:1});
                TweenLite.to(self.$videoContainer.find('.videoCloser'), .8, { opacity: 1, ease: Power4.easeOut, overwrite: 1 });
            }
        },

        _setVideoPlayProgress: function (persent) {
            var self = this;
            self.$videoContainer.find('.progressBar').width(self.windowWidth * persent);
        },

        _setVideoStatus: function (paused, ctrl) {
            var self = this;

            var ctrlwrap = self.$ctrlContainer.find('.ctrl_wrap');

            if (paused) {
                if (!ctrl) self.currentVplayer.api('play');
                ctrlwrap.addClass('paused');
            } else {
                if (!ctrl) self.currentVplayer.api('pause');
                ctrlwrap.removeClass('paused');
            }
        },


        _setVideoStatusM: function (idx, paused) {
            var vblock = $('.playv_m_cont li').eq(idx);
            var iframe = vblock.find('iframe');
            var player = $f(iframe[0]);

            var ctrlwrap = vblock.find('.ctrl_wrap');
            var status = ctrlwrap.hasClass('paused');

            if (paused) {
                player.api('play');
                if (!status) ctrlwrap.addClass('paused');
            } else {
                player.api('pause');
                if (status) ctrlwrap.removeClass('paused');

                TweenLite.to(vblock.find('.ctrlContainer'), .6, { opacity: 1, ease: Power4.easeInOut, overwrite: 1 });
            }
        },

        _openSharePop: function () {
            var self = this;

            self.isActive = false;

            self.tempVideoStatus = self._getVideoStatus();
            if (!self.tempVideoStatus) self._setVideoStatus(false);

            $('#id_sns').vcModal().on('modalhide', function () {
                self.isActive = true;

                if (self.tempVideoStatus != self._getVideoStatus()) self._setVideoStatus(!self.tempVideoStatus);
            });
        },

        _openSharePopM: function () {
            var self = this;

            self.isActive = false;

            $.each($('.playv_m_cont li'), function (idx, item) {
                var ctrlwrap = $(item).find('.ctrl_wrap');
                var status = ctrlwrap.hasClass('paused');
                $(item).data('status', status);
                self._setVideoStatusM(idx, false);
            });

            $('#id_sns').vcModal().on('modalhide', function () {
                self.isActive = true;

                $.each($('.playv_m_cont li'), function (idx, item) {
                    var status = $(item).data('status');
                    if (status) self._setVideoStatusM(idx, true);
                });
            });
        },

        _getVideoStatus: function () {
            var self = this;
            var ctrlwrap, status;

            ctrlwrap = self.$ctrlContainer.find('.ctrl_wrap');
            status = !ctrlwrap.hasClass('paused');

            return status;
        },

        _setValue: function () {
            this.windowWidth = $(window).width();
            this.windowHeight = $(window).height();
            this.stageScaleX = this.windowWidth / 1920;
            this.stageScaleY = this.windowHeight / 1080;
            this.stageScaleMin = Math.min(this.stageScaleX, this.stageScaleY);
            this.stageScaleMax = Math.max(this.stageScaleX, this.stageScaleY);

            if (vcui.detect.isMobile) {
                this.videoWidth = 1920 * this.stageScaleMin;
                this.videoHeight = 1080 * this.stageScaleMin;
            } else {
                this.videoWidth = 1920 * this.stageScaleMax;
                this.videoHeight = 1080 * this.stageScaleMax;
            }

            this.thumMarginTop = this.windowWidth * .4;

            this.listScrollValue = 80 * this.stageScaleX;
        },

        _resizeHandler: function (e) {
            var self = this;

            self._setValue();

            self.$videoContainer.find('.videos').css({
                width: self.videoWidth,
                height: self.videoHeight,
                left: self.windowWidth / 2 - self.videoWidth / 2,
                top: self.windowHeight / 2 - self.videoHeight / 2
            });

            if (vcui.detect.isMobile) {
                self.$videoContainer.find('.playProgress').css({
                    top: self.windowHeight / 2 + self.videoHeight / 2 - 1
                });

                self.$videoContainer.find('.videoCloser').css({
                    top: self.windowHeight / 2 - self.videoHeight / 2,
                    left: self.windowWidth / 2 + self.videoWidth / 2 - self.$videoContainer.find('.videoCloser').width()
                });
            } else {
                var hei = self.$videoContainer.find('.playProgress').height();
                self.$videoContainer.find('.playProgress').css({
                    top: self.windowHeight - hei
                });
            }
        }
    });

    return PlayV;
});