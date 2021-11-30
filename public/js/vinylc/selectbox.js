/*! 
 * module vcui.ui.Selectbox 
 * extends vcui.ui.View 
 * description Common Selectbox 
 * author VinylC UID Group 
 * create 2018-10-17
*/ 

define( 'vinylc/selectbox', ['jquery', 'vcui'], function( $, core ) {
    'use strict';

	if(core.ui.Selectbox){ return; }

    var ctx = window,
        $win = $(window),
        $doc = $(document),
        ui = core.ui,
        dateUtil = core.date,
        detect = core.detect,
        isTouch = detect.isTouch;

	var PickerSelectbox = ui('PickerSelectbox', {
		selectors: { selectbox : '> select', label : '> .selectbox_view'  },
        initialize: function (el, options) {
            var self = this;

            if (self.supr(el, options) === false) { return; }

            self._create();
            self._bindEvents();
			
			if (options.cidx != undefined) self._updateLabel(options.cidx);
        },

        _create: function () {
			var self = this;

            self.$selectbox.css({
				'display': 'block',
                '-webkit-appearance': 'none',
                '-moz-appearance': 'none',
                'border-radius': 0,
                'opacity': 0,
                'position': 'absolute',
                'top': 0,
                'left': 0,
                'bottom': 0,
                'width': '100%',
				'zIndex' : 10
            });
        },

        _bindEvents: function () {
            var self = this;

            self.$selectbox.on('change', function () {
                self._updateLabel();
            });
        },

        _updateLabel: function (index) {
            var self = this;

			index = typeof index === 'undefined' ? self.$selectbox[0].selectedIndex : index;
			self.$el.removeClass('placeholder');
			self.$label.find('.select_text').html(self.$selectbox.find('option').eq(index).html());

			self.$selectbox.find("option").eq(index).prop("selected", true);
        },
		
		selectedIndex: function (index, trigger) {
			var self = this;

			self.$selectbox[0].selectedIndex = index;
			self._updateLabel();
			if (trigger !== false) {
				self.$selectbox.trigger('change', {selectedIndex: self.$selectbox[0].selectedIndex});
			}
		}
    });

	var CustomSelectbox = ui('CustomSelectbox', {
		selectors: { selectbox : '> select', label : '> .selectbox_view', list : '> .selectbox_list', selectWrap: '.selectbox_wrap'  },
        initialize: function (el, options) {
            var self = this;

			if (self.supr(el, options) === false) { return; }
			
			self.placeholder = self.$label.find('.select_text').text();

            self._create(options.cidx);
			self._bindEvents();
			
			if (options.cidx != undefined) self._updateLabel(options.cidx);
        },

        _create: function (cidx) {
			var self = this,
				$option = self.$selectbox.find('option'),
				list;

			list = [];
			$option.each(function (index, elem) {
				list.push('<li data-idx=' + index + '><a href="#' + (index + 1) + '" title="' + self.options.title + '">' + $(elem).html() + '</a></li>');
			});
			
			var lists = "";
			var listIdx = cidx == undefined ? 0 : cidx;
			var leng = $option.length;

			if(self.options.mode == 'languageSelector' && self.options.listype == 'up'){				
				if (listIdx < leng-1) listIdx++
				else listIdx = 0;
			}

			for(var i=0;i<leng;i++){
				lists += list[listIdx];

				if (listIdx < leng-1) listIdx++
				else listIdx = 0;
			}

			self.$list.empty().html('<div class="selectbox_area"><ul>' + lists + '</ul></div>');
			if (self.options.direction !== undefined && self.options.direction !== 'undefined' && self.options.direction !== '') {
				self.$list.addClass(self.options.direction.toLowerCase());
			}

			self.$selectbox.val('');
        },

        _bindEvents: function () {
            var self = this,
				selectIndex,
				timer;


			if(self.options.mode == 'languageSelector'){
				self.$el.on('mouseover', 'a', function(){
					self.optionListOver();
				});

				self.$el.on('mouseout', 'a', function(){
					self.optionListOut();
				});

				self.$list.on('click', 'a', function (e) {
					e.preventDefault();
	
					selectIndex = $(this).parent().data('idx');
	
					self.selectedIndex(selectIndex, true);
				});
			} else{
				self.$label.on('click', 'a', function (e) {
					e.preventDefault();
	
					self.optionListToggle(false);
				}).on('focusout focusin', function (e) {
					clearTimeout(timer), timer = null;
					if (e.type === 'focusout' && self.$el.hasClass('on')) {
						timer = setTimeout(function () {
							self.optionListToggle(false);
						}, 200);
					}
				});

				self.$list.on('click', 'a', function (e) {
					e.preventDefault();
	
					selectIndex = $(this).parent().data('idx');
	
					self.selectedIndex(selectIndex, true);
					self.optionListToggle(true);
				}).on('focusout focusin', function (e) {
					clearTimeout(timer), timer = null;
					if (e.type === 'focusout' && self.$el.hasClass('on')) {
						timer = setTimeout(function () {
							self.optionListToggle(false);
						}, 200);
					}
				}).on('keydown', 'a', function (e) {
					var $links = self.$list.find('a'),
						index = $links.index(this),
						count = $links.length;
	
					switch (e.keyCode) {
						case core.keyCode.ESCAPE:
							self.optionListToggle(true);
							break;
						case 38:
							e.preventDefault();
							$links.eq(Math.max(0, index - 1)).focus();
							break;
						case 40:
							e.preventDefault();
							$links.eq(Math.min(count, index + 1)).focus();
							break;
					}
				});
			}
        },

        _updateLabel: function (index) {
            var self = this;

			index = typeof index === 'undefined' ? self.$selectbox[0].selectedIndex : index;
			self.$el.removeClass('placeholder');
			self.$label.find('.select_text').html(self.$selectbox.find('option').eq(index).html());
        },
		
		selectedIndex: function (index, trigger) {
			var self = this;

			self.$selectbox[0].selectedIndex = index;
			self._updateLabel();
			if (trigger !== false) {
				self.$selectbox.trigger('change', {selectedIndex: self.$selectbox[0].selectedIndex});
			} 
		},

		optionListOver: function(){
			var self = this;

			if(!self.$el.hasClass('on')) self.$el.addClass('on');

			self.$list.show();

			self.$label.find('a').attr('title', self.options.title +' 열기');
		},

		optionListOut: function(){
			var self = this;

			if(self.$el.hasClass('on')) self.$el.removeClass('on');

			self.$list.hide();

			self.$label.find('a').attr('title', self.options.title +' 닫기');
		},

		optionListToggle: function (isFocus) {
			var self = this,
				isOpen = self.$el.hasClass('on');

			self.$el.toggleClass('on');
            self.$list.toggle();
			self.$label.find('a').attr('title', self.options.title + (isOpen ? ' 열기' : ' 닫기'));
			isFocus && self.$label.find('a').focus();

			 /* 2018-12-20 필수입력사항에 대한 체크시점을 위해 이벤트 트리거 추가*/
			var txt = self.$label.find('.select_text').text();
			var value = txt == self.placeholder ? "" : txt;
            var evdata = {
				title: self.options.title,
                value: value
            }
			if (isOpen) self.trigger('hidden', evdata);
			else self.trigger('shown');
			/************************************************************/ 
		}
    });

    var Selectbox = ui('Selectbox', /** @lends scui.ui.Selectbox# */{
		bindjQuery: 'Selectbox',
		defaults: { allowPicker: true }, 
        selectors: { selectbox : '> select',  },
        initialize: function initialize( el, options ) {
			if( this.supr(el, options) === false ) return; 
			
			this.placeholder = "";

			if (vcui.detect.isTouch && vcui.detect.isMobile && this.options.allowPicker !== false) {
                new PickerSelectbox(el, this.options);
            } else {
                new CustomSelectbox(el, this.options);
			}
        }
    }); 

    return Selectbox; 
});