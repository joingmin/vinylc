/*! 
 * module vcui.vinylc.Home
 * extends vcui.ui.View 
 * description Home content 
 * author VinylC UID Group 
 * create 2018-12-06
*/ 

define( 'vinylc/culture', ['jquery', 'jquery.transit', 'vcui', 'greensock'], function( $, transit, core, greensock ) { 
    'use strict';

    var Culture = core.ui( 'Culture', { 
        bindjQuery: 'culture',
        selectors: { 
            titleWrap: '.hd_txt',
            topVisualGroup:'.careers_top_info'
        }, 

        initialize: function initialize( el, options ) {
            if( this.supr(el, options) === false ) return;

            this.scrollPosition = $(window).scrollTop();
            this.scrollStatus = {scrolltop:this.scrollPosition}
            this.isScrolled = false;

            this.$topVisualGroup.find('.img_wrap img').on('load', this._setFirstTransition());

            this._bindEvent();

            this._stageResizeHandler();
        },

        _setFirstTransition: function(){
            var hei = this.$titleWrap.height();
            TweenLite.set(this.$titleWrap.find('.em span'), {alpha:0, display:'inline-block'});
            TweenLite.to(this.$titleWrap.find('.em span'), 1.5, {alpha:1, ease:Power1.easeInOut});

            var topimg = this.$topVisualGroup.find('.img_wrap');
            TweenLite.set(topimg, {y:300});
            TweenLite.to(topimg, 1.5, {delay:.8, alpha:1, y:0, ease:Power1.easeInOut});
        },

        _bindEvent: function(){
            
           $(window).on('scroll', this._scrollChangeHandler.bind(this));
           $(window).on('resize', this._stageResizeHandler.bind(this));
           
           window.addEventListener('mousewheel', this._scrollWheelHandler.bind(this), {passive:false});

           if(!vcui.detect.isMobile){
               var showalpha = $('.next_list a').find('.overlay').css('opacity');
               $('.next_list a').hover(function(){
                   TweenLite.to($(this).find('.bg img'), 2, {transformOrigin:"50% 50%", scale:1.1, ease:'easeOutQuart', overwrite:1});
                   TweenLite.to($(this).find('.overlay'), 2, {opacity:.4, ease:'easeOutQuart', overwrite:1})
               }, function(){
                   TweenLite.to($(this).find('.bg img'), 2, {transformOrigin:"50% 50%", scale:1, ease:'easeOutQuart', overwrite:1});
                   TweenLite.to($(this).find('.overlay'), 2, {opacity:showalpha, ease:'easeOutQuart', overwrite:1})
               });
           }

           //setInterval(this._setScrollMoved.bind(this), 1000/60);
        },

        _stageResizeHandler: function(e){
            if (!vcui.detect.isMobile){
                var img = this.$topVisualGroup.find('.img_wrap img');
                var scalex = $(window).width()/1920;
                var scaley = $(window).height()/1080;
                var scale = Math.max(scalex, scaley);
                var imgwidth = 1920*scale;
                var imgheight = 1080*scale;
                var imgleft = (imgwidth - $(window).width())/-2;
                img.css({
                    width: imgwidth,
                    height: imgheight,
                    transform: 'translateX(' + imgleft + 'px)'
                })
            }

            this._setScrollMoved();
        },

        _scrollStatusUpdate: function(){
            $(window).scrollTop(this.scrollStatus.scrolltop)
            this._setScrollMoved();
        },

        _scrollWheelHandler: function(e){
            this.isScrolled = true;

            var delta = e.wheelDelta;
            var maxscrolltop = $(document).height() - $(window).height();
            this.scrollPosition -= delta*.7;            
            if (this.scrollPosition < 0) this.scrollPosition = 0;
            else if (this.scrollPosition > maxscrolltop) this.scrollPosition = maxscrolltop;
            
            TweenLite.to(this.scrollStatus, 1.2, {
                                                                scrolltop:this.scrollPosition, ease:Power4.easeOut, overwrite:1, 
                                                                onUpdate:this._scrollStatusUpdate.bind(this), 
                                                                onComplete:this._scrollMoveComplete.bind(this)
                                                            });

            e.preventDefault();
            e.stopPropagation();
        },

        _scrollMoveComplete: function(){
            this.isScrolled = false;
        },

        _scrollChangeHandler: function(e){
            if (!this.isScrolled){
                this._setScrollMoved();
                this.scrollPosition = this.scrollStatus.scrolltop = $(window).scrollTop();
            }
        },

        _setScrollMoved: function(){
            var scrolltop = $(window).scrollTop();

            var newy, toptxt, txtheight, txty, 
            centery, disty, alphadist, persent, txtwrap, txt, 
            bottomy, txtmarginy, itemheight, contbottomy,
            childheight;

            var windowheight = $(window).height();

            var alpha = 1;
            var visualy = 0;
            var position = 'absolute';
            var topy = this.$topVisualGroup.position().top - scrolltop;
            if (topy < 0){
                position = 'fixed';

                newy = topy*-1;
                toptxt = this.$topVisualGroup.find('.txt_wrap');
                txtheight = toptxt.height();
                txty = toptxt.position().top;
                centery = newy + windowheight/2;

                disty = centery - txty
                if (disty > txtheight/2){
                    visualy = txty + txtheight/2 - windowheight/2;
                    position = 'absolute';
                }

                alphadist = txty - centery;
                persent = alphadist / (windowheight/2);
                if (persent > 1) persent = 1;
                else if(persent < 0) persent = 0;
                alpha = persent*.8 + .2;
            }
            
            TweenLite.set(this.$topVisualGroup.find('.img_wrap'), {position:position, top:visualy});
            TweenLite.set(this.$topVisualGroup.find('.img_wrap img'), {alpha:alpha});

            $.each($('.careers_sec_fixed'), function(i, item){
                topy = $(item).position().top;
                itemheight = $(item).height();
                txtmarginy = parseInt($(item).css('padding-top'));

                txtwrap = $(item).find('.txt_wrap');
                txtheight = txtwrap.height();

                txt = txtwrap.find('.txt');
                childheight = txt.height();

                newy = 0;
                position = 'absolute'
                bottomy = scrolltop + windowheight;
                if (topy < bottomy){
                    txty = topy + txtheight/2;
                    centery = bottomy - windowheight/2;
                    if (txty <= centery){
                        position = 'fixed';
                        newy = parseInt(windowheight/2 - txtheight/2);

                        contbottomy = topy + txtmarginy + itemheight;
                        if (contbottomy < centery + childheight/2 + 100){
                            position = 'absolute';
                            newy = txtmarginy + itemheight - txtheight/2 - childheight/2 - 100;
                        }
                    }
                }

                txtwrap.css({position:position, top:newy})
            });
        }
    });

    return Culture;
});
