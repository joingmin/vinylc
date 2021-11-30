/*! 
 * module vcui.vinylc.Request 
 * extends vcui.ui.View 
 * description Request content 
 * author VinylC UID Group 
 * create 2018-10-10
*/ 
define( 'vinylc/request', ['jquery', 'vcui', 'vinylc/selectbox', 'vinylc/filebox', 'vinylc/calendar'], function( $, core ) { 
    'use strict';

    var Request = core.ui( 'Request', {
        bindjQuery: 'request', 
		initialize: function (el, options) {
            if( this.supr(el, options) === false ) return;

			var self = this;
			var isWran, value;

			self.fileBox = $('.ui_filebox').vcFilebox(options);
			self.fileBox.on('sendata', function(e, data){
				self._sendFormData(data);
			})
			
                
		   var uiSelectBox = $('.ui_selectbox').vcSelectbox();

			self.isCalShow = false;
			$('.ui_calendar').vcCalendar({showByInput:true}).on('hidden', function(){
				isWran = $('.s_cal').hasClass('wran');
				value = $('#prt_start').val();
				if(isWran && value.length > 0) {
					$('.s_cal').removeClass('wran');
				}
				self.isCalShow = false;
			}).on('shown', function(){
				self.isCalShow = true;
				$('.s_cal').find('input').css('border-color', '#b0b0b0');
			}); 

			$('.ui_file').data('isWran', false);
			$('.ui_file textarea').on('propertychange change keyup paste input', function(e){
				value = $(this).val().replace( /(\s*)/g, "");
				if (value.length > 0){
					$('.ui_file').removeClass('wran');
				} else{
					if ($('.ui_file').data('isWran') && !$('.ui_file').hasClass('wran')) $('.ui_file').addClass('wran');
				}
			});
			$('.ui_file').hover(function(){
				if(!$(this).hasClass('wran')) $(this).css('border-color', '#505050');
			}, function(){
				$(this).removeAttr('style');
			});

			$('#prt_month, #prt_scale').on('change', function(){
				isWran = $(this).parent().hasClass('wran');
				value = $(this).val();
				if(isWran && value.length > 0){
					$(this).parent().removeClass('wran');
				}
			});

			$.each($('.list_form.requester li'), function(idx, item){
				$(item).find('input').on('propertychange change keyup paste input', function(){
					isWran = $(this).hasClass('wran');
					value = $(this).val().replace( /(\s*)/g, "");
					if(isWran){
						if(value.length > 0) {
							$(this).removeClass('wran');
						}
					} else{
						if(value.length < 1 && !$(this).hasClass('wran')){
							$(this).addClass('wran');
						}
					}
				});

				if(!vcui.detect.isMobile){
					$(item).hover(function(){
						if(!$(this).find('input').hasClass('wran')) $(this).find('input').css('border-color', '#505050');
					}, function(){
						$(this).find('input').removeAttr('style');
					});
				}
			});

			$('.al_btn input').on('change', function(){
				isWran = $('.al_btn').parent().hasClass('warn');
				value = $(this).prop('checked');
				if(isWran){
					if(value){
						$('.al_btn').data('warn', true);
						$('.al_btn').removeClass('warn');
					}
				} else{
					if(!value && $('.al_btn').data('warn')){
						$('.al_btn').addClass('warn');
					}
				}
			});

			self.isConn = false;
			$('#btn_regist').on('click', function(){	
				if (!self._valueCheck()) return;
	
				if (!self.isConn){
					self.isConn = true;
					self.fileBox.trigger('getdata');
				}
			});
			
			if(!vcui.detect.isMobile){
				$('.s_cal').hover(function(){
					if(!self.isCalShow && !$(this).hasClass('wran')) $(this).find('input').css('border-color', '#505050');
				}, function(){
					$(this).find('input').removeAttr('style');
				});
				
		   
				uiSelectBox.data('isShow', false);
				uiSelectBox.hover(function(){
					if(!$(this).data('isShow') && !$(this).hasClass('wran')) $(this).css('border-color', '#505050');
				}, function(){
					$(this).removeAttr('style');
				});
				uiSelectBox.on('hidden', function(){
					$(this).data('isShow', false);
				}).on('shown', function(){
					$(this).data('isShow', true);
					$(this).removeAttr('style');
				});

				$('.btn_chk_wrap label').hover(function(){
					$(this).css({color:'#fff',border:'1px solid #909090','background-color':'#909090'})
				}, function(){
					$(this).removeAttr('style');
				});
				$('.btn_chk_wrap label').on('click', function(){
					$(this).removeAttr('style');
				});
			} else{
				$('.ui_selectbox select').prop("selectedIndex", -1);
			}
		},

		_valueCheck: function(){

			var chker = true;

			var top = $('.ps_form .list_form').position().top;

			var value = $('.ui_file textarea').val().replace( /(\s*)/g, "");
			if(value.length < 1) {
				if(!$('.ui_file').hasClass('wran')) $('.ui_file').addClass('wran');
				$('.ui_file').data('isWran', true);

				if(top < $(window).scrollTop()) {
					$('body, html').animate({scrollTop:top}, 450, 'easeInOutCubic', function(){
						$('.ui_file textarea').focus();
					});
				}

				chker = false;
			}

			top = $('.list_form li').eq(1).position().top;

			value = $('#prt_start').val().replace( /(\s*)/g, "");
			if(value.length < 1) {
				if(!$('.s_cal').hasClass('wran')) $('.s_cal').addClass('wran');

				if(chker){
					if(top < $(window).scrollTop()) $('body, html').animate({scrollTop:top}, 450, 'easeInOutCubic');
				}
				chker = false;
			}

			var selector;

			if($('#prt_month').val() == null) {
				selector = $('.list_form li').eq(1).find('.selectbox_wrap');
				if(!selector.hasClass('wran')) selector.addClass('wran');

				if(chker){
					if(top < $(window).scrollTop()) $('body, html').animate({scrollTop:top}, 450, 'easeInOutCubic');
				}
				chker = false;
			}

			top = $('#prt_scale').parent().parent().parent().position().top;
			if($('#prt_scale').val() == null) {
				selector = $('#prt_scale').parent();
				if(!selector.hasClass('wran')) selector.addClass('wran');

				if(chker){
					if(top < $(window).scrollTop()) $('body, html').animate({scrollTop:top}, 450, 'easeInOutCubic');
				}
				chker = false;
			}

			var gofield, gotop;
			$.each($('.list_form.requester li'), function(idx, item){
				var field = $(item).find('input');
				value = field.val().replace( /(\s*)/g, "");

				if(value.length < 1){
					if(!field.hasClass('wran')) field.addClass('wran');

					if(chker){
						top = $(this).position().top;
						if(top < $(window).scrollTop()) {
							gofield = field;
							gotop = top;
						} else{
							field.focus();
						}
					}
					chker = false;
				}

				if(idx == 3){
					var exptext = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-Za-z0-9\-]+/;
					if(exptext.test(value)==false){
						if(!field.hasClass('wran')) field.addClass('wran');						

						if(chker){
							top = $(this).position().top;
							if(top < $(window).scrollTop()) {
								gofield = field;
								gotop = top;
							} else{
								field.focus();
							}
						}
						chker = false;
					}
				}
			});

			if (gofield != null){
				$('body, html').animate({scrollTop:gotop}, 450, 'easeInOutCubic', function(){
					gofield.focus();
				});
			}

			var agree = $('.al_btn input').prop('checked');
			if(!agree){
				if(!$('.al_btn').hasClass('warn')) $('.al_btn').addClass('warn');

				chker = false;
			}


			return chker;
		},

		_sendFormData: function(fileDatas){
			var self = this;
            var newFormData = new FormData($('#mainForm')[0]);
			$.each(fileDatas, function(idx, data){
				newFormData.append('upfile', data);
			}.bind(this));

			$.ajax({
					url: self.options.submitURL,
					method: 'post',
					data: newFormData,
					dataType: 'json',
					processData: false,
					contentType: false,
					success: function(e) {
						if(self.options.successCallback != null) self.options.successCallback(e);
					},
					error: function(e){
						self.isConn = false;
						if(self.options.errorCallback != null) self.options.errorCallback(e);
					}
			});
		},
    });

    return Request;
});