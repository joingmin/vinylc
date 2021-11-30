/*! 
 * module vcui.ui.Header 
 * extends vcui.ui.View 
 * description Common Header 
 * author VinylC UID Group 
 * create 2018-10-10 
 * update 2019-12-18 
*/ 

var requireArr = ['jquery','jquery.transit','vcui','greensock','lottie', 'vinylc/selectbox', 'libs/froogaloop']; 
define( 'vinylc/header', requireArr, function( $, transit, core, greensock, bodymovin ) {
    'use strict';

    var Hambuger = core.BaseClass.extend({
        initialize: function( el, options ) {
            this.$el = $(el); 

            this.$wrap = this.$el.find('.bar_wrap');
            this.$topBar = this.$el.find('.top');
            this.$bottomBar = this.$el.find('.bottom');

            var page = $('body').attr('data-page'); 
            this.isToggleColorPage = /(goods|vinylcrews|hapche|playv)/.test(page); 

            this.isOpen = false;

            this.resize();
        },

        open: function() { 
            this.isOpen = true;
            this.hambugerTransition(true);
            
            if( this.isToggleColorPage ) { 
                this.$el.addClass('black'); 
            } 
        }, 

        close: function() {
            this.isOpen = false;
            this.hambugerTransition(true);

            if( this.isToggleColorPage ) { 
                vcui.util.delayedCall( function() {
                    this.$el.removeClass('black'); 
                }.bind(this), 500, this ); 
            } 
        }, 

        hambugerTransition: function(anim){
            if (this.isOpen){
                var wrapheight = this.$wrap.height();
                var barheight = this.$topBar.height();
                var centery = wrapheight/2-barheight/2;
    
                if (anim){
                    TweenLite.to(this.$topBar, .5, {top:centery, ease:Power4.easeInOut, overwrite:1});
                    TweenLite.to(this.$bottomBar, .5, {top:centery, ease:Power4.easeInOut, overwrite:1});
                    TweenLite.to(this.$topBar, .5, {delay:.2, transformOrigin:"50% 50%", rotation:45, scaleX:1.5, ease:Power4.easeInOut});
                    TweenLite.to(this.$bottomBar, .5, {delay:.2, transformOrigin:"50% 50%", rotation:-45, scaleX:1.5, ease:Power4.easeInOut});
                } else{
                    TweenLite.killTweensOf( this.$topBar ); 
                    TweenLite.killTweensOf( this.$bottomBar ); 

                    TweenLite.set(this.$topBar, {transformOrigin:"50% 50%", top:centery, rotation:45, scaleX:1.5});
                    TweenLite.set(this.$bottomBar, {transformOrigin:"50% 50%", rotation:-45, scaleX:1.5, top:centery});
                }
            } else{
                var bottomy = this.$wrap.height() - this.$bottomBar.height();

                if (anim){
                    TweenLite.to(this.$topBar, .5, {delay:.2, top:0, ease:Power4.easeInOut, overwrite:1});
                    TweenLite.to(this.$bottomBar, .5, {delay:.2, top:bottomy, ease:Power4.easeInOut, overwrite:1});
                    TweenLite.to(this.$topBar, .5, {transformOrigin:"50% 50%", rotation:0, scaleX:1, ease:Power4.easeInOut});
                    TweenLite.to(this.$bottomBar, .5, {transformOrigin:"50% 50%", rotation:0, scaleX:1, ease:Power4.easeInOut});
                } else{
                    TweenLite.killTweensOf( this.$topBar ); 
                    TweenLite.killTweensOf( this.$bottomBar ); 

                    TweenLite.set(this.$topBar, {transformOrigin:"50% 50%", rotation:0, scaleX:1, top:0});
                    TweenLite.set(this.$bottomBar, {transformOrigin:"50% 50%", rotation:0, scaleX:1, top:bottomy});
                }
            }
        },

        // public ------------------------------- 

        resize: function() { 
            var bottomy = this.$wrap.height() - this.$bottomBar.height();
            this.$bottomBar.css({top:bottomy});

            this.hambugerTransition(false);

            // this._resizeTop(); 
        }, 

        _resizeTop: function() { 
            var w=this.windowWidth, vw=(w*0.01)*5, rem; 
            if( w > 1280 ) rem = -0.92708; // Desktop 
            else if( 768 <= w && w <= 1280 ) rem = -0.92708; // Tablet 
            else rem = -3.2266; // Mobile 
            var y = Math.round( vw * rem ); 
            this.$el.css( {top:y} ); 
        } 
    }); 

    var Gnb = core.BaseClass.extend({
        initialize: function( el, options ) { 
            this.$root = $('html'); 
            this.$el = $(el); 
            this.$menu = this.$el.find('.menu'); 
            this.$channel = this.$el.find('.channel'); 
            this.$menus = this.$menu.find('ul:last-child>li'); 
            this.menuLength = this.$menus.length; 
            this.menuIndex = this._getPageByIndex() || 0; 
            this.windowWidth = $(window).width(); 
            this.windowHeight = $(window).height(); 
            this.isAnimation = false; 

            this.$el.hide();

            this._setLayout(); 
            this._bindEvent(); 
            // vcui.util.delayedCall( this._activateMenu, 400, this ); 
        }, 

        _getPageByIndex: function( name ) { 
            var a, page = name || $('body').attr('data-page'); 

            if (page.toLowerCase() == 'vinylcrews') return 8;

            for( var i=0,len=this.$menus.length; i<len; i++ ) { 
                a = this.$menus.eq(i).find('span.m_txt').text(); 
                if( a.toLowerCase() == page ) return i+1; 
            } 
            return 0; 
        }, 

        _setLayout: function() { 
            this._resizeMenu(); 
            this._resetMenu(); 
        }, 

         _resetMenu: function() { 
            this.$menus.removeClass('on'); 
        },  

        _resizeMenu: function() { 
            var w=this.windowWidth, vw=(w*0.01)*5, rem; 
            if( w > 1280 ) rem = 0.0625; // Desktop 
            else if( 768 <= w && w <= 1280 ) rem = 0.09375; // Tablet 
            else rem = 0.16; // Mobile 
            var barH = Math.round( vw * rem ); 

            for( var i=0,len=this.menuLength; i<len; i++ ) { 
                var $text = this.$menus.eq(i).find('a>span'); 
                $text.data('width', $text.width());
                var $bar = this.$menus.eq(i).find('span.bar'); 
                $bar.css( {height:barH} ); 
            } 
        }, 

        _bindEvent: function() { 
            this.$menu.find('ul>li').on( 'touchend', 'a', this._clickMenu.bind(this) ); 

            this.$menu.find('ul>li').on('click', 'a', function(){sessionStorage.clear();})
        }, 

        _clickMenu: function( evt ) {
    		location.href = $(evt.currentTarget).attr('href');
        }, 

        _activateMenu: function( index ) { 
            var index = index || this.menuIndex; 

            if( index == 0 ) return; 
            this.$menus.eq(index-1).addClass('on'); 
        }, 

        // public ------------------------------- 

        resize: function() { 
            this.windowWidth = $(window).width(); 
            this.windowHeight = $(window).height(); 

            this._resizeMenu(); 
            //this._resizeGnb(); 
        }, 

        _resizeGnb: function() { 
            var y = ( this.windowHeight < this.$el.height() ) ? -this.$el.height()*1.5 : -this.windowHeight; 
            TweenLite.set( this.$el, {css:{y:y}} ); 
        }, 

        open: function() { 
            TweenLite.killTweensOf( this.$el ); 
            TweenLite.to( this.$el, 0.7, {y:0, ease:Quart.easeOut, onComplete:this.transComplete.bind(this)} ); 
            vcui.util.delayedCall( this._activateMenu, 0, this );    // 400+200 

            this.$el.show();
        }, 

        close: function() { 
            var y = ( this.windowHeight < this.$el.height() ) ? -this.$el.height()*1.5 : -this.windowHeight; 
            TweenLite.killTweensOf( this.$el ); 
            TweenLite.to( this.$el, 0.7, {y:y, ease:Quart.easeInOut, onComplete:function(){
                this.$el.hide();
                this.transComplete();
            }.bind(this)}); 
            vcui.util.delayedCall( this._resetMenu, 700, this ); 
        },

        transComplete: function(){
            $(window).trigger('gnbTransCompleted');
        }
    }); 

    /*! 
        Header 
        - hambuger open/close 
        - gnb open/close 
        - logo fade in-out 
        - dimmed fade in-out 
    */
    var Header = core.ui('Header', { 
        bindjQuery: 'header', 
        selectors: { root:$('html'), logo:'.header_wrap>h1', lang:'.selectbox_wrap' }, 
        initialize: function initialize( el, options ) {
            if( this.supr(el, options) === false ) return; 

            this.index = 1;  
            this.$logo = this.$el.find('.header_wrap>h1'); 
            this.$dimmed = $('<div/>').addClass('ui-header-dim'); 
            this.$dimmed.css( {position:'fixed', left:0, top:0, width:'100%', height:'100%', minHeight:960, background:'#fff'} );
            this.$dimmed.css( {zIndex:parseInt(this.$el.find('.tabs').css('z-index'))+1} ); 
            this.$el.prepend( this.$dimmed ); 
            TweenLite.set( this.$dimmed, {css:{autoAlpha:0}} ); 
            this.$logoVinylc = this.$logo.find('#svg_logo_vinylc'); 
            this.$logoVc = this.$logo.find('#svg_logo_vc'); 
            this.isLogoVinylc = !!this.$logoVinylc.length; 
            this.isHapcheVisualTop = $('.hapche_vsl_top','#content');
            this.visualTop = $('#container').find('.head_info_txt').height(); 
            this.pageName = $('body').attr('data-page'); 
            
            this.isVinylMain = !!this.$el.hasClass('main');
            this.isGoods = !!this.$el.hasClass('goods'); 
            this.isCareers = !!this.$el.hasClass('careers'); 
            this.isVinylCrew = !!this.$el.hasClass('vinylcrews');
            this.isWorks = !!this.$el.hasClass('works');
            this.isNews = !!this.$el.hasClass('news');

            this.isTrans = false;

            var cidx;
            var lang = $('html').attr('lang');	

			//if(lang == 'ja') cidx = 1;
			if(lang == 'en') cidx = 1;
            else cidx = 0;            

            this.$lang.vcSelectbox({cidx:cidx, mode:'languageSelector', listype:'down'}); 

            $('.footer_wrap .choice_lang .selectbox_wrap').vcSelectbox({cidx:cidx, mode:'languageSelector', listype:'up'});

            var self = this;
            this.hambuger = new Hambuger('.ui-hambuger'); 
            this.gnb = new Gnb('.nav_wrap');
            this._bindEvent(); 

            this._resizeVideoFrame();

            if(this.isVinylMain && vcui.detect.isMobile){
                $('footer').remove();
                $('.img_container').css('margin-bottom', 0);
            } else{
                if (!this.isVinylMain && !this.isWorks && !this.isGoods && !this.isNews){
                    $('footer').css('display', 'block');
                }

                if(vcui.detect.isMobile){
                    $('.footer_black_bg, .footer_dark_bg, .footer_inner').css('position', 'absolute');
                    $('.footer_inner').css({'z-index': 2});
                }

                this._setFooterState();
            }
        }, 

        _bindEvent: function() { 
            this.on( 'click', '.ui-hambuger', this._clickNavBtn.bind(this) ); 

            var self = this;
            $(window).on('gnbTransCompleted', function(){
                self.isTrans = false;
            });

            $(window).on( 'resize.header', this._resizeHandler.bind(this) ); 
           
            $(window).on( 'scroll.header', this._scrollHandler.bind(this) ).trigger('scroll.header');

            $(window).on('changeLogo.header', this._changeLogoHandler.bind(this));


            $.each($('video'), function(vdx, video){
                try{
                    $(video)[0].pause();
                } catch(err){}   
            });

            $.each($('.vimeo_frame'), function(idx, item){
                var parent = $(item).parent();

                var player = $f($(item)[0]);
                player.api('pause');
                $(item).data('pause', true);
                $(item).data('playing', false);
                $(item).data('interaction', false);

                var ctrlHtml = '';
                ctrlHtml += '<div class="vimeo_ctrl">';
                ctrlHtml += '   <div class="ctrl_cover"></div>';
                ctrlHtml += '   <div class="ctrl_wrap"></div>';
                ctrlHtml += '   <div class="ctrl_hover"></div>';
                ctrlHtml += '</div>';
                parent.append(ctrlHtml);

                parent.find('.vimeo_ctrl .ctrl_hover').on('click', function(){
                    var paused = $(item).data('pause');
                    if (paused){
                        $(item).data('playing', true);
                        self._setVimeoPlay(item);
                    } else{
                        $(item).data('playing', false);
                        self._setVimeoPause(item);
                    }

                    $(item).data('interaction', true);
                })
                
                if (!vcui.detect.isMobile){
                    parent.find('.vimeo_ctrl .ctrl_hover').on('mouseover', function(){
                        if (!$(item).data('pause')) self._showVideoCtrl(item);
                    }).on('mouseout', function(){
                        if (!$(item).data('pause')) self._hideVideoCtrl(item)
                    });
                }
            });
        }, 

        _hideVideoCtrl: function(item){
            TweenLite.to($(item).parent().find(".ctrl_wrap"), .3, {alpha:0, ease:Power4.easeOut, overwrite:1});
            TweenLite.to($(item).parent().find('.ctrl_cover'), .5, {opacity:.0, ease:Power3.easeInOut, overwrite:1});
        },

        _showVideoCtrl: function(item){
            TweenLite.to($(item).parent().find(".ctrl_wrap"), .3, {alpha:1, ease:Power4.easeOut, overwrite:1});
            TweenLite.to($(item).parent().find('.ctrl_cover'), .5, {opacity:.15, ease:Power3.easeInOut, overwrite:1});
        },
        
        _clickNavBtn: function( evt ) {     
            if (this.isTrans) return;

            this.isTrans = true;
            if( !$('html').hasClass('gr_open') ) { 
                $('body').attr( {'data-scrollTop':$(window).scrollTop()} ); 
                this.open(); 

            } else { 
                this.close(); 
                $(window).scrollTop( $('body').attr('data-scrollTop') ); 
                $('body').removeAttr('data-scrollTop'); 
            }
            $('html').toggleClass('gr_open'); 
        }, 

        _resizeHandler: function() {
            this.gnb.resize(); 
            this.hambuger.resize();

            this._resizeVideoFrame();

            this._setFooterState();
        }, 

        _resizeVideoFrame: function(){

            $.each($('.vimeo_frame'), function(idx, item){
                var winwidth = $(window).width();
                var videoheight = winwidth * 9 / 16;
                $(item).height(videoheight);
                $(item).parent().find('.ctrl_cover').height(videoheight);

                if(vcui.detect.isMobile){
                    $(item).parent().find('.ctrl_hover').css({
                        width: winwidth,
                        height: videoheight,
                        margin:0,
                        left:0,
                        top:0
                    })
                }
            });
        },

        _changeLogoHandler: function(e, scrolltop){
            if( scrolltop > 0 ) { 
                if( !this.$el.hasClass('vinylc') ) { 
                    this.$el.addClass('vinylc'); 
                    this.$logoVinylc.hide(); 
                    this.$logoVc.show(); 
                } 

            } else { 
                if( this.$el.hasClass('vinylc') ) { 
                    this.$el.removeClass('vinylc'); 
                    this.$logoVinylc.show(); 
                    this.$logoVc.hide(); 
                } 
            } 
        },

        _scrollHandler: function(e) { 
            var scrollTop = $(window).scrollTop(); 

            if(!this.isVinylMain && !this.isVinylCrew && this.isLogoVinylc ) { 
                this._changeLogoHandler(e, scrollTop)
            } 

            if( this.isGoods || this.isCareers ) { 
                if( scrollTop > this.visualTop ) { 
                    if( this.$el.hasClass(this.pageName) ) { 
                        this.$el.removeClass(this.pageName); 
                    } 

                } else { 
                    if( !this.$el.hasClass(this.pageName) ) { 
                        this.$el.addClass(this.pageName); 
                    } 
                } 
            } 
            
            if (this.isHapcheVisualTop.length) {
            	
            	var cond = this.isHapcheVisualTop.outerHeight() - (this.$el.find("#svg_logo_vc").height()*2);
            	
            	if (scrollTop > cond) {
            		this.$el.removeClass(this.pageName)
            	} else {
            		this.$el.addClass(this.pageName)
            	}
            	
            }

            $.each($('video'), function(vdx, video){
                var noneAutoPlay = $(video).hasClass('none_autoplay');

                var winheight = $(window).height();
                var vtop = $(video)[0].getBoundingClientRect().top;
                var vheight = $(video).height();
                var mintop = vheight * -.8;
                var maxtop = winheight - vheight*.2;    
                var playPromise;

                if (vheight > 0){
                    var paused = $(video)[0].paused;
                    if (vtop > mintop && vtop < maxtop){                       
                        if (!noneAutoPlay && paused) {
                            playPromise = $(video)[0].play();    
     
                            if (playPromise !== undefined) {
                              playPromise.then(function() {
                              }).catch(function(error) {
                              });
                            }
                        }
                    } else{
                        if(!paused) {
                            playPromise = $(video)[0].pause();    
     
                            if (playPromise !== undefined) {
                              playPromise.then(function() {
                              }).catch(function(error) {
                              });
                            } 
                        }
                    }
                }
            });

            var self = this;
            $.each($('.vimeo_frame'), function(idx, item){
                var interaction = $(item).data('interaction');

                var enabled = true;
                if (interaction != undefined){
                    enabled = interaction;
                }

                if (enabled){    
                    var winheight = $(window).height();
                    var vtop = $(item)[0].getBoundingClientRect().top;
                    var vheight = $(item).height();
                    var mintop = vheight * -.8;
                    var maxtop = winheight - vheight*.2;            
    
                    if (vheight > 0){
                        var paused = $(item).data('pause');
                        var playing = $(item).data('playing');
                        if (vtop > mintop && vtop < maxtop){                  
                            if (paused && playing){
                               self._setVimeoPlay(item);
                            } 
                        } else{
                            if(!paused) {
                                self._setVimeoPause(item);
                            }
                        }
                    }
                }
            });

            this._setFooterState();
        },

        _setFooterState: function(){
            if (!vcui.detect.isMobile){
                var winheight = window.innerHeight;
                var scrollTop = $(window).scrollTop(); 
                var docheight = $(document).height();
                var fooheight = $('footer').height();
                var maxscroll = docheight - winheight;
                var restscroll = maxscroll - scrollTop;
                var pervalue = 0.06;
                var persent = restscroll / fooheight;

                var foozindex = -10;
    
                if (maxscroll > 0 && restscroll < fooheight){               
                    var fooy = fooheight * persent * pervalue;
                    var fooopacity = 1 - persent;
                    if(fooopacity > 1) fooopacity = 1;
                    foozindex = fooopacity == 1 ? 2 : -10;
                    $('.footer_wrap').css({
                        transform: 'translateY(' + fooy + 'px)',
                        opacity: fooopacity
                    });
                }

                $('.footer_inner').css({'z-index': foozindex});
    
                $('footer .footer_dark_bg').css({opacity:1-persent});
            }
        },

        _setVimeoPlay: function(item){
            var iframe = $(item);
            var player = $f(iframe[0]);
            console.log(player)
            player.api('play');

            iframe.data('pause', false);

            var bpy = vcui.detect.isMobile ? '12.76vw' : '-12.76vw'
            $(item).parent().find(".ctrl_wrap").css({'background-position': '0 ' + bpy});

            if(vcui.detect.isMobile) TweenLite.to($(item).parent().find('.ctrl_cover'), .5, {opacity:.0, ease:Power3.easeInOut, overwrite:1});
        },

        _setVimeoPause: function(item){
            var iframe = $(item);
            var player = $f(iframe[0]);
            player.api('pause');
            
            $(item).data('pause', true);
            $(item).parent().find(".ctrl_wrap").css({'background-position': '0 0'});

            if(vcui.detect.isMobile) TweenLite.to($(item).parent().find('.ctrl_cover'), .5, {opacity:.15, ease:Power3.easeInOut, overwrite:1});
        },
        
        _playVideoInBrowser: function(type) {
        	
        	type = type || 'scroll';
        	
        	var $win = $(window),
        		$video = $('video');
        	var sTop = $win.scrollTop();
        	
        	$.each($video, function(i, item) {
        		var $i = $(item);
        		var top = $i[0].getBoundingClientRect().top,
        			bottom = $i[0].getBoundingClientRect().bottom,
        			height = -$i[0].getBoundingClientRect().height;
        		var isInBrowser = top > height && bottom > 0;
                
        		if (top > height && bottom > 0) {
        			if (type === 'play') {
        				$i.removeClass('video_pause').addClass('video_play')[0].play();
        				
        			} else if (type === 'pause') {
        				$i.removeClass('video_play').addClass('video_pause')[0].pause();
        			}
        		}
        		
        	});
        },
        
        // public ------------------------------- 

        open: function() { 
            this.hambuger.open(); 
            this.gnb.open(); 
            TweenLite.killTweensOf( this.$logo.parent() ); 
            TweenLite.to( this.$logo.parent(), 0.1, {alpha:0, ease:Quart.easeOut} ); 
            TweenLite.set( this.$dimmed, {css:{autoAlpha:0}} ); 
            TweenMax.to( this.$dimmed , 0.3, {autoAlpha:1, ease:Quart.easeOut} ); 
            
            if (this.isVinylMain){
                $(window).trigger( 'autoPlay.home', [false] ); 
            } else{
                this._playVideoInBrowser('pause');
                setTimeout(function(){$('#content').hide();},310);
            }

            $(window).trigger('changeGnbState', ['open'])
        }, 

        close: function() { 
            this.hambuger.close(); 
            this.gnb.close(); 
            TweenLite.killTweensOf( this.$logo.parent() ); 
            TweenLite.to( this.$logo.parent(), 0.5, {alpha:1, ease:Quart.easeIn} ); 
            TweenLite.killTweensOf( this.$dimmed ); 
            TweenMax.to( this.$dimmed, 0.5, {autoAlpha:0, ease:Quart.easeIn} ); 
            
            if (this.isVinylMain){
                $(window).trigger( 'autoPlay.home', [true] ); 
            } else{
                $('#content').show();
                this._playVideoInBrowser('play');  
            }         
            
            $(window).trigger('changeGnbState', ['close'])
        }
    }); 

    return Header; 
});