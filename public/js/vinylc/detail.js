/*! 
 * module vcui.vinylc.detail 
 * extends vcui.ui.View 
 * description detail content 
 * author VinylC UID Group 
 * create 2018-11-18 
 * update 2018-11-18 
*/

define('vinylc/detail', ['jquery', 'jquery.transit', 'vcui', 'greensock'], function ($, transit, core, greensock) {
    'use strict';

    var Detail = core.ui('Detail', {
        bindjQuery: 'detail',
        defaults: {},
        selectors: {
            moduleWrap: '#content'
        },
        initialize: function initialize(el, options) {
            if (this.supr(el, options) === false) return;

            this.$text = this.$moduleWrap.find('.tween_lite');
			this.$head = this.$moduleWrap.find('.head_info_img > div');
			this.$goodsHead = this.$moduleWrap.find('.hd_img_goods');
            this.$item = this.$moduleWrap.find('.img_frame, .txt_frame, .video_frame').parent();
			//this.$item = this.$moduleWrap.find('.img_type, .txt_type, .ns_summary, .ns_link');
            this.$parallax = this.$moduleWrap.find('.par_frame');
            this.$next = this.$moduleWrap.find('.next_list');

            this._resizeHandler();
            this._bindEvent();
            this._setModule();
        },

        _buyBtnClickHandler: function(e){
          
           if( !vcui.detect.isMobile ) { 
                $('#shp_pc_layer').vcModal();
           } else{
                $('#shp_mo_layer').vcModal();
           }

            return false;
        },

        _bindEvent: function () {
			var interval;
            $(window).on('resize.detail', this._resizeHandler.bind(this));
            $(window).on('scroll.detail', this._scrollHandler.bind(this));

            this.$moduleWrap.find('.goods_buy').on('click', this._buyBtnClickHandler.bind(this));

			// 상품상세 헤더 이미지 로드
			this.$goodsHead.addClass('fade-in');
			this._textModule(this.$text, 500);
			interval = setTimeout(function () {
				this._motionModule();
				// 웍스 및 뉴스 상세 헤더 이미지 로드
				if (this.$head !== undefined) {
					// Fade-in 효과 : Opacity 수치값 : 0 -> 1, duration: 2s, ease: Quart.easeOut / Y Position 수치값 : 350 -> 0, duration: 3s, ease: Quart.easeOut
					$.each(this.$head, function (i, item) {
						if (!$(item).data('play')) {
							$(item).addClass('fade-in');
							$(item).data('play', true);
						}
					}.bind(this));
				}
            }.bind(this), 600);

            if(!vcui.detect.isMobile){
                var showalpha = this.$next.find('a').find('.overlay').css('opacity');
                this.$next.find('a').hover(function(){
                    TweenLite.to($(this).find('.bg img'), 2, {transformOrigin:"50% 50%", scale:1.1, ease:'easeOutQuart', overwrite:1});
                    TweenLite.to($(this).find('.overlay'), 2, {opacity:.4, ease:'easeOutQuart', overwrite:1})
                }, function(){
                    TweenLite.to($(this).find('.bg img'), 2, {transformOrigin:"50% 50%", scale:1, ease:'easeOutQuart', overwrite:1});
                    TweenLite.to($(this).find('.overlay'), 2, {opacity:showalpha, ease:'easeOutQuart', overwrite:1})
                });
            }

            $('footer').show();
        },

        _resizeHandler: function () {
            this.windowWidth = $(window).width();
            this.windowHeight = $(window).height();
            this.nextHeight = this.$next.height();
			
			$.each(this.$parallax, function (i, item) {
				var height = $(item).find('img').height() / 3;
				$(item).height(height * 2).attr('data-height', height);
			});

            if(window.innerWidth > 768){
                $(document).trigger('modalHideFromOutter');

                setTimeout(function(){
                    $('#id_sns').removeAttr('style');
                }, 300);
            }

            var bg = this.$next.find('.bg');
            var img = bg.find('img');
            var bgheight = bg.height();
            var imgheight = img.height();
            img.removeAttr('style');
            if(imgheight > bgheight){
                img.css({
                    top:'50%',
                    'margin-top': imgheight/-2
                })
            }
        },

        _scrollHandler: function () {
            this._motionModule();
        },

        _setModule: function () {
            this.$item.data('play', false);
            this.$text.data('play', false);
			this.$next.data('play', false);
        },

		_textModule: function ($element, moduleTop) {
			var that = this;
			$.each($element, function (i, item) {
				if (!$(item).data('play') && $(item).offset().top < moduleTop) {
					$.each($(item).find('> div:not(.moti_hid) > div'), function (i, item) {
						TweenLite.to($(item).children(), 0.7, {y: 0, delay: 0.1 * i + 0.5, ease: Quart.easeOut, onComplete:that._tweenCallBack, onCompleteParams:[$(item)]});
					});
					$(item).data('play', true);
				}
			});
		},

		_tweenCallBack: function (parm) {
			$(parm).data('play', true);
		},

        _motionModule: function () {
            var scrollTop = $(window).scrollTop(),
                moduleTop, percent, top;

            moduleTop = this.windowHeight + scrollTop;

            if (this.$item !== undefined) {
				// Fade-in 효과 : Opacity 수치값 : 0 -> 1, duration: 2s, ease: Quart.easeOut / Y Position 수치값 : 350 -> 0, duration: 3s, ease: Quart.easeOut
                $.each(this.$item, function (i, item) {
                    if (!$(item).data('play') && $(item).offset().top < moduleTop) {
                        $(item).find('.img_frame, .txt_frame, .video_frame').addClass('fade-in');
                        $(item).data('play', true);
                    }
                }.bind(this));
            }

            if (this.$parallax !== undefined) {
				// Parallax 효과 : 보여지는 화면 높이의 50% 를 더해서 보여줌. 100px -> 150px 
                $.each(this.$parallax, function (i, item) {
                    if ($(item).offset().top < moduleTop && $(item).offset().top + $(item).height() > scrollTop) {
                        percent = 1 - ($(item).offset().top - scrollTop  + $(item).height()) / (this.windowHeight + $(item).height());
						top = ($(item).attr('data-height') * percent) - $(item).attr('data-height') ;
                        $(item).find('img').css({'top': top + 'px'});
                    }
                }.bind(this));
            }

            if (this.$text !== undefined) {
				// Text 효과 : 라인별로 딜레이를 줘서 Y 값 변경
				this._textModule(this.$text, moduleTop);
            }

			/*
            if (!this.$next.data('play') && (this.$next.offset().top + this.$next.height()) < moduleTop) {
				//this.$next.data('play', true);	
				// 하단 Next 영역 효과 : 영역 등장 후 Text 효과 적용
				this.$next.find('> div').height('100%');
				this._textModule(this.$next.find('.nx_text'), moduleTop);
            }
            */
            
           TweenLite.to(this.$moduleWrap.find('.goods_buy'), 2, {delay:.3, alpha:1, ease:Quart.easeOut}) //2019-01-09 상품 구매하기 버튼 추가
        }
    });

    return Detail;
});