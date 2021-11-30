/*!
 * VinylC Common 
 * description VinylC Common 
 * author VinylC UID Group 
 * create 2018-10-10 
 * update 2018-12-18 
*/ 

// Configuration require 
vcui.require.config( {baseUrl: '/js', waitSeconds: 0, paths: { 
    'jquery.easing': 'libs/jquery.easing-1.4.1.min', 
    'jquery.transit': 'libs/jquery.transit-0.9.12.min', 
    'greensock': 'libs/TweenMax-2.0.2.min', 
    'lottie': 'libs/lottie-5.1.16.min'},
    urlArgs: 'ver=' + (new Date).getTime() // FIXME 임시로 추가한 옵션입니다. 곧 제거할 예정! 
});

// Allows the caller to delay jQuery's ready event
$.holdReady(true); 

// Define global configuration & variable 
window.vcuiConfigs = $.extend( {lang:'ko'}, window.vcuiConfigs );
window.vinylc = { 
    title: 'VinylC',
    isDev: /localhost/.test(window.location.hostname),
    naverMapApiKey: window.vcuiConfigs.mapKey,
    breakpoints: { mobile:768, pc:10000000 },

    makeFixedInfo: function() {
        $('body').append(this.$infobox = $('<div style="position:fixed;bottom:0;right:0;padding:4px;text-align:right;background:#000;color:#fff;font-size:12px;border-top-left-radius: 6px;opacity:0.8;"></div>'));

        var self = this;
        $(window).on('resize.sizeinfo orientationchange.sizeinfo breakpointchange.sizeinfo', function() {
            self.$infobox.text(window.innerWidth + " (" + (window.breakpoint.isMobile ? "Mobile" : "PC") + ")");
        });
        this.$infobox.text(window.innerWidth + ' (' + (window.breakpoint.isMobile ? 'Mobile' : 'PC') + ')');
    },

    // Execute page lending 
    init: function() {
        this._.initBrakpointAndPortrait();

        // Exception ready holding, bind native event 
        if( /^(complete|loaded|interactive)$/.test(document.readyState) ) {
            this.ready();
        } else {
            $(document).on('DOMContentLoaded', function() {
                this.ready();
            }.bind(this));
        }
    },

    ready: function() {
        this._.preload( function() {
            this._.init();
        }.bind(this));
    },

    _: {
        init: function() {
            this.buildCommonUI();
            this.bindGlobalEvents();
            this.snsShare();
            this.buildLazyLoad();
        },

        initBrakpointAndPortrait: function() {
            var $html = $('html');
            var isPortrait;
            var resizeHandler;
            var isMobile = window.innerWidth < window.vinylc.breakpoints.mobile;

            window.breakpoint = { isMobile:isMobile, isPc:!isMobile, name:isMobile?'mobile':'pc' }; 
            $(window).data( 'breakpoint', window.breakpoint ); 
            $(window).on( 'resize.orientation orientationchange.orientation', resizeHandler = function() {
                // Process only when, actual horizontal x vertical is changed for performance
                if( window.innerWidth < window.innerHeight ) { 
                    if( !isPortrait ) { 
                        $html.addClass('portrait');
                        isPortrait = true;
                    }

                } else {
                    if( isPortrait ) { 
                        $html.removeClass('portrait');
                        isPortrait = false;
                    }
                }
            });
            resizeHandler();
        },

        buildCommonUI: function() {
            vcui.require( ['jquery.transit', 'ui/accordion', 'ui/dropdown', 'ui/tab', 'vinylc/header', 'vinylc/imageswap'], function() { 
                $('.ui_accordion').vcAccordion(); 
                $('.ui_tab').vcTab(); 
                $('.ui_dropdown').vcDropdown(); 
                $('header').vcHeader(); 
                $('#wrap').vcImageswap();
            });
        }, 

        bindGlobalEvents: function() {
            vcui.PubSub.on( 'common:preventScroll', function( e, flag ) {
                vinylc._.preventPageScroll(flag);
            });
        },

        preload: function( callback ) { 
            var requireArr = [
                'helper/breakpointDispatcher',
                'ui/responsiveImage',
                'ui/locale.common', // vcui.i18n.locale()
                'ui/modal',
                'ui/accordion',
                'ui/tab',
                'ui/carousel',
                'ui/inviewScroll',
                'ui/tooltip'
            ]; 

            vcui.require( requireArr, function( BreakpointDispatcher, ResponsiveImage, localeMessages) {
                /* new BreakpointDispatcher({
                    matches: {
                        '(max-width: 767px)': function( mq ) {
                            var data;
                            if( mq.matches ) { 
                                data = { name:'mobile', min:0, max:767, isMobile:true, isPc:false, prev:window.breakpoint||{} };
                            } else {
                                data = { name:'pc', min:768, max:999999, isMobile:false, isPc:true, prev:window.breakpoint||{} };
                            }

                            window.breakpoint = data;
                            $(window).data('breakpoint', data).trigger('breakpointchange', data);
                        }
                    }
                }).start(); */ 

                if( vinylc.isDev ) vinylc.makeFixedInfo(); 
                vcui.i18n.set( localeMessages ); 
                vinylc._.setComponentsDefaults(); 
                $('body').vcTooltip(); 
                $.holdReady( false );
                callback();
            });
        },

        setComponentsDefaults: function() { 
            vcui.ui.setDefaults( 'Accordion', {duration:500, easing:'easeInOutQuart', useAnimate:true} );

            $(document).on( 'accordionexpand accordioncollapse', vcui.delayRun( function( e ) {
                $(window).triggerHandler('resize');
                vcui.PubSub.trigger('common:updateLazyLoad');
            }, 200) );

            vcui.ui.setDefaults( 'Modal', {
                effect: vcui.detect.isMobileDevice ? 'none' : 'fade',
                useTransformAlign: false, // position modal, transform → margin 
                dimStyle: { opacity:0.9, backgroundColor:'#000' },
                events: {'modalshown': function( e ) {
                        $(e.target).buildCommonUI(); 
                    }
                }
            });

            $(document).on( 'modalfirstopen modallastclose', function( e ) {
                vinylc._.preventPageScroll( e.type === 'modalfirstopen' );
            });
        },

        snsShare: function() {
            var html = '<div class="layer_wrap snsShare_wrap">' +
                ' <div class="layer_cont">' +
                '  <p class="title" tabindex="-1" data-autofocus="true">Share</p>' +
                '  <div class="snsList_wrap">' +
                '   <ul class="list_wrap">' +
                '    <li class="item">' +
                '     <a href="#" class="facebook" target="_blank" title="새창열림 페이스북으로 공유 합니다. "><span class="hide">Facebook로 공유하기</span></a>' +
                '    </li>' +
                '    <li class="item">' +
                '     <a href="#" class="twitter" target="_blank" title="새창열림 트위터로 공유 합니다. "><span class="hide">Twitter로 공유하기</span></a>' +
                '    </li>' +
                '    <li class="item">' +
                '     <a href="#" class="google_plus googleplus" target="_blank" title="새창열림 구글플러스로 공유 합니다. "><span class="hide">Google+로 공유하기</span></a>' +
                '    </li>' +
                '    <li class="item">' +
                '     <a href="#" class="pinterest" target="_blank" title="새창열림 핀터레스트로 공유 합니다. "><span class="hide">Pinterest로 공유하기</span></a>' +
                '    </li>' +
                '    <li class="item">' +
                '     <a href="#" class="copy_url" role="button" title="현 페이지 주소를 복사합니다."><span class="hide">URL 복사</span></a>' +
                '    </li>' +
                '   </ul>' +
                '  </div>' +
                '  <div class="copyUrl_msg">' +
                '   <p>URL이 복사되었습니다.<br>원하는 위치에 (Ctrl+V) URL을 붙여 넣으세요.</p>' +
                '  </div>' +
                ' </div>' +
                ' <p class="btn_close">' +
                '  <button type="button" class="ui_modal_close" title="공유하기 레이어가 닫힙니다"><span class="hide">Shere창 닫기</span></button>' +
                ' </p>' +
                '</div>';

            // 공유하기 버튼을 클릭하면 공유모달을 띄운다.
            $('.btn_share').on('click', function( e ) {
                e.preventDefault();
                
                $(html).appendTo('body').vcModal( {removeOnClose:true, opener:this} );
            });

            var templateurl = $('.snsShare_wrap').attr('data-template');
            $('body').append('<div class="copy_alert"></div>');
            $('.copy_alert').load(templateurl);

            vcui.require( ['helper/sharer'], function(Sharer) {
                // 공유하기 헬퍼 빌드
                Sharer.init({
                    selector: '.snsShare_wrap a',
                    attr: 'class', // sns서비스명을 가져올 속성
                    metas: {
                        image: { // 공식 메타태그가 아닌 메타태그에 있는 이미지를 공유하고자 할 경우 이 옵션 설정
                            pinterest: 'pinterest:image'
                        }
                    },
                    // 공유하기 직전에
                    onBeforeShare: function($btn, data) {
                        if ($btn.hasClass('copy_url')) {
                            // url 복사하기 인 경우
                            vcui.dom.copyToClipboard(location.href, {
                                container: $('.snsShare_wrap')[0],
                                onSuccess: function() {
                                    //alert('URL이 복사되었습니다.\n원하는 위치에 (Ctrl+V) URL을 붙여 넣으세요.!');
                                    /*
                                    $('.snsShare_wrap').addClass('url_copy');
                                    $('.snsShare_wrap .copyUrl_msg').attr('role', 'alert').attr('tabindex', 0).focus();
                                    */
                                   $('#layer_copy').vcModal();
                                },
                                onError: function() {
                                    alert('알 수 없는 이유로 복사가 취소되었습니다.\n주소창에서 복사해주세요.');
                                }
                            });
                            // false를 반환하면 공유를 위한 팝업을 안띄운다.
                            return false;
                        }
                    },
                    // 공유를 했을 때 서버 로그 페이지에 관련데이타를 보내준다.
                    onShrered: function($btn, data) {
                        var typeCode = {
                            'facebook': '00001',
                            'twitter': '00002',
                            'googleplus': '00003',
                            'pinterest': '00004'
                        };
                        //mtdt_sn=1234&sns_type_cd=0001
                        $.ajax({
                            url: '/kr/log/saveShareLog',
                            data: {
                                mtdt_sn: $('.btn_share').data('pagecode') || '',
                                sns_type_cd: typeCode[data.service] || ''
                            }
                        });
                    }
                });
            });
        },

        // When modal opens, Block page scrolling 
        preventPageScroll: function( flag ) {
            var $root = $('html');
            if( flag ) {
                $root.css( {top: -$(window).scrollTop()} );

            } else {
                $root.css( {'top':''} );
                var top = parseInt($root.css('top'), 10) || 0;
                $('html, body').scrollTop(-top);
            }

            // Gnb & modal, don't let the focus be on the body, toggle aria-hidden 
            vinylc.preventedScroll = false;
            $root.toggleClass('preventScroll', flag);
            $(document).triggerHandler('preventscroll', flag);
        },

        buildLazyLoad: function() {
            vcui.require( ['ui/lazyLoader'], function( LazyLoader ) {
                var lazyLoader = new LazyLoader('body'); 
                vcui.PubSub.on('common:updateLazyLoad', function() {
                    lazyLoader.update();
                });
            });
        }
    }
};

// Execute DOMContentLoaded 
document.addEventListener( 'DOMContentLoaded', function() { 
    vcui.require( ['vcui.common-ui'], function() { 
        vinylc.init();
    }); 
});

/*
 * jQuery Easing v1.4.1 - http://gsgd.co.uk/sandbox/jquery/easing/
 * Open source under the BSD License.
 * Copyright © 2008 George McGinley Smith
 * All rights reserved.
 * https://raw.github.com/gdsmith/jquery-easing/master/LICENSE
*/
jQuery.easing.jswing=jQuery.easing.swing,jQuery.extend(jQuery.easing,{def:"easeOutQuad",swing:function(n,e,t,u,a){return jQuery.easing[jQuery.easing.def](n,e,t,u,a);},easeInQuad:function(n,e,t,u,a){return u*(e/=a)*e+t;},easeOutQuad:function(n,e,t,u,a){return-u*(e/=a)*(e-2)+t;},easeInOutQuad:function(n,e,t,u,a){return(e/=a/2)<1?u/2*e*e+t:-u/2*(--e*(e-2)-1)+t;},easeInCubic:function(n,e,t,u,a){return u*(e/=a)*e*e+t;},easeOutCubic:function(n,e,t,u,a){return u*((e=e/a-1)*e*e+1)+t;},easeInOutCubic:function(n,e,t,u,a){return(e/=a/2)<1?u/2*e*e*e+t:u/2*((e-=2)*e*e+2)+t;},easeInQuart:function(n,e,t,u,a){return u*(e/=a)*e*e*e+t;},easeOutQuart:function(n,e,t,u,a){return-u*((e=e/a-1)*e*e*e-1)+t;},easeInOutQuart:function(n,e,t,u,a){return(e/=a/2)<1?u/2*e*e*e*e+t:-u/2*((e-=2)*e*e*e-2)+t;},easeInQuint:function(n,e,t,u,a){return u*(e/=a)*e*e*e*e+t;},easeOutQuint:function(n,e,t,u,a){return u*((e=e/a-1)*e*e*e*e+1)+t;},easeInOutQuint:function(n,e,t,u,a){return(e/=a/2)<1?u/2*e*e*e*e*e+t:u/2*((e-=2)*e*e*e*e+2)+t;},easeInSine:function(n,e,t,u,a){return-u*Math.cos(e/a*(Math.PI/2))+u+t;},easeOutSine:function(n,e,t,u,a){return u*Math.sin(e/a*(Math.PI/2))+t;},easeInOutSine:function(n,e,t,u,a){return-u/2*(Math.cos(Math.PI*e/a)-1)+t;},easeInExpo:function(n,e,t,u,a){return 0==e?t:u*Math.pow(2,10*(e/a-1))+t;},easeOutExpo:function(n,e,t,u,a){return e==a?t+u:u*(-Math.pow(2,-10*e/a)+1)+t;},easeInOutExpo:function(n,e,t,u,a){return 0==e?t:e==a?t+u:(e/=a/2)<1?u/2*Math.pow(2,10*(e-1))+t:u/2*(-Math.pow(2,-10*--e)+2)+t;},easeInCirc:function(n,e,t,u,a){return-u*(Math.sqrt(1-(e/=a)*e)-1)+t;},easeOutCirc:function(n,e,t,u,a){return u*Math.sqrt(1-(e=e/a-1)*e)+t;},easeInOutCirc:function(n,e,t,u,a){return(e/=a/2)<1?-u/2*(Math.sqrt(1-e*e)-1)+t:u/2*(Math.sqrt(1-(e-=2)*e)+1)+t;},easeInElastic:function(n,e,t,u,a){var r=1.70158,i=0,s=u;if(0==e)return t;if(1==(e/=a))return t+u;if(i||(i=.3*a),s<Math.abs(u)){s=u;var r=i/4;}else var r=i/(2*Math.PI)*Math.asin(u/s);return-(s*Math.pow(2,10*(e-=1))*Math.sin((e*a-r)*(2*Math.PI)/i))+t;},easeOutElastic:function(n,e,t,u,a){var r=1.70158,i=0,s=u;if(0==e)return t;if(1==(e/=a))return t+u;if(i||(i=.3*a),s<Math.abs(u)){s=u;var r=i/4;}else var r=i/(2*Math.PI)*Math.asin(u/s);return s*Math.pow(2,-10*e)*Math.sin((e*a-r)*(2*Math.PI)/i)+u+t;},easeInOutElastic:function(n,e,t,u,a){var r=1.70158,i=0,s=u;if(0==e)return t;if(2==(e/=a/2))return t+u;if(i||(i=a*(.3*1.5)),s<Math.abs(u)){s=u;var r=i/4;}else var r=i/(2*Math.PI)*Math.asin(u/s);return 1>e?-.5*(s*Math.pow(2,10*(e-=1))*Math.sin((e*a-r)*(2*Math.PI)/i))+t:s*Math.pow(2,-10*(e-=1))*Math.sin((e*a-r)*(2*Math.PI)/i)*.5+u+t;},easeInBack:function(n,e,t,u,a,r){return void 0==r&&(r=1.70158),u*(e/=a)*e*((r+1)*e-r)+t;},easeOutBack:function(n,e,t,u,a,r){return void 0==r&&(r=1.70158),u*((e=e/a-1)*e*((r+1)*e+r)+1)+t;},easeInOutBack:function(n,e,t,u,a,r){return void 0==r&&(r=1.70158),(e/=a/2)<1?u/2*(e*e*(((r*=1.525)+1)*e-r))+t:u/2*((e-=2)*e*(((r*=1.525)+1)*e+r)+2)+t;},easeInBounce:function(n,e,t,u,a){return u-jQuery.easing.easeOutBounce(n,a-e,0,u,a)+t;},easeOutBounce:function(n,e,t,u,a){return(e/=a)<1/2.75?u*(7.5625*e*e)+t:2/2.75>e?u*(7.5625*(e-=1.5/2.75)*e+.75)+t:2.5/2.75>e?u*(7.5625*(e-=2.25/2.75)*e+.9375)+t:u*(7.5625*(e-=2.625/2.75)*e+.984375)+t;},easeInOutBounce:function(n,e,t,u,a){return a/2>e?.5*jQuery.easing.easeInBounce(n,2*e,0,u,a)+t:.5*jQuery.easing.easeOutBounce(n,2*e-a,0,u,a)+.5*u+t;}});

/*
 Color animation 1.6.0
 http://www.bitstorm.org/jquery/color-animation/
 Copyright 2011, 2013 Edwin Martin
 Released under the MIT and GPL licenses.
*/
'use strict';(function(d){function h(a,b,e){var c="rgb"+(d.support.rgba?"a":"")+"("+parseInt(a[0]+e*(b[0]-a[0]),10)+","+parseInt(a[1]+e*(b[1]-a[1]),10)+","+parseInt(a[2]+e*(b[2]-a[2]),10);d.support.rgba&&(c+=","+(a&&b?parseFloat(a[3]+e*(b[3]-a[3])):1));return c+")"}function f(a){var b;return(b=/#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/.exec(a))?[parseInt(b[1],16),parseInt(b[2],16),parseInt(b[3],16),1]:(b=/#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/.exec(a))?[17*parseInt(b[1],16),17*parseInt(b[2],
16),17*parseInt(b[3],16),1]:(b=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(a))?[parseInt(b[1]),parseInt(b[2]),parseInt(b[3]),1]:(b=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9\.]*)\s*\)/.exec(a))?[parseInt(b[1],10),parseInt(b[2],10),parseInt(b[3],10),parseFloat(b[4])]:l[a]}d.extend(!0,d,{support:{rgba:function(){var a=d("script:first"),b=a.css("color"),e=!1;if(/^rgba/.test(b))e=!0;else try{e=b!=a.css("color","rgba(0, 0, 0, 0.5)").css("color"),
a.css("color",b)}catch(c){}return e}()}});var k="color backgroundColor borderBottomColor borderLeftColor borderRightColor borderTopColor outlineColor".split(" ");d.each(k,function(a,b){d.Tween.propHooks[b]={get:function(a){return d(a.elem).css(b)},set:function(a){var c=a.elem.style,g=f(d(a.elem).css(b)),m=f(a.end);a.run=function(a){c[b]=h(g,m,a)}}}});d.Tween.propHooks.borderColor={set:function(a){var b=a.elem.style,e=[],c=k.slice(2,6);d.each(c,function(b,c){e[c]=f(d(a.elem).css(c))});var g=f(a.end);
a.run=function(a){d.each(c,function(d,c){b[c]=h(e[c],g,a)})}}};var l={aqua:[0,255,255,1],azure:[240,255,255,1],beige:[245,245,220,1],black:[0,0,0,1],blue:[0,0,255,1],brown:[165,42,42,1],cyan:[0,255,255,1],darkblue:[0,0,139,1],darkcyan:[0,139,139,1],darkgrey:[169,169,169,1],darkgreen:[0,100,0,1],darkkhaki:[189,183,107,1],darkmagenta:[139,0,139,1],darkolivegreen:[85,107,47,1],darkorange:[255,140,0,1],darkorchid:[153,50,204,1],darkred:[139,0,0,1],darksalmon:[233,150,122,1],darkviolet:[148,0,211,1],fuchsia:[255,
0,255,1],gold:[255,215,0,1],green:[0,128,0,1],indigo:[75,0,130,1],khaki:[240,230,140,1],lightblue:[173,216,230,1],lightcyan:[224,255,255,1],lightgreen:[144,238,144,1],lightgrey:[211,211,211,1],lightpink:[255,182,193,1],lightyellow:[255,255,224,1],lime:[0,255,0,1],magenta:[255,0,255,1],maroon:[128,0,0,1],navy:[0,0,128,1],olive:[128,128,0,1],orange:[255,165,0,1],pink:[255,192,203,1],purple:[128,0,128,1],violet:[128,0,128,1],red:[255,0,0,1],silver:[192,192,192,1],white:[255,255,255,1],yellow:[255,255,
0,1],transparent:[255,255,255,0]}})(jQuery);

/*
 * jQuery Templates Plugin 1.0.0pre
 * http://github.com/jquery/jquery-tmpl
 * Requires jQuery 1.4.2
 *
 * Copyright 2011, Software Freedom Conservancy, Inc.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */
(function(a){var r=a.fn.domManip,d="_tmplitem",q=/^[^<]*(<[\w\W]+>)[^>]*$|\{\{\! /,b={},f={},e,p={key:0,data:{}},i=0,c=0,l=[];function g(g,d,h,e){var c={data:e||(e===0||e===false)?e:d?d.data:{},_wrap:d?d._wrap:null,tmpl:null,parent:d||null,nodes:[],calls:u,nest:w,wrap:x,html:v,update:t};g&&a.extend(c,g,{nodes:[],parent:d});if(h){c.tmpl=h;c._ctnt=c._ctnt||c.tmpl(a,c);c.key=++i;(l.length?f:b)[i]=c}return c}a.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(f,d){a.fn[f]=function(n){var g=[],i=a(n),k,h,m,l,j=this.length===1&&this[0].parentNode;e=b||{};if(j&&j.nodeType===11&&j.childNodes.length===1&&i.length===1){i[d](this[0]);g=this}else{for(h=0,m=i.length;h<m;h++){c=h;k=(h>0?this.clone(true):this).get();a(i[h])[d](k);g=g.concat(k)}c=0;g=this.pushStack(g,f,i.selector)}l=e;e=null;a.tmpl.complete(l);return g}});a.fn.extend({tmpl:function(d,c,b){return a.tmpl(this[0],d,c,b)},tmplItem:function(){return a.tmplItem(this[0])},template:function(b){return a.template(b,this[0])},domManip:function(d,m,k){if(d[0]&&a.isArray(d[0])){var g=a.makeArray(arguments),h=d[0],j=h.length,i=0,f;while(i<j&&!(f=a.data(h[i++],"tmplItem")));if(f&&c)g[2]=function(b){a.tmpl.afterManip(this,b,k)};r.apply(this,g)}else r.apply(this,arguments);c=0;!e&&a.tmpl.complete(b);return this}});a.extend({tmpl:function(d,h,e,c){var i,k=!c;if(k){c=p;d=a.template[d]||a.template(null,d);f={}}else if(!d){d=c.tmpl;b[c.key]=c;c.nodes=[];c.wrapped&&n(c,c.wrapped);return a(j(c,null,c.tmpl(a,c)))}if(!d)return[];if(typeof h==="function")h=h.call(c||{});e&&e.wrapped&&n(e,e.wrapped);i=a.isArray(h)?a.map(h,function(a){return a?g(e,c,d,a):null}):[g(e,c,d,h)];return k?a(j(c,null,i)):i},tmplItem:function(b){var c;if(b instanceof a)b=b[0];while(b&&b.nodeType===1&&!(c=a.data(b,"tmplItem"))&&(b=b.parentNode));return c||p},template:function(c,b){if(b){if(typeof b==="string")b=o(b);else if(b instanceof a)b=b[0]||{};if(b.nodeType)b=a.data(b,"tmpl")||a.data(b,"tmpl",o(b.innerHTML));return typeof c==="string"?(a.template[c]=b):b}return c?typeof c!=="string"?a.template(null,c):a.template[c]||a.template(null,q.test(c)?c:a(c)):null},encode:function(a){return(""+a).split("<").join("&lt;").split(">").join("&gt;").split('"').join("&#34;").split("'").join("&#39;")}});a.extend(a.tmpl,{tag:{tmpl:{_default:{$2:"null"},open:"if($notnull_1){__=__.concat($item.nest($1,$2));}"},wrap:{_default:{$2:"null"},open:"$item.calls(__,$1,$2);__=[];",close:"call=$item.calls();__=call._.concat($item.wrap(call,__));"},each:{_default:{$2:"$index, $value"},open:"if($notnull_1){$.each($1a,function($2){with(this){",close:"}});}"},"if":{open:"if(($notnull_1) && $1a){",close:"}"},"else":{_default:{$1:"true"},open:"}else if(($notnull_1) && $1a){"},html:{open:"if($notnull_1){__.push($1a);}"},"=":{_default:{$1:"$data"},open:"if($notnull_1){__.push($.encode($1a));}"},"!":{open:""}},complete:function(){b={}},afterManip:function(f,b,d){var e=b.nodeType===11?a.makeArray(b.childNodes):b.nodeType===1?[b]:[];d.call(f,b);m(e);c++}});function j(e,g,f){var b,c=f?a.map(f,function(a){return typeof a==="string"?e.key?a.replace(/(<\w+)(?=[\s>])(?![^>]*_tmplitem)([^>]*)/g,"$1 "+d+'="'+e.key+'" $2'):a:j(a,e,a._ctnt)}):e;if(g)return c;c=c.join("");c.replace(/^\s*([^<\s][^<]*)?(<[\w\W]+>)([^>]*[^>\s])?\s*$/,function(f,c,e,d){b=a(e).get();m(b);if(c)b=k(c).concat(b);if(d)b=b.concat(k(d))});return b?b:k(c)}function k(c){var b=document.createElement("div");b.innerHTML=c;return a.makeArray(b.childNodes)}function o(b){return new Function("jQuery","$item","var $=jQuery,call,__=[],$data=$item.data;with($data){__.push('"+a.trim(b).replace(/([\\'])/g,"\\$1").replace(/[\r\t\n]/g," ").replace(/\$\{([^\}]*)\}/g,"{{= $1}}").replace(/\{\{(\/?)(\w+|.)(?:\(((?:[^\}]|\}(?!\}))*?)?\))?(?:\s+(.*?)?)?(\(((?:[^\}]|\}(?!\}))*?)\))?\s*\}\}/g,function(m,l,k,g,b,c,d){var j=a.tmpl.tag[k],i,e,f;if(!j)throw"Unknown template tag: "+k;i=j._default||[];if(c&&!/\w$/.test(b)){b+=c;c=""}if(b){b=h(b);d=d?","+h(d)+")":c?")":"";e=c?b.indexOf(".")>-1?b+h(c):"("+b+").call($item"+d:b;f=c?e:"(typeof("+b+")==='function'?("+b+").call($item):("+b+"))"}else f=e=i.$1||"null";g=h(g);return"');"+j[l?"close":"open"].split("$notnull_1").join(b?"typeof("+b+")!=='undefined' && ("+b+")!=null":"true").split("$1a").join(f).split("$1").join(e).split("$2").join(g||i.$2||"")+"__.push('"})+"');}return __;")}function n(c,b){c._wrap=j(c,true,a.isArray(b)?b:[q.test(b)?b:a(b).html()]).join("")}function h(a){return a?a.replace(/\\'/g,"'").replace(/\\\\/g,"\\"):null}function s(b){var a=document.createElement("div");a.appendChild(b.cloneNode(true));return a.innerHTML}function m(o){var n="_"+c,k,j,l={},e,p,h;for(e=0,p=o.length;e<p;e++){if((k=o[e]).nodeType!==1)continue;j=k.getElementsByTagName("*");for(h=j.length-1;h>=0;h--)m(j[h]);m(k)}function m(j){var p,h=j,k,e,m;if(m=j.getAttribute(d)){while(h.parentNode&&(h=h.parentNode).nodeType===1&&!(p=h.getAttribute(d)));if(p!==m){h=h.parentNode?h.nodeType===11?0:h.getAttribute(d)||0:0;if(!(e=b[m])){e=f[m];e=g(e,b[h]||f[h]);e.key=++i;b[i]=e}c&&o(m)}j.removeAttribute(d)}else if(c&&(e=a.data(j,"tmplItem"))){o(e.key);b[e.key]=e;h=a.data(j.parentNode,"tmplItem");h=h?h.key:0}if(e){k=e;while(k&&k.key!=h){k.nodes.push(j);k=k.parent}delete e._ctnt;delete e._wrap;a.data(j,"tmplItem",e)}function o(a){a=a+n;e=l[a]=l[a]||g(e,b[e.parent.key+n]||e.parent)}}}function u(a,d,c,b){if(!a)return l.pop();l.push({_:a,tmpl:d,item:this,data:c,options:b})}function w(d,c,b){return a.tmpl(a.template(d),c,b,this)}function x(b,d){var c=b.options||{};c.wrapped=d;return a.tmpl(a.template(b.tmpl),b.data,c,b.item)}function v(d,c){var b=this._wrap;return a.map(a(a.isArray(b)?b.join(""):b).filter(d||"*"),function(a){return c?a.innerText||a.textContent:a.outerHTML||s(a)})}function t(){var b=this.nodes;a.tmpl(null,null,null,this).insertBefore(b[0]);a(b).remove()}})(jQuery);

// VinylC Core Library - Addon components 
(function( $, core, global, undefined ) {
    core.addon( 'util', {
        // Provides a simple way to call a function after a set amount of time
        delayedCall: function( callback, delay, context ) {
            var context = context || this;
            context.callbacks = context.callbacks || [];
            var index = context.callbacks.indexOf( callback.name );
            if( index > -1 ) return;
            context.callbacks.unshift( callback );

            if( context.timeout ) clearTimeout( context.timeout );
            context.timeout = setTimeout( function() {
                var calls = context.callbacks;
                for( var i=0,len=calls.length; i<len; i++ ) {
                    if( calls[i] === callback ) {
                        callback.apply( context );
                        context.timeout = null;
                    }
                }
            }, delay );
        },

        // Immediately kills all of the delayedCalls to a particular function
        killDelayedCallsTo: function( callback, context ) {
            var calls = (context||this).callbacks;
            try {
                for( var i=0,len=calls.length; i<len; i++ ) {
                    if( calls[i] === callback ) {
                        calls.splice( i, 1 );
                    }
                }
            } catch( err ) {
            }
        },

        // Framer - Utils.modulate();
        modulate: function( value, rangeA, rangeB, limit ) {
            var fromLow = rangeA[0], fromHigh = rangeA[1];
            var toLow = rangeB[0], toHigh = rangeB[1];
            var result = toLow + ( ((value-fromLow) / (fromHigh-fromLow)) * (toHigh-toLow) );
            if( limit === true ) {
                if( toLow < toHigh ) {
                    if( result < toLow ) return toLow;
                    if( result > toHigh ) return toHigh;

                } else {
                    if( result > toLow ) return toLow;
                    if( result < toHigh ) return toHigh;
                }
            }
            return result;
        }, 
        
        // Underscore - _.debounce(function, wait, [immediate]) 
        debounce: function( func, wait, immediate ) {
            var timeout, result; 
            var later = function( context, args ) { 
                timeout = null; 
                if( args ) result = func.apply( context, args ); 
            }; 

            var restArguments = function( func, startIndex ) { 
                startIndex = startIndex == null ? func.length-1 : +startIndex;
                return function() {
                    var length = Math.max(arguments.length-startIndex, 0), 
                    rest = Array(length); 
                    for( var index=0; index<length; index++ ) { 
                        rest[index] = arguments[ index+startIndex ]; 
                    } 
                    switch( startIndex ) { 
                        case 0: return func.call( this, rest ); 
                        case 1: return func.call( this, arguments[0], rest ); 
                        case 2: return func.call( this, arguments[0], arguments[1], rest ); 
                    } 
                    var args = Array(startIndex+1); 
                    for( index=0; index<startIndex; index++ ) { 
                        args[index] = arguments[index]; 
                    } 
                    args[startIndex] = rest; 
                    return func.apply(this, args); 
                }; 
            }; 

            var delay = restArguments( function(func, wait, args) {
                return setTimeout( function() { 
                    return func.apply( null, args ); 
                }, wait ); 
            }); 

            var debounced = restArguments( function( args ) {
                if( timeout ) clearTimeout( timeout );
                if( immediate ) { 
                    var callNow = !timeout; 
                    timeout = setTimeout( later, wait ); 
                    if( callNow ) result = func.apply( this, args ); 

                } else { 
                    timeout = delay( later, wait, this, args ); 
                }

                return result; 
            });

            debounced.cancel = function() {
                clearTimeout( timeout ); 
                timeout = null; 
            }; 

            return debounced; 
        }, 

        // Detect Physical device 
        isDevice: ( window.orientation !== undefined ) ? true : false 
    });
})( jQuery, window[LIB_NAME], window ); 