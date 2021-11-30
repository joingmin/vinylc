/*!
 * module vcui.vinylc.Hapche
 * extends vcui.ui.View
 * description About content
 * author VinylC UID Group
 * create 2019-01-07
*/

define('vinylc/hapche', ['jquery', 'jquery.transit', 'vcui'], function($, transit, core) {
    'use strict';

    var About = core.ui( 'Hapche', {
        bindjQuery: 'hapche',
        defaults: {},
        selectors: {
			alphabet: '.alphabet img',
			movTargets: '[data-rate]'
        },
        initialize: function initialize( el, options ) {
            if (this.supr(el, options) === false) return;
            this.DEFAULT_SUFFIX = 'transparency';
            this.ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
            this.MOBILE_SUFFIX = '_m768';
            this.scrollPosition = $(window).scrollTop();
            this.scrollStatus = {scrolltop:this.scrollPosition}
            this.isScrolled = false;
            this.mobileRate = -0.3;
            
            this._setLayout();
			this._bindEvent();
        },
        
        _setLayout: function() {
        	this._setOffset();
            this._setRandomImg();

            this._scrollParallax();
            
            var overlay = "<div class='vOverlay' style='position:absolute;left:0;top:0;width:100%;height:100%;background:rgba(0, 0, 0, 0);'></div>";
            $('.video_frame').append(overlay);

            $('.video_frame .vOverlay').css('cursor', 'pointer').on('click', function(){
                var iframe = $('.video_frame iframe')[0];
                var player = $f(iframe);   
                var paused = $('.video_frame iframe').data('pause');
                if (paused){                  
                    player.api('play', function(){
                        $('.video_frame iframe').data('pause', false);
                    });
                } else{
                    player.api('pause', function(){
                        $('.video_frame iframe').data('pause', true);
                    });
                }

                $('.video_frame iframe').data('interaction', true);
            });
        },
        
        _setOffset: function() {
    		$.each(this.$movTargets, function (i, item) {
    			var $i = $(item); 
                $i.attr('data-top',$i.offset().top);                
    		}.bind(this));
        },
        
        _setRandomImg: function() {
    		$.each(this.$alphabet, function (i, item) {
    			var $i = $(item);
    			var regex = /([^\/]+)(?=\.\w+$)/;
    			var src = $i.attr('src'), prvNm = src.match(regex)[0], 
    				newNm = prvNm.substring(0, prvNm.indexOf(this.DEFAULT_SUFFIX)) + (core.detect.isMobile ? this._getRandomAlphabet()+this.MOBILE_SUFFIX : this._getRandomAlphabet());
    			$i.attr('src', src.replace(regex,newNm) );
    		}.bind(this));
        },
        
        _getRandomAlphabet: function() {
        	return this.ALPHABET.charAt(Math.floor(Math.random()*(this.ALPHABET.length-1)));
        },

        _bindEvent: function() {
            $(window).on('scroll.hapche', this._scrollHandler.bind(this));

            window.addEventListener('mousewheel', this._mouseWheelHandler.bind(this), {passive:false});
        },

        _scrollHandler: function() {
        	if (!this.isScrolled){
                this._scrollParallax();
                this.scrollPosition = this.scrollStatus.scrolltop = $(window).scrollTop();
            }
            
            /*
            var iframe = $('.video_frame iframe')[0];
            var player = $f(iframe);

            var winheight = $(window).height();
            var vtop = $('.video_frame iframe')[0].getBoundingClientRect().top;
            var vheight = $('.video_frame iframe').height();
            var mintop = vheight * -.8;
            var maxtop = winheight - vheight*.2;      

            if (vheight > 0){
                var paused = $('.video_frame iframe').data('pause');
                if (vtop > mintop && vtop < maxtop){                  
                    if (paused){
                        player.api('play', function(){
                            $('.video_frame iframe').data('pause', false);
                        });
                    } 
                } else{
                    if(!paused) {
                        player.api('pause', function(){
                            $('.video_frame iframe').data('pause', true);
                        });
                    }
                }
            }
            */
        },
        
        _getCssPrefix: function() {
        	
        	var computed = window.getComputedStyle(document.documentElement,'');
        	var pre = (Array.prototype.slice.call(computed).join('').match(/-(moz|webkit|ms)-/)||'' === computed.OLink && ['','o'])[1];
			return '-'+pre+'-';
        },
        
        _scrollParallax: function(){            

            var winheight = $(window).height();
            var docheight = $(document).height();
            var maxscroll = docheight - winheight;
            var scrolltop = $(window).scrollTop();
            var scrollpersent = scrolltop/maxscroll;
            var maxdistance = maxscroll*.4;
    		
    		$.each(this.$movTargets, function setScrollMotion(i, item) {
               var rate = parseFloat($(item).data('rate'));
               var dist = maxdistance*rate*scrollpersent*-1;
               var sStyle = 'translate(x,y)'.replace(/x/,$(item).hasClass('center') ? '-50%' : '0')
                                                 .replace(/y/, dist +'px');
                $(item).css(this._getCssPrefix()+'transform',sStyle);
            }.bind(this));
        },
         
        _mouseWheelHandler: function(e){
        	
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
        
        _scrollStatusUpdate: function(){
            $(window).scrollTop(this.scrollStatus.scrolltop)
            this._scrollParallax();
        },
        
        _scrollMoveComplete: function(){
            this.isScrolled = false;
        }
    });

    return About;
});
