/*! 
 * module vcui.ui.Filebox 
 * extends vcui.ui.View 
 * description Common Filebox 
 * author VinylC UID Group 
 * create 2018-10-17
*/ 

define('vinylc/filebox', ['jquery', 'vcui'], function ($, core) {
	'use strict';

	if(core.ui.Filebox) { return; }

    var ctx = window,
        $win = $(window),
        $doc = $(document),
        ui = core.ui,
        dateUtil = core.date,
        detect = core.detect,
        isTouch = detect.isTouch;

	//Filebox ////////////////////////////////////////////////////////////////////////////
	/**
	 * @class
	 * @description 동적파일폼 모듈
	 * @name Filebox
	 * @extends vcui.ui.View
	 */
	var Filebox = ui('Filebox', /** @lends vcui.ui.Filebox# */{
		bindjQuery: 'Filebox',
		defaults: {
			alertUrl: '/include/file_exts_modal.html',
			alertParm: '?parm=1|?parm=2|?parm=3',
			fileName: 'upfile',
			fileBox: 'ui_filedblock',										// 파일박스
			fileList: 'ui_file_list',									// 파일폼 리스트
			fileExts: 'jpg;jpeg;gif;png;ppt;pptx;pdf;txt;zip;doc;docx;xls;xlsx',		// 허용 확장자
			fileReplace: false,											// 파일 교체 (1개만 등록됨)
			fileMaxLength: 5,											// 최대 등록수
			fileMaxSize: 15728640										// 파일 최대 크기 (바이트단위) 0은 무한대
		},

		events: {
		},

		selectors: {
			fileButton : '.ui_file_select',
			fileContent : '.ui_file',
			filePrevText : '.ui_file_prev_text',
		},

		/**
		 *
		 * @param el
		 * @param options
		 * @returns {boolean}
		 */
		initialize: function (el, options) {
			var me = this;

			if (me.supr(el, options) === false) { return; }

			me.fileDatas = {};
			me.fileKey = 0;

			me._bindEvent();
		},

		/**
		 * 이벤트 바인딩
		 */
		_bindEvent : function () {
			var me = this;

			me.$fileButton.find('button').attr('tabIndex', -1);
			me.$fileButton.find('.'+me.options.fileBox).addClass('ui_select_file'); // 파일명 설정

			me.title = me.$('.ui_select_file:file').attr('title') || '첨부파일';

			me.$el.on('mouseenter mouseleave', '.ui_select_file', function (e) {
				$(this).siblings('button').toggleClass('active', e.type === 'mouseenter');
			});

			// 파일 선택 버튼에 이벤트 바인드
			me.$fileButton.on('change', '.' + me.options.fileBox, function (e) {
				var $el = $(this), i;

				var files = $el[0].files;
				var leng = files.length;
				if (me._getFileCount() + leng > me.options.fileMaxLength){
					vcui.ui.ajaxModal(me.options.alertUrl + me.options.alertParm.split('|')[0]);

					return false;
				}
				
				for(i=0;i<leng;i++){					
					if(!me._isValid(files[i].name)) return false;

					if(!me._isSize(files[i].size)) return false;
				}	
				
				
				for(i=0;i<leng;i++) {
					me.fileKey++;

					var key = "file_" + me.fileKey;					
					me._addFileItem(files[i], key);

					me.fileDatas[key] = files[i];
				}

				$el.val('');				
			}).on('click', '.' + me.options.fileBox, function (e) {
				me._checkCount(e);
			}).on('focusin focusout', '.' + me.options.fileBox, function (e) {
				me.$fileButton.toggleClass('focus', e.type === 'focusin');
			}).on('click', 'button', function (e) {
				me._checkCount(e);
			});

			// 삭제버튼 클릭
			me.$fileContent.on('click', 'button.ui_file_del', function (e) {
				e.preventDefault();

				$(this).closest('.'+me.options.fileList).remove();
				me.$fileButton.find('button').attr('tabIndex', -1);

				var key = $(this).data("key");
				delete me.fileDatas[key];
				
				if (me._getFileCount() === 0) {
					me.$filePrevText.show();
					me.$el.find('.' + me.options.fileBox).focus();
				} else {
					me._titleNumbering();
					me.$filePrevText.hide();
				}
			});

			me.$el.closest('form').on('reset', me.reset.bind(me));

			me.on('getdata', function(){
				me.trigger('sendata', me.fileDatas);
			});
		},

		_checkCount: function (e) {
			var me = this;
			// 최대 등록수 초과시 얼럿 표시
			if(me._getFileCount() >= me.options.fileMaxLength && !me.options.fileReplace) {
				//alert('최대 ' + me.options.fileMaxLength + '개까지 추가할 수 있습니다.');
				vcui.ui.ajaxModal(me.options.alertUrl + me.options.alertParm.split('|')[0]);
				e && e.preventDefault();
				return false;
			}
			return true;
		},

		/**
		 * 확장자 유효성 체크, 중복체크
		 * @param {string} val
		 * @return {boolean}
		 * @private
		 */
		_isValid: function (val) {
			var me = this, fileExt;
			
			if(me.options.fileExts) {
				fileExt = core.string.getFileExt(val);
				if(fileExt) { fileExt = fileExt.toLowerCase(); }
				if(me.options.fileExts.toLowerCase().indexOf(fileExt) < 0){
					//alert('유효하지 않은 확장자입니다.');
					vcui.ui.ajaxModal(me.options.alertUrl + me.options.alertParm.split('|')[1]);
					return false;
				}
			}

			return true;
		},

		/**
		 * File 크기 체크
		 * @param {string} val
		 * @return {boolean}
		 * @private
		 */
		_isSize: function (size) {
			var me = this;

			if(me.options.fileMaxSize > 0) {

				if(me.options.fileMaxSize < size){
					//alert('첨부할수 있는 최대 크기는 ' + (me.options.fileMaxSize / 1024 / 1024) + 'M입니다.');
					vcui.ui.ajaxModal(me.options.alertUrl + me.options.alertParm.split('|')[2]);
					return false;
				}
			}

			return true;
		},

		/**
		 * 리스트에 추가된 파일항목 추가
		 * @param {jQuery} $el
		 * @private
		 */
		_addFileItem: function (file, key) {
			var me = this,
				html, fileName, fileExt;

			fileName = core.string.getFileName(file.name);
			fileExt = core.string.getFileExt(file.name).toLowerCase();
			fileName = me._renameForIOS(fileName);

			html = '<div class="btn_file ico ' + fileExt + ' ' + me.options.fileList + '">' + fileName.substring(0, fileName.lastIndexOf('.')) + '<button type="button" class="btn_ic_close ui_file_del" title="'+fileName+' 파일" data-key="' + key + '"><span class="hide">삭제</span></button></div>';

			me.$filePrevText.hide();
			me.$fileContent.append(html).show();
			me._titleNumbering();
		},

		/**
		 * 추가된 파일 갯수 반환
		 * @return {number}
		 * @private
		 */
		_getFileCount: function(){
			var me = this;

			var leng = Object.keys(me.fileDatas).length;

			return leng;
		},

		/**
		 * title 속성에 넘버링
		 * @private
		 */
		_titleNumbering: function () {
			var me = this;

			me.$fileContent.find('.' + me.options.fileList).each(function (rowIdx) {
				$(this).find('[title]').each(function () {
					this.title = (rowIdx + 1) + '번째 ' + this.title.replace(/^[0-9]+번째 /, '');
				});
			});
		},

		/**
		 * 아이폰에서는 추가되는 파일명이 전부 원래 이름이 아닌 image.jpg으로 넘어오므로 랜덤값으로 리스트에 표시
		 * @param {string} fileName
		 * @return {string}
		 * @private
		 */
		_renameForIOS: function (fileName) {
			if (!detect.isIOS || !detect.isMobile || fileName.indexOf('image.') < 0) { return fileName; }
			var ext = core.string.getFileExt(fileName);
			return core.string.random(10).toUpperCase() + '.' + ext;
		},

		/**
		 * 싸고있는 form이 reset 될 때 추가된 파일을 모두 제거해준다.
		 */
		reset: function() {
			var me = this;
			me.$fileContent.find('.ui_new_file').each(function() {
				$(this).closest('.ui_file_list').remove();
			});
		}
	});
	///////////////////////////////////////////////////////////////////////////////////////

	return Filebox;
});