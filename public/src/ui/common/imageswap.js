/*! 
 * module vcui.vinylc.imageswap 
 * extends vcui.ui.View 
 * description imageswap content 
 * author VinylC UID Group 
 * create 2018-12-05 
 * update 2018-12-05
*/ 

define( 'vinylc/imageswap', ['jquery', 'jquery.transit', 'vcui'], function( $, transit, core ) { 
    'use strict';

    var Imageswap = core.ui( 'Imageswap', { 
        bindjQuery: 'imageswap', 
        defaults: { 
			suffix: '_m768' 
		}, 
        selectors: { 
            image: '.ui_image_swap'
        }, 
        initialize: function initialize( el, options ) {
            if( this.supr(el, options) === false ) return; 

			this._imageSwap();
			this._bindEvent();
        },

		_imageSwap: function () { 
			 var self = this,
				 src, _lastDot, _fileName, _fileExt;
 
            $.each(self.$image, function( i, item ) { 
				src = $(item).attr('src');
                _lastDot = src.lastIndexOf('.');
				_fileName = src.substring(0, _lastDot).toLowerCase();
				_fileExt = src.substring(_lastDot).toLowerCase();

				if ($(window).width() >= 768 && src.indexOf(self.options.suffix) !== -1) {
					// PC 사이즈에서 Mobile 이미지를 로드한 경우
					$(item).attr('src', _fileName.replace(self.options.suffix, '') + _fileExt );
				} else if ($(window).width() < 768 && src.indexOf(self.options.suffix) === -1) {
					// Mobile 사이즈에서 PC 이미지를 로드한 경우
					$(item).attr('src', _fileName + self.options.suffix + _fileExt );
				}
            }); 
        },

		_bindEvent: function() { 
			var self = this;

			$(window).on('resize.swap', function () {
				self._imageSwap();
			});
        }
    });

    return Imageswap;
});