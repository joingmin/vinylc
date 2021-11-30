
define( 'vinylc/careersbnr', ['jquery', 'vcui'], function( $, core ) {
    'use strict';

    var Careersbnr = core.ui('Careersbnr', {
        bindjQuery: 'careersbnr', 
        initialize: function initialize(el) {
            this.$wrap = $(el);
            this.$indicater = this.$wrap.find('.indi_wrap');

            this.$listWrap = this.$wrap.find('.ui_carousel_list');

            this.$slideWrap = this.$wrap.find('.ui_carousel_track'); 
            this.$slides = this.$slideWrap.children();

            this.slideID = 0;

            this.startSlideX;
            this.startSlideY;
            this.moveSlideX;
            this.moveSlideY;
            this.distSlideX;
            this.distSlideY;
            this.isTouch = false;
            this.isTouchStart = false;

            this.isTrans = false;

            this.slideSpd = vcui.detect.isMobile ? 500 : 1000;

            this.slidePositionX;

            this.outterDist;

            this.hoverState = [];

            this.rollingTimer = null;

            this._setSlideState();

            this._bindEvents();

            this._selectIndicater();

            this._stageResizeHandler();

            setTimeout(this._resetSlidePosition.bind(this), 10);
            $('.apply_tbanner').delay(500).animate( {opacity:1}, 1000, 'easeOutQuart' );
        },

        _getImgDistance: function(gdx){
            var imgdist;

            if (gdx == this.slideID) imgdist = "-50%";
            else if (gdx > this.slideID) imgdist = "-" + (50 + this.outterDist) + "%";
            else if (gdx < this.slideID) imgdist = "-" + (50 - this.outterDist) + "%";

            return imgdist;
        },

        _setSlideState: function(){
            this.winWidth = $(window).width();
            this.slideWidth = $(this.$slides[0]).outerWidth();
            this.margins = (this.winWidth - this.slideWidth)/2;

            var persent = this.winWidth/1280;
            if(persent > 1) persent = 1;

            this.outterDist = 40 * persent;
        },

        _resetSlidePosition: function(){
            $.each(this.$slides, function(sdx, item){
                TweenLite.set($(item), {
                    position: 'absolute',
                    top: 0,
                    left: sdx*this.slideWidth
                });

                TweenLite.to($(item).find('.image img'), .1, {
                    x: this._getImgDistance(sdx),
                    y:"-50%",
                    overwrite:1
                });
            }.bind(this));

            this.slidePositionX = this.margins - this.slideWidth*this.slideID;
            TweenLite.to(this.$slideWrap, .1, {x:this.slidePositionX, overwrite:1, onComplete:this._startRolling.bind(this)});
        },

        _startRolling: function(){
            var self = this;

            if(self.rollingTimer == null){
                self.rollingTimer = setTimeout(function(){
                    var sidx = self.slideID+1;
                    if(sidx > 3) sidx = 0;
                    self._changeSlideCont(sidx);
                }, 3000);
            }
        },

        _stopRolling: function(){
            var self = this;

            if(self.rollingTimer != null){
                clearTimeout(self.rollingTimer);
                self.rollingTimer = null;
            }
        },

        _stageResizeHandler: function(e){
            this._setSlideState();

            this._stopRolling();
            this._resetSlidePosition();
            
            var winwidth = window.innerWidth;
            if (winwidth > 768){

                if (window.orientation != undefined && window.orientation == 90){
                    winwidth = Math.max($(window).width(), $(window).height());
                }

                var infowidth = $('.head_info_txt .hd_txt').width();
                var infox = $('.head_info_txt .hd_txt .em_txt').position().left;
                var dist = (winwidth - infowidth)/2;
                var txtwidth = infowidth - infox - dist - dist*.5;
                $('.head_info_txt .hd_txt .em_txt').width(txtwidth);
            } else{
                $('.head_info_txt .hd_txt .em_txt').width('auto');
            }
        },

        _hoverStateTrans: function(idx, scale){
           TweenLite.to(this.hoverState[idx], 2, {
               value:scale, 
               onUpdate:this._hoverStateTransUpdate.bind(this), 
               onUpdateParams:[idx], 
               ease:Power1.easeOut, 
               overwrite:1
            });

            var alp = scale == 1 ? .2 : .4;
            var overlay = $(this.$slides[idx]).find('.overlay');
            TweenLite.to(overlay, 2, {opacity:alp, x:0, ease:Power1.easeOut, overwrite:1});
        },

        _hoverStateTransUpdate:function(idx){
            var img = $(this.$slides[idx]).find('.image img');
            TweenLite.set(img, {scale:this.hoverState[idx].value});
        },

        _bindEvents: function(){
            $.each(this.$indicater.find('ul li'), function(idx, item){
                var btn = $(item).find('button');
                btn.data('idx', idx);
                btn.on('click', this._indcaterClickHandler.bind(this));

                if (!vcui.detect.isMobile) btn.addClass('pc');
            }.bind(this));

            if (vcui.detect.isMobile){
                this.$listWrap.on('touchstart', this._touchStartHandler.bind(this));
                this.$listWrap.on('touchmove', this._touchMoveHandler.bind(this));
                this.$listWrap.on('touchend', this._touchEndHandler.bind(this));
            } else{
                $.each(this.$slides, function(cdx, item){
                    this.hoverState.push({value:1});
                    $(item).find('a').data('hID', cdx);
                    $(item).find('a').on('click', function(){    
                        if(this.slideID == cdx){
                            var url = $(item).find('a').attr('href');
                            location.href = url;
                        } else{
                            this._changeSlideCont(cdx);
                        }
    
                        return false;
                    }.bind(this));
    
                    $(item).find('a').hover(function(){
                        this._stopRolling();

                        var hid = $(item).find('a').data('hID');
                        this._hoverStateTrans(hid, 1.2);                    
                    }.bind(this), function(){
                        this._startRolling();

                        var hid = $(item).find('a').data('hID');
                        this._hoverStateTrans(hid, 1);     
                    }.bind(this));
                }.bind(this));
            }

            $(window).on('resize', this._stageResizeHandler.bind(this));
            $(window).on('changeGnbState', this._changeGnbState.bind(this));

            $.each($('.apply_wrap ul li'), function(idx, item){
                $(item).find('button').on('click', function(){
                    var active = $(this).parent().hasClass('active');
                    if(!active){
                        var viewpoint = $('.apply_wrap').position().top - ($('.header_wrap > h1').position().top + $('.header_wrap > h1').height() + 30);
                        viewpoint += $(this).innerHeight()*idx;
                        TweenLite.to($('html, body'), .8, {scrollTop:viewpoint, ease:Power3.easeInOut, overwrite:1});
                    }
                });
               
            });
        },

        _changeGnbState: function(e, data){
            if (data == 'close') this._stageResizeHandler();
        },

        _touchStartHandler: function(e){
            this._stopRolling();

            var touch = e.originalEvent.touches[0]; 
            this.startSlideX = touch.pageX;
            this.startSlideY = touch.pageY;

            this.isTouch = true;

            TweenLite.killTweensOf(this.$slideWrap);
        },

        _touchMoveHandler: function(e){
            if (!this.isTouchStart && this.isTouch){
                var touch = e.originalEvent.touches[0]; 

                this.distSlideX = this.startSlideX - touch.pageX;
                this.distSlideY = this.startSlideY - touch.pageY;

                var absDistX = Math.abs(this.distSlideX);
                var absDistY = Math.abs(this.distSlideY);

                if (absDistX > absDistY){
                    this.moveSlideX = this.slidePositionX - this.distSlideX *.45;
                    TweenLite.set(this.$slideWrap, {
                        transform:'translate(' + this.moveSlideX + 'px, 0px)'
                    });
    
                    var movx = this.slidePositionX - this.moveSlideX;
                    var persent = movx/this.slideWidth;
                    $.each(this.$slides, function(ndx, item){
                        var cx = parseInt(this._getImgDistance(ndx));
                        var nx = cx + this.outterDist*persent;
                        TweenLite.set($(item).find('.image img'), {x:nx+"%", y:'-50%'})
                    }.bind(this));
    
                    if (Math.abs(this.distSlideX) > 30){
                        e.stopPropagation();
                        e.preventDefault();
                    }
                } else{
                    this.isTouchStart = true;
                }
            }
        },

        _touchEndHandler: function(e){
            if (!this.isTouchStart && this.isTouch){
                var slideidx;
                if (Math.abs(this.distSlideX) < 30){
                    var parent = $(e.target).parent().parent().parent();
                    var idx = parent.index();
                    if (!this.isTouchStart && idx == this.slideID){
                        var url = $(this.$slides[this.slideID]).find('a').attr('href');
                        location.href = url;
                    }

                    slideidx = this.slideID;
                } else{
                    if (this.distSlideX > 0){
                        slideidx = this.slideID + 1;
                        if (slideidx > 3) slideidx = 3;
                    } else{
                        slideidx = this.slideID - 1;
                        if (slideidx < 0) slideidx = 0;
                    }
                }
                
                this._changeSlideCont(slideidx, 'easeOutCubic');

                this.distSlideX = 0;
                this.isTouch = false;
            }

            this.isTouchStart = false;
        },

        _indcaterClickHandler: function(e){
           var btn = $(e.currentTarget);
           var adx = btn.data('idx');
           this._changeSlideCont(adx)
        },

        _selectIndicater: function(){
            $.each(this.$indicater.find('ul li'), function(i, item){
                if(i == this.slideID){
                    if (!$(item).hasClass('on')) $(item).addClass('on');
                } else{
                    if ($(item).hasClass('on')) $(item).removeClass('on');
                } 
            }.bind(this));
        },

        _changeSlideCont: function(sdx, easing){
            if (!vcui.detect.isMobile && this.isTrans) return;

            this._stopRolling();

            this.isTrans = true;

            this.slideID = sdx;

            var easingName = (easing == undefined || easing == null) ? 'easeInOutCubic' : easing;

            this.slidePositionX = this.margins - this.slideWidth*this.slideID;
            TweenLite.to(this.$slideWrap, this.slideSpd/1000, {x:this.slidePositionX, overwrite:1, ease:easingName, onComplete:function(){this.isTrans=false;this._startRolling();}.bind(this)});

            $.each(this.$slides, function(sdx, item){
                TweenLite.to($(item).find('.image img'), this.slideSpd/1000, {x:this._getImgDistance(sdx), y:'-50%', overwrite:1, ease:easingName});
                TweenLite.to($(item).find('.txt_wrap p, .overlay'), this.slideSpd/1000, {x:0, overwrite:1, ease:easingName});
                if (!vcui.detect.isMobile) this._hoverStateTrans(sdx, 1);
            }.bind(this));

            this._selectIndicater();
        }
    }); 

    return Careersbnr; 
});