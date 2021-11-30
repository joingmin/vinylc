/*!
 * module vcui.vinylc.About
 * extends vcui.ui.View
 * description About content
 * author VinylC UID Group
 * create 2018-12-17
*/

define('vinylc/about', ['jquery', 'jquery.transit', 'vcui'], function($, transit, core) {
    'use strict';
 
    var About = core.ui( 'About', {
        bindjQuery: 'about',
        defaults: {ajax:'/json/about.json'}, // FAB10.html내 #tab01 요소에 data-ajax 속성 값으로 셋팅 없을 경우 해당 값이 기본.
        selectors: {
            tabWrap: $('#tab01'),
			tabContent: '.ui_tab_content',
			svcStckWrap: '#id_about_2 .flow_step_wrap',
			slideWrap: '.slide_wrap'
        },
        initialize: function initialize( el, options ) {
            if (this.supr(el, options) === false) return;
            
            window.requestAnimFrame = (function () {
        	    return  window.requestAnimationFrame ||
        	            window.webkitRequestAnimationFrame ||
        	            window.mozRequestAnimationFrame ||
        	            window.oRequestAnimationFrame ||
        	            window.msRequestAnimationFrame ||
        	            function (callback) {
        	                window.setTimeout(callback, 1000 / 60);
        	            }; 
        	})();
 
			this.$tabLists = this.$tabWrap.find('> ul > li');
            this.$tabBar = this.$tabWrap.find('span.bar');
            this.tabIndex = 1;
			this.aboutTop = 0;
			this.svcTop = 0;
            this.windowWidth = window.innerWidth;
            this.windowHeight = $(window).height();
			this.firstH1Top = $('.header_wrap > h1').position().top;
			this.movPx = 0;
			this.slideLoadNum = 0;
			this.slideLength = 0;
			this.slideGroup = [];
			this.slideAnim;
			this.slideSpd = vcui.detect.isMobile ? 2 : 4;
			this.firstSetting = true;
			this.json = null;

            this.$tabWrap.find('ul').css({'font-size':0});
			
			this.scrollPosition = $(window).scrollTop();
            this.scrollStatus = {scrolltop:this.scrollPosition}
			this.isScrolled = false;

			this.isWheelEvt = false;
			
			this._setWindowSizeData();
			this._loadPageData();
			this._bindEvent();
			this._motionTab();
			this._tabScrollMotion();
        },

        _setWindowSizeData: function () {       
            if (this.windowWidth > 1280){
				if (this.windowWidth > 1920){
					this.startPosition = 720;
					this.endPosition = 84;
					this.fonSize = '40';
				} else{
					this.startPosition = 7.5 * (($(window).width() / 100) * 5);
					//this.endPosition = 0.875 * (($(window).width() / 100) * 5);
					this.endPosition = '0.875rem';
					this.fonSize = '0.4166';
				}
            } else{
                if (this.windowWidth > 768){
                    this.startPosition = 11.25 * (($(window).width() / 100) * 5);
                    //this.endPosition = 1.3125 * (($(window).width() / 100) * 5);
                    this.endPosition = '1.3125rem';
                    this.fonSize = '0.625';
                } else{
                    this.startPosition = 0;
                    this.endPosition = 0;
                    this.fonSize = '1.0666';
                }
            }
		},
  
		_loadPageData: function() {
			$.when(this._getJson({url: this.$tabWrap.attr('data-ajax')})).done(function(data) {
        		if (data) {
        			this.json = data;
        			this._setLayout();
    			}
    		}.bind(this));
		},

        _setLayout: function() {

        	if (this.$tabLists.length) {
        		this.$tabLists.css({'transform': 'translateY(0rem) translate(0px, 0px)', '-webkit-transform': 'translateY(0rem) translate(0px, 0px)'});
        	}

        	if (this.$svcStckWrap.length) {
        		this._renderStickyList();
        	}

			this._renderCompList();
        },

        _renderCompList: function(){

    		if (this.json && this.json.compList) {
    			
				var list = this.json.compList;
				this.slideLength = list.length;

				var nums = parseInt(this.slideLength/3);
				if(this.slideLength%3) nums+=1;
				
				var gleng = parseInt(this.slideLength/nums);
				if(this.slideLength%nums) gleng+=1;

				var slideElements = "";
				for(var i=0;i<gleng;i++){

					var slideGname = "slide_" + i;
					this.slideGroup.push(slideGname);

					slideElements += '<ul class="slide_list ' + slideGname + '" >';

					for(var j=0;j<nums;j++){
						
						var idx = parseInt(Math.random()*list.length);

						var img = new Image()
						img.onload = function(){
							this.slideLoadNum++;
							if(this.slideLoadNum == this.slideLength) {
								this._setSlideContPosition(0);

								this.$slideWrap.animate({opacity:1}, 2000, 'easeOutQuart');

								this.slideAnim = requestAnimationFrame(this._movCompanySlide.bind(this));
							}
						}.bind(this);
						img.src = list[idx].img;

						slideElements += '	<li>';
						slideElements += '		<img src="' + img.src + '" alt="' + list[idx].alt + '"/>';
						slideElements += '	</li>';
						list.splice(idx, 1);

						if (list.length == 0) break;
					}

					slideElements += '</ul>';
				}
				
				this.$slideWrap.css('opacity', 0);
				this.$slideWrap.append(slideElements);
			}
		},

		_getPositionLeft: function(item){
			//return item.position().left;
			return parseInt(item.css('x'));
		},
		
		_setSlideContPosition: function(first){
			var slidePosition = this._getPositionLeft($("." + this.slideGroup[0]));
			if (slidePosition > 0) slidePosition = 0;
			$.each(this.slideGroup, function(idx, item){
				var wid = 0;
				var slide = $('.'+item);
				$.each(slide.find('li'), function(cdx, child){
					var imgwidth = $(child).find('img').width();
					var margin = parseInt($(child).css('margin-left'))+2;
					wid += imgwidth + margin;
				}.bind(this));
				
				slide.css({
					width : wid,
					x: slidePosition
				});

				slidePosition += wid;
			}.bind(this));
		},

        _movCompanySlide: function() {
			$.each(this.slideGroup, function(idx, item){
				var slide = $('.'+item);
				var newx = this._getPositionLeft(slide) - this.slideSpd;
				slide.css({
					x:newx
				});
			}.bind(this));
			this._setOutterSlide();
        	
        	this.slideAnim = requestAnimationFrame(this._movCompanySlide.bind(this));
		},
		
		_setOutterSlide: function(){
			var frontname = this.slideGroup[0];
			var backname = this.slideGroup[this.slideGroup.length-1];
			var front = $('.' + frontname);
			var frontx = this._getPositionLeft(front);
			if (frontx + front.width() < 0){
				this.slideGroup.splice(0, 1);
				this.slideGroup.push(frontname);

				front.css({
					x:this._getPositionLeft($('.'+backname)) + $('.'+backname).width()
				});

				return true;
			} else{
				return false;
			}
		},

        _renderStickyList: function(){

    		if (this.json && this.json.stickyList) {

    			var list = this.json.stickyList;
    			var html = [], arrTmp = [];
    			var tmplWrap = $('#service_stickyWrapTmpl')[0].innerHTML, //<div class="flow_step_wrap"><p class="tit {{txtAlign}}"><span>{{title}}</span></p><ul class="list">{{items}}</ul></div>
    				tmplItem = $('#service_stickyItemTmpl')[0].innerHTML, //<li>{{item}}</li>
    				tmp = '', clss = '';
    			var tAlign = {left: 'al_left', right: 'al_right', center: 'al_center'};

    			for (var i = 0, cnt = list.length;i < cnt;i++) {

    				var item = list[i];

    				arrTmp = [];

    				// 타이틀 정렬 기준 : 3개의 정렬값으로 (좌측, 우측, 가운데) 로테이션 한다.
    				switch ((i+1)%3) {
    					case 0:
    						clss = tAlign.center;
    						break;
						case 1:
							clss = tAlign.left;
							break;
						case 2:
							clss = tAlign.right;
							break;
						default:
							break;
					}

    				tmp = tmplWrap.replace(/\{\{title\}\}/g,item.title).replace(/\{\{txtAlign\}\}/g,clss);

    				for (var j = 0,jCnt = item.child.length;j < jCnt;j++) {

    					var child = item.child[j];

    					arrTmp[j] = tmplItem.replace(/\{\{item\}\}/g,item.child[j]);
    				}	//:~for j

    				html[i] = tmp.replace(/\{\{items\}\}/g,arrTmp.join(''))
    			}	//:~for i

    			this.$svcStckWrap.remove();

    			$('.service_bot_wrap','#id_about_2').before($(html.join('')));

    			this.$svcStckWrap = $('.flow_step_wrap','#id_about_2');

			}
        },

        _bindEvent: function() {

        	var $t = this.$tabWrap;

        	if ($t.length) {
        		$t.on('mouseenter','li>a',this._overTab.bind(this))
        		  .on('mouseleave','li>a', this._outTab.bind(this))
        		  .on('click','li>a', this._clickTab.bind(this));
        	}
        	
            $(window).on('resize.about', this._resizeHandler.bind(this))
					 .on('scroll.about', this._scrollHandler.bind(this));
					 
			window.addEventListener('mousewheel', this._mouseWheelHandler.bind(this), {passive:false});
					 
			$(window).on('changeGnbState', this._changeGnbState.bind(this));
		},
		
		_changeGnbState: function(e, state){
			if(state == 'open'){
				cancelAnimationFrame(this.slideAnim);
			} else{
				this._setSlideContPosition();
				this.slideAnim = requestAnimationFrame(this._movCompanySlide.bind(this));
			}
		},
        
        _mouseWheelHandler: function(e){
			if(this.isWheelEvt && this.scrollStatus != null && this.scrollStatus != undefined ){
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
			}
        },
        
        _scrollStatusUpdate: function(){
            $(window).scrollTop(this.scrollStatus.scrolltop);
            this._positonSticky();
            this._tabFooterStoper();
        },
        
        _scrollMoveComplete: function(){
            this.isScrolled = false;
        },

		_motionTab: function() {
            this.$tabLists.transition( {y:0, duration:700, easing:'easeOutQuart'} );

            setTimeout( function() {
                this._resizeTab();
                this.$tabBar.css( {width:0, left:0} );
                var w = this.$tabLists.eq(0).width();
                this.$tabBar.stop().animate( {left:this.tabBarLeft, width:w}, {duration:600, easing:'easeInOutExpo'} );
            }.bind(this), 700 );
        },

        _overTab: function( evt ) {
            vcui.util.killDelayedCallsTo( this._activateTab, this );
            var $target = $(evt.currentTarget);
            var index = $target.parent().index() + 1;
            this._activateTab( index );
        },

        _activateTab: function( index, duration ) {
        	
        	var index = index || this.tabIndex;
            
            var aniAttr = {
            	duration: duration || 300,
            	easing: 'easeOutQuart'
            };
            
            for( var i=0,len=2; i<len; i++ ) { 
                var $a = this.$tabLists.eq(i).find('a');
                var cssAttr = {color: 'rgba(0,0,0,opct)'.replace(/opct/,(i === index-1) ? '1' : '0.35')};
                $a.stop().animate(cssAttr, aniAttr); 
            }

            var x;
            if (index == 1){
                x = this.tabBarLeft;
            } else{
                x = this.tabBarLeft*2 + this.tabBarDist + this.$tabLists.eq(0).width();
            }
            var w = this.$tabLists.eq(index-1).width();
            this.$tabBar.stop(true,true).animate( {left:x, width:w}, aniAttr ); 
        },

        _outTab: function( evt ) {
            vcui.util.delayedCall( this._activateTab, 500, this );
        },

        _clickTab: function( evt ) {

            var $target = $(evt.currentTarget);
            var index = $target.parent().index() + 1;
			var scrollTop = 0;

			if (this.tabIndex !== index) {

				this.$tabContent.hide().eq($target.parent().index()).show();
				this._setTargetModule($target.attr('data-module'));
				
				//this._motionModule();

				this.tabIndex = index;
			}			

			/* 2019-01-14 탭메뉴 이동 시 스크롤상단으로 이동 */

			var scrolltop;
			var position = this.$tabWrap.css('position');
            if (position == 'fixed'){
				if(vcui.detect.isMobile){
					$(window).scrollTop(0);
				} else{
					scrolltop = $('.hd_txt').height() - ($('.header_wrap h1').position().top + $('.header_wrap h1').height()+50);
				}
            } else{
                scrolltop = $(window).scrollTop();
			}

			
			this.scrollPosition = scrolltop;	
			if(this.scrollStatus != null && this.scrollStatus != undefined ){
				TweenLite.to(this.scrollStatus, .1, {
																	scrolltop:this.scrollPosition, ease:Power4.easeOut, overwrite:1, 
																	onUpdate:this._scrollStatusUpdate.bind(this), 
																	onComplete:this._scrollMoveComplete.bind(this)
																});
				/* 2019-01-14 탭메뉴 이동 시 스크롤상단으로 이동 */
			}

			if(this.tabIndex == 2){
				cancelAnimationFrame(this.slideAnim);

				this.isWheelEvt = true;
			} else{
				this._setSlideContPosition();
				this.slideAnim = requestAnimationFrame(this._movCompanySlide.bind(this));

				this.isWheelEvt = false;
			}

			return false;
        },

        _resizeTab: function() {
            var leftvalue, distvalue;
            var ori = window.orientation;
            if (ori !== undefined && ori !== 0 && this.windowWidth < 1024){ 
                leftvalue = 0;
                distvalue = 0.7832;
            } else{
                if(this.windowWidth > 1280){
                    leftvalue = distvalue = 0.3125;
                } else{
                    if (this.windowWidth > 768){
                        leftvalue = distvalue = 0.46875;
                    } else{
                        leftvalue = 0;
                        distvalue = 1.4933;
                    }
                }
            }
            
            if (this.windowWidth > 1920){
                this.tabBarLeft = this.tabBarDist = 30;
            } else{
                this.tabBarLeft = this.windowWidth*.05*leftvalue;
                this.tabBarDist = this.windowWidth*.05*distvalue;
            }

            var tabListW = this.$tabWrap.find('li>a').width(); 
            var tabListH = this.$tabWrap.find('li>a').height(); 
            this.$tabBar.css( {top:tabListH+10, height:tabListH*0.25} ); 
        },

        _tabScrollMotion: function() {
        	
        	var $win = $(window);
        	
            var scrollTop = $win.scrollTop(),
				firstTabTop = this.startPosition * 3,
				fontPercent = 0,
				//offsetTop = $win.data('breakpoint').isPc ? 0 : 50;
				offsetTop = vcui.detect.isMobile ? 50 : 0;

			if (this.windowWidth > 768) {
				var uint = this.windowWidth > 1920 ? 'px' : 'rem';

				// 폰트 크기 변경 초기 사이즈의 70%까지 작아짐
				fontPercent = (((firstTabTop - scrollTop) / firstTabTop) < 0.7) ? 0.7 : (firstTabTop - scrollTop) / firstTabTop;
				this.$tabWrap.find('li>a').css({'fontSize': this.fonSize * fontPercent + uint});
				this._activateTab('', 0);

				// 스크롤시 탭 영역 위치 고정
				var position = this.$tabWrap.css('position');
				if (scrollTop >= (this.startPosition - this.firstH1Top - offsetTop)) {
					this.scrollTop = position == 'fixed' ? this.scrollTop : scrollTop;
					this.$tabWrap.css({'position':'fixed','top': this.endPosition});
				} else {
					this.scrollTop = scrollTop;
					this.$tabWrap.css({'position':'absolute','top': this.startPosition});
				}
                    
                this.tabMode = "TOP";
			} else {
				this.$tabWrap.css({'position':'','top': ''});
				this.$tabWrap.find('li>a').css({'fontSize': this.fonSize + 'rem'});
				this._activateTab('', 0);
                
                this.tabMode = "BOTTOM";
			}
        },
        
        _tabFooterStoper: function(){
            if (this.tabMode == "BOTTOM"){
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
                } else{
					this.$tabWrap.find('ul').css({top:0})
				}
            } else{
                this.$tabWrap.find('ul').css({top:0})
            }
        },

        _setTargetModule: function (target) {

        	this.target = (target === 'list-about') ? 'list-about' : 'list-service';
        },

        _positonSticky: function() {
        	
        	var $win = $(window);
        	var scrollTop = -$win.scrollTop(),
        		rate = 0.5;

        	$.each(this.$svcStckWrap, function stickyloop(i, item) {
    			
        		var $i = $(item),
        			$tit = $i.find(".tit");
        		
    			var top = $win.height() - $i.position().top -($win.height()*rate) - parseFloat($i.css("marginTop")),
    				liHalfPx = $i.find("li:last").outerHeight()/2,
            		bottom = top - $i.innerHeight() + $tit.outerHeight() + liHalfPx,
            		titStPos = 0,
            		titEdPos = $i.outerHeight() - $tit.outerHeight() - liHalfPx; 
    			
    			if (scrollTop < top && scrollTop > bottom) {
    				
    				$tit.css({position: "fixed",
    							   top: ($win.height()*rate)+"px"});	
    			} else {
					var px = (scrollTop < bottom) ? titEdPos : titStPos + "px";

					$tit.css({position: "absolute",
						   		   top: px});
    			}
            }.bind(this));
        },

        _resizeHandler: function( evt ) {
            this.windowWidth = window.innerWidth;
            this.windowHeight = $(window).height();
			this.firstH1Top = $('.header_wrap > h1').position().top;

			if (this.$tabWrap.length) {
				this._setWindowSizeData();
				this._tabScrollMotion();
                this._resizeTab();
				this._activateTab('', 0);
				this._tabFooterStoper();
            }

			if (this.$svcStckWrap.length) {
				this.$svcStckWrap = $('.flow_step_wrap','#id_about_2');
			}

			this._setSlideContPosition();
        },

        _scrollHandler: function() {
        	this._tabScrollMotion();
        	
        	if (!this.isScrolled){
            	this._positonSticky();
            	this._tabFooterStoper();
                this.scrollPosition = this.scrollStatus.scrolltop = $(window).scrollTop();
            }
        },
      
        _getJson: function(option) {
        	var dfd = $.Deferred();
        	$.ajax({
        		type: option.type || "get",
        		url: option.url || this.options.ajax,
        		param: option.param || {},
        		dataType: "json"
        	}).done(function(data){
        		dfd.resolve(data);
        	}).fail(function(req, stat, err){
        		console.log(err);
        	});

        	return dfd.promise();
        }

    });

    return About;
});
