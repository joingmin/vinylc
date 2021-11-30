/*! 
 * module vcui.ui.Calendar 
 * extends vcui.ui.View 
 * description Common Calendar 
 * author VinylC UID Group 
 * create 2018-10-17
*/ 

 define('vinylc/calendar', ['jquery', 'vcui'], function ($, core) {
    'use strict';

    if(core.ui.Calendar){ return; }

    var ctx = window,
        $win = $(window),
        $doc = $(document),
        ui = core.ui,
        dateUtil = core.date,
        detect = core.detect,
        isTouch = detect.isTouch;

    //Calendar ////////////////////////////////////////////////////////////////////////////
    /**
     * @class
     * @description 달력 모듈
     * @name vcui.ui.Calendar
     * @extends vcui.ui.View
     * @fires vcui.ui.Calendar#calendarshow
     * @fires vcui.ui.Calendar#calendarshown
     * @fires vcui.ui.Calendar#calendarhide
     * @fires vcui.ui.Calendar#calendarhidden
     * @fires vcui.ui.Calendar#calendarselected
     * @fires vcui.ui.Calendar#calendarinsertdate
     */
    var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var dateRegex = /[0-9]{4}.?[0-9]{2}.?[0-9]{2}/;


    var Calendar = ui('Calendar', /** @lends scui.ui.Calendar# */{
        bindjQuery: 'calendar',
        defaults: {
            weekNames: ['일', '월','화','수','목','금', '토'],
            monthNames: '1월,2월,3월,4월,5월,6월,7월,8월,9월,10월,11월,12월'.split(','),
            titleFormat: 'yyyy년 MM월 dd일',
            weekendDisabled: false,     // 주말을 disabled시킬 것인가
            type: 'button',             // 날짜가 선택되게 할 것인가
            inputTarget: '',            // 날짜를 선택했을 때, 날짜가 들어갈 인풋박스의 셀렉터
            showOtherMonths: false,     // 이전, 다음달의 날짜를 표시할 것인가
            isBubble: false,                // 달력이벤트의 버블링을 허용할 것인가
            date: new Date(),                // 처음에 표시할 기본 날짜
            today: new Date(),              // 오늘 날짜
            isClickActive: true,            // 인라인모드에서 클릭했을 때 active효과를 줄 것인가.
            showByInput: false,              // 인풋박스에 의해서도 달력을 열 것인가
            where: 'inline',                // 달력 dom을 어디에 두고 열것인가 설정:(body(body 맨 하단, inline(버튼 바로 밑)
            minDate: '-5y',                 // 날짜 하한값
            maxDate: '+5y',                 // 날짜 상한값
            template: {
                header: '<div class="ui-calendar-header-first">' +
                '<a href="#" class="ui-calendar-set-today" title="현재일 보기"></a>' +
                '<select class="ui-calendar-sel-years" title="달력년도"></select>' +
                '<a href="#" class="ui-calendar-close"><span class="hide">닫기</span></a>' +
                '</div>' +
                '<div class="ui-calendar-header-second">' +
                '<a href="#" class="ui-calendar-prev">&lt;</a>' +
                '<span class="ui-calendar-now">01</span>' +
                '<a href="#" class="ui-calendar-next">&gt;</a>' +
                '</div>',
                label: '<span class="ui-calendar-day" title="{{title}}">{{day}}</span>',
                button: '<button type="button" class="ui-calendar-day{{disabled?" disabled":""}}" title="{{title}}" {{disabled?"disabled=disabled style=cursor:default":""}}>{{day}}</button>'
            },
            holidays: [],               // 휴일 날짜 -> ['2014-04-05', '2014-05-12'],
            disabledDays:[],             // 특정일을 선택 못하게 할때 사용 -> ['2014-04-05', '2014-05-12'],
            holidaysAlertMsg: '',
            caption: '캘린더입니다. 글은 일요일, 월요일, 화요일, 수요일, 목요일, 금요일, 토요일 순으로 나옵니다.',
            monthCaption: '월 선택 캘린더입니다. 1월부터 12월까지 순서대로 나옵니다.',
            colWidth: '32px',            // 셀 너비
            format:'yyyy-MM-dd',
			firstHeaderShow: false
        },

        events: {
        },

        /**
         *
         * @param {jquery|element} el 엘리먼트
         * @param {object} [options] 옵션
         * @param {array<string>} [options.weekNames] 주의 한글명
         * @param {array<string>} [options.monthNames] 월의 한글명
         * @param {boolean} [options.isClickable=true] 날짜를 선택할 수 있게 할 것인가
         * @param {string} [options.titleFormat=yyyy년 MM월 dd일] 제목 포맷
         * @param {boolean} [options.weekendDisabled = false] 주말을 disabled시킬 것인가
         * @param {string} [options.inputTarget] 날짜를 선택했을 때, 날짜가 들어갈 인풋박스의 셀렉터
         * @param {boolean} [options.showOtherMonths = false] 이전, 다음달의 날짜를 표시할 것인가
         * @param {date} [options.date = Date.now()] 처음에 표시할 기본 날짜
         * @param {boolean} [options.isHoverCell = true] 인라인모드에서 클릭했을 때 active효과를 줄 것인가.
         * @param {string} [minDate="-5y"] 이전 몇년까지 표시할 것인가
         * @param {string} [minDate="+5y"] 이전 몇년까지 표시할 것인가
         * @param {string} [options.caption] 달력 캡션
         * @returns {boolean}
         */
        initialize: function (el, options) {
            var self = this, d;
            if (self.supr(el, options) === false) {
                return self.release();
            }

            if (self.options.inputTarget) {
                self.$input = $(self.options.inputTarget);
                self.$input.data('ui_calendar', self);
            } else {
                throw new Error('data-input-target 속성을 설정해주세요.');
            }

			self._normalizeOptions();
            self._parseMinMaxDate();
            self.isInline = !self.$el.is('button, input, a');
            self.options.header = true;


            if(self.isInline){
                self.currDate = (d = dateUtil.parse(self.options.date)), isNaN(d) ? new Date() : d;
                self.isShown = true;
                self._readInput();
                self._render();
            } else {

                if (detect.isMobile) {
                    self.currDate = (d = dateUtil.parse(self.$input.val() || self.options.date)), isNaN(d) ? new Date() : d;
                    self._renderMobileCalendar();

                    self.off('.calendar').on('click.calendar', function(e){
                        e.preventDefault();
                        self.$input.focus().click();
                    });

                    return;
                } else {
                    self.options.showByInput && self.$input.css('cursor', 'pointer').on('click', function (e) {
                        if(self.isShown){
                            self.close();
                            return;
                        }
                        self.opener = this;
                        self.open();
                    });

                    self.$input.addClass('ui_formatter').attr({
                        'data-format': 'date',
                        'maxlength': 10
                    }).prop('readonly', true);
                    self.$input.on('keyup paste change', function (e) {

                        if (!self.isShown || this.value.length !== 10) { return; }
                        if (self._isValidDate(this.value)) {
                            self.setDate(this.value);
                        }
                    });
                }

                self.options.type = 'button';
                self.off('.calendar').on('click.calendar', function(e){
                    e.preventDefault();
                    if(self.isShown){
                        self.close();
                        return;
                    }
                    self.opener = this;
                    self.open();
                });
            }


        },

        _isValidDate: function (val) {

            if (!val || val.length < 8) { return false; }
            val = dateUtil.parse(val);
            if (!dateUtil.isValid(val)) { return false; }
            if (this.minDate > val) { return false; }
            if (this.maxDate < val) { return false; }
            return true;
        },

        /**
         * 옵션 중에서 날짜옵션에 문자열로 된게 있으면 파싱해서 date형으로 변환한다.
         * @private
         */
        _normalizeOptions: function() {
            var self = this,
                opts = self.options;

            if(!core.is(opts.today, 'date')) {
                opts.today = dateUtil.parse(opts.today+'');
            }

            //data-holidays속성을 이용한 경우 문자열로 넘어오기 때문에 배열로 변환해주어야 한다.
            if(core.is(opts.holidays, 'string')) {
                try {
                    //opts.holidays = eval(opts.holidays);
                    opts.holidays = ( new Function( 'return ' + opts.holidays ) )();

                } catch (e){ opts.holidays = []; }
            }

            //data-disabled-days속성을 이용한 경우 문자열로 넘어오기 때문에 배열로 변환해주어야 한다.
            if(core.is(opts.disabledDays, 'string')) {
                try {
                    //opts.disabledDays = eval(opts.disabledDays);
                    opts.disabledDays = ( new Function( 'return ' + opts.disabledDays ) )();

                } catch (e){ opts.disabledDays = []; }
            }

        },

        /**
         * 옵션에 있는 최소날짜와 최대날짜를 Date형으로 변환
         */
        _parseMinMaxDate: function () {
            var self = this,
                opts = self.options,
                minDate = opts.minDate,
                maxDate = opts.maxDate;

            self.setMinDate(minDate);
            self.setMaxDate(maxDate);
        },


        /**
         * 미선택 여부
         * @param {number} y 년도
         * @param {number} m 월
         * @param {number} d 일
         * @returns {boolean} 미선택여부
         * @private
         */
        _isDisabledDay: function(y, m, d) {
            var self = this,
                disabledDays = self.options.disabledDays,
                i, date, item;

            for (var i = -1; item = disabledDays[++i]; ) {
                date = dateUtil.parse(item);
                if(date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d) {
                    return true;
                }
            }

            return false;
        },

        /**
         * 휴일 여부
         * @param {number} y 년도
         * @param {number} m 월
         * @param {number} d 일
         * @returns {boolean} 휴일여부
         * @private
         */
        _isHoliday: function(y, m, d) {
            var self = this,
                holidays = self.options.holidays,
                i, date, item;

            for (var i = -1; item = holidays[++i]; ) {
                date = dateUtil.parse(item);
                if(date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d) {
                    return true;
                }
            }

            return false;
        },

        /**
         * 최소날짜 설정
         *
         * @param {Date|String} minDate '2014-12-12', '-2M'
         */
        setMinDate: function (m, isRender) {
            var self = this,
                today = core.clone(self.options.today),
                minDate, val;

            if (!m){ minDate = core.clone(self.options.minDate); }
            else { minDate = m; }

            if (core.is(minDate, 'date')) {
                self.minDate = core.clone(minDate);
            } else if (dateRegex.test(minDate)){
                self.minDate = core.date.parse(minDate);
            } else {
                if (val = core.date.calc(today, minDate)){
                    self.minDate = val;
                }
            }

            if (!core.is(self.minDate, 'date')){
                self.minDate = new Date(today.getFullYear() - 5, 0, 1, 0, 0, 0, 0);
            }

            self.minDate.setHours(0, 0, 0, 0);

            if (dateUtil.isValid(self.currDate) && self.currDate < self.minDate) {
                self.currDate = core.clone(self.minDate);
            }
            if (self.isShown && isRender !== false) {

                self._renderHeader();
                self._renderDate();
            }

            if (detect.isMobile) {
                self.$input.prop({'min': dateUtil.format(self.minDate, 'yyyy-MM-dd')});
            }

            if (self.$input && dateUtil.isValid(self.$input.val()) && dateUtil.compare(self.minDate, self.$input.val()) === -1) {

                if (detect.isMobile) {
                    self.$input.val(dateUtil.format(self.minDate,'yyyy-MM-dd'));
                }else{
                    self.$input.val(dateUtil.format(self.minDate));
                }
            }
        },

        /**
         * 최대날짜 설정
         *
         * @param {Date|String} maxDate '2014-12-12', '+2M'
         */
        setMaxDate: function (m, isRender) {
            var self = this,
                today = core.clone(self.options.today),
                maxDate, val;

            if (!m){ maxDate = core.clone(self.options.maxDate); }
            else { maxDate = m; }

            if (core.is(maxDate, 'date')) {
                self.maxDate = core.clone(maxDate);
            } else if (dateRegex.test(maxDate)) {
                self.maxDate = core.date.parse(maxDate);
            } else {
                if (val = core.date.calc(today, maxDate)){
                    self.maxDate = val;
                }
            }

            if (!core.is(self.maxDate, 'date')) {
                self.maxDate = new Date(today.getFullYear() + 5, 11, 31, 0, 0, 0, 0);
            }

            self.maxDate.setHours(0, 0, 0, 0);

            if (dateUtil.isValid(self.currDate) && self.currDate > self.maxDate) {
                self.currDate = core.clone(self.maxDate);
            }
            if (self.isShown && isRender !== false) {
                self._renderHeader();
                self._renderDate();
            }


            if (detect.isMobile) {
                self.$input.prop({'max': dateUtil.format(self.maxDate, 'yyyy-MM-dd')});
            }

            if (self.$input && dateUtil.isValid(self.$input.val()) && dateUtil.compare(self.maxDate, self.$input.val()) === 1) {
                if (detect.isMobile) {
                    self.$input.val(dateUtil.format(self.maxDate,'yyyy-MM-dd'));
                }else{
                    self.$input.val(dateUtil.format(self.maxDate));
                }
            }
        },

        setRangeDate: function (minDate, maxDate) {
            var self = this;

            self.setMinDate(minDate, false);
            self.setMaxDate(maxDate, false);
            if (self.isShown) {
                self._renderHeader();
                self._renderDate();
            }
        },

        /**
         * 모바일 버전 렌더링
         * @private
         */
        _renderMobileCalendar: function() {
            var self = this;
            self.oldTxt = "";

            self.$input.val(dateUtil.format(self.$input.val(),'yyyy-MM-dd')).attr({'type': 'date', 'data-module': 'calendar'}).prop({
                'readonly': false,
                'min': dateUtil.format(self.minDate, 'yyyy-MM-dd'),
                'max': dateUtil.format(self.maxDate, 'yyyy-MM-dd')
            }).on('change', function (e) {

                var newDate = $(e.currentTarget).val();
                var evtData = {
                            target: e.currentTarget,
                            //year: $this.data('year'),month: $this.data('month'),day: $this.data('day'),value: format,calendar: self.$calendar[0],
                            date: newDate

                        };
                self.$input.triggerHandler('calendarinsertdate', evtData);
            });
        },

        /**
         * 위치 재조절
         */
        _reposition: function() {
            if(this.options.type !== 'button' || this.options.isInline){ return; }

            var self = this,
                util = core.util,
                calWidth = self.$calendar.width(),
                calHalfWidth = Math.ceil(calWidth / 2),
                inpWidth, inpHalfWidth, offset, docWidth, top, left, absLeft;

            inpWidth = self.$input.outerWidth();
            inpHalfWidth = Math.ceil(inpWidth / 2);
            
			/* - 위치 이동 삭제
			top = self.$input[self.options.where === 'body' ? 'offset' : 'position']().top + self.$input.outerHeight() + 10;
            left = inpHalfWidth - calHalfWidth;

            self.$calendar.css({
                left: left,
                top: top
            });
			*/
            return self;
        },

        /**
         * 모달 띄우기
         * @returns {Calendar}
         */
        open: function(){
            var self = this;


            if(self.isInline) { return; }
            Calendar.active && Calendar.active.close();
            Calendar.active = this;

            var ev = $.Event('calendarshow');
            self.trigger(ev);

            if (ev.isDefaultPrevented()) { return; }

            self._readInput();
            self._render();
            self._reposition();
            self.show();
            self.isShown = true;
            self.$calendar.attr('tabindex', 0).focus();

			self.$el.closest('.s_cal').addClass('on');

            return self;
        },

        /**
         * 인풋에 있는 값을 달력에 반영
         * @private
         */
        _readInput: function () {
            var self = this,
                val = self.$input.val(),
                valDate = (val && val.length < 8) ? null : dateUtil.parse(val);

            if (core.date.isValid(valDate)) {
                if (!valDate || isNaN(valDate.getTime())) {
                    self.currDate = core.clone(self.options.date);
                    self.activeDate = core.clone(self.options.today);
                    if (val) {
                        self.$input.val(dateUtil.format(self.activeDate));
                    }
                } else {
                    var cmp = self._compareDate(valDate);
                    if (cmp < 0) {
                        valDate = self.currDate = core.clone(self.minDate);
                    } else if (cmp > 0) {
                        valDate = self.currDate = core.clone(self.maxDate);
                    } else {
                        self.currDate = valDate;
                    }
                    self.activeDate = core.clone(valDate);

                    if (val && cmp !== 0) {
                        self.$input.val(dateUtil.format(valDate));
                    }
                }
            } else {
                self.currDate = core.clone(self.options.date);
                self.activeDate = core.clone(self.options.today);
            }
        },

        /**
         * 모달 닫기
         * @returns {Calendar}
         */
        close: function(){
            var self = this;

            if(self.isInline){ return; }

            self.isShown = false;
            self._trigger('hidden');
            self._remove();
            $doc.off('.calendar');
            Calendar.active = null;
            self.$el.closest('.s_cal').removeClass('on');

            /* 2018-12-20 필수입력사항에 대한 체크시점을 위해 이벤트 트리거 추가*/
            var evdata = {
                value: self.$input.val()
            }
            self.trigger("hidden", evdata); 
            /***********************************************************/

            return this;
        },

        /**
         * 모달 표시
         * @returns {Calendar}
         */
        show: function(){
            var self = this;

            if(!self.isInline) {
                if(self.$el.prop('disabled') || self.$el.hasClass('disabled')) { return; }

                $doc.on('mousedown.calendar', function (e) {
                    if((self.$input && self.$input[0] !== e.target)
                        && !$.contains(self.$el[0], e.target)
                        && !$.contains(self.$calendar[0], e.target)
                        && self.$el[0] != e.target){
                        //e.preventDefault();
                        self.close();
                    }
                });

                if(!core.isTouch) {
                    self._escape();
                }

                self.$calendar.show(); //showLayer({opener: self.$el});
                self._trigger('shown');
                self.trigger('shown');
            }

            return self;
        },

        /**
         * esc 키를 누르면 닫히도록 이번트 바인딩
         * @private
         */
        _escape: function() {
            var self = this;

            self.$calendar.add(self.$el).add(self.$input)
                .off('keyup.calendar').on('keyup.calendar', function(e) {
                    if(e.keyCode === core.keyCode.ESCAPE) {
                        self.close();
                        $(self.opener).focus();
                    }
                });
        },

        /**
         * DOM 삭제
         * @returns {Calendar}
         */
        _remove: function() {
            var self = this;

            if(self.$calendar){
                //self.$selectboxYears.vcSelectbox('release');
                self.$calendar.off();
                self.$calendar.remove();
                self.$calendar = null;
            }

            return self;
        },

        /**
         * 렌더링
         */
        _render: function() {
            var self = this,
                opts = self.options,
                timer, tmpl;

            if (!dateUtil.isValid(self.currDate)) { self.currDate = dateUtil.parse(self.options.date); }
            if (self.currDate < self.minDate) { self.currDate = core.clone(self.minDate); }
            if (self.currDate > self.maxDate) { self.currDate = core.clone(self.maxDate); }

            tmpl = '<div class="ui-calendar-container"><div class="ui-select-day">' +
                (opts.header !== false ? opts.template.header : '') +
                '<div class="ui-calendar-date"></div></div></div>';

            self._remove();
            self.$calendar = $(tmpl);

            if(opts.header) {
                self.$calendar.on('change', '.ui-calendar-sel-years', function (e) {
                    var date = core.clone(self.currDate);
                    date.setYear(this.value|0);
                    self.setCurrentDate(date);
                });
            }

            if(self.isInline) {
                // 인라인
                self.$el.empty().append(self.$calendar);
                self.$el.find('.ui-calendar-close').remove();
            } else {
                // 모달
                self.$calendar.css({
                    position: 'absolute',
                    backgroundColor: '#fff',
                    zIndex: 9999
                });
                if (self.options.where === 'body') {
                    $('body').append(self.$calendar);
                } else {
                    self.$el.parent().append(self.$calendar);
                }
            }

            self.$calendar.off('.calendar')
                .on('click.calendar', '.ui-calendar-prev, .ui-calendar-next', function(e){
                    // 이전 / 다음
                    e.preventDefault();
                    if(self.$el.hasClass('disabled')){ return; }

                    var $el = $(e.currentTarget),
                        isPrev = $el.hasClass('ui-calendar-prev');

                    self[isPrev ? 'prev' : 'next']();
                    self.$calendar.find('.ui-calendar-' + (isPrev?'prev':'next')).focus();
                })
                .on('click.calendar', '.ui-calendar-day:not(.disabled)', function(e) {
                    // 날짜 클릭
                    e.preventDefault();
                    if (self.$el.hasClass('disabled')) {
                        return;
                    }
                    if (self.options.holidaysAlertMsg !== '' && ($(this).parent().hasClass('ui-calendar-holiday') || $(this).parent().hasClass('ui-calendar-sunday') || $(this).parent().hasClass('ui-calendar-saturday'))) {
                        alert(self.options.holidaysAlertMsg);
                        return;
                    }

                    var $this = $(this).closest('td'),
                        data = $this.data(),
                        date = new Date(data.year, data.month - 1, data.day),
                        format = dateUtil.format(date, opts.format || ''),
                        e,
                        evtData = {
                            target: this,
                            year: $this.data('year'),
                            month: $this.data('month'),
                            day: $this.data('day'),
                            value: format,
                            date: date,
                            calendar: self.$calendar[0]
                        };

                    e = $.Event('calendarselected');
                    e.target = e.currentTarget = this;
                    self[opts.isBubble ? 'trigger' : 'triggerHandler'](e, evtData);
                    if (e.isDefaultPrevented()) {
                        return;
                    }

                    if (opts.inputTarget) {
                        self.$input.val(format);
                        e = $.Event('calendarinsertdate');
                        e.target = e.currentTarget = this;
                        self.$input[opts.isBubble ? 'trigger' : 'triggerHandler'](e, evtData);

                        /*if (e.isDefaultPrevented()) {
                         return;
                         }*/
                    }

                    if (self.isInline && opts.isClickActive !== false) {
                        self.$calendar.find('.ui-calendar-active').removeClass('ui-calendar-active');
                        $this.addClass('ui-calendar-active');
                        self._readInput();
                    }
                    if (!self.isInline) {
                        self.close();
                        self.$input.focus();
                    }
                })
                .on('click.calendar', '.ui-calendar-set-today', function(e) {
                    // 오늘 클릭
                    e.preventDefault();
                    self.activeDate = core.clone(self.options.today);
                    self.currDate = core.clone(self.options.today);

                    // 달력 그리기
                    self._renderDate();
                })
                .on('click.calendar', '.ui-calendar-close', function(e) {
                    // 닫기 클릭
                    e.preventDefault();

                    self.close();
                    $(self.opener).focus();
                })
                .on('mouseenter.calendar mouseleave.calendar', 'td.ui-calendar-cell:not(.disabled)', function (e) {
                    $(this).toggleClass('active', e.type === 'mouseenter');
                })
                .on('mouseenter.calendar mouseleave.calendar', '.ui-calendar-table tbody', function (e) {
                    $(this).toggleClass('ui-calendar-over', e.type === 'mouseenter');
                });

            self._renderHeader();
            self._renderDate();
            self._enforceFocus();

            return self;
        },

        update: function () {
            if (!this.isShown) { return; }
            this._render();
            this._reposition();
        },

        /**
         * 헤더에 현재 날짜에 대한 정보 표시
         * @private
         */
        _renderHeader: function(){
            var self = this,
                opts = self.options;

            if(!opts.header) { return; }

            self.$calendar.find('.ui-calendar-header-first').css('z-index', 1).toggle(opts.firstHeaderShow);
            self.$selectboxYears = self.$calendar.find('.ui-calendar-sel-years');

            self.$selectboxYears.empty();
            for(var i = self.minDate.getFullYear(); i <= self.maxDate.getFullYear(); i++) {
                self.$selectboxYears[0].options.add(new Option(i, i));
            }

            self.$selectboxYears.val(self.currDate.getFullYear()).prop("selected", true); // default selectbox;

            // 일달력(.ui-calendar-header-first)의 년도 선택 버튼에 년도 설정
            //self.$selectboxYears.vcSelectbox('option', 'preventZindex', true);
            //self.$selectboxYears.vcSelectbox('value', self.currDate.getFullYear(), false);


            // 일달력(.ui-calendar-header-second)의 월선택 버튼에 월 설정
            var currDate = new Date(self.currDate.getTime()), html,
                $second = self.$calendar.find('.ui-calendar-header-second'),
                isFirst = currDate.getFullYear() === self.minDate.getFullYear() && currDate.getMonth() === self.minDate.getMonth(),
                isLast = currDate.getFullYear() === self.maxDate.getFullYear() && currDate.getMonth() === self.maxDate.getMonth();

            currDate = core.date.calcDate(currDate, '-1M');
            $second.children().each(function (val, name) {
                html = currDate.getFullYear()+'년 ' + core.number.zeroPad(currDate.getMonth() + 1, 2) + '월';
                if(val === 1) {
                    html += '<span class="hide">월이 선택됨</span>';
                } else {
                    html += '<span class="hide">월로 이동</span>';
                }
                $(this).html(html);
                currDate = core.date.calcDate(currDate, '1M');
            });

            $second.find('.ui-calendar-prev').css({outline: 'none'}).toggleClass('disabled', isFirst).attr('tabindex', isFirst ? '-1' : '0');
            $second.find('.ui-calendar-next').css({outline: 'none'}).toggleClass('disabled', isLast).attr('tabindex', isLast ? '-1' : '0');
        },

        /**
         * 해제 메소드
         */
        release: function() {
            var self = this;

            self.$input && self.$input.removeData('calendar');
            self._remove();
            self.close();
            self.supr();
        },

        /**
         * 주어진 월이 유효한 범위에 있는가 체크
         * @param date
         * @returns {*}
         * @private
         */
        _compareMonth: function(date) {
            var self = this;
            date = core.clone(date);
            date.setDate(self.minDate.getDate());
            date.setHours(0, 0, 0, 0);

            if (date.getTime() < self.minDate.getTime()) { return -1; }
            date.setDate(self.maxDate.getDate());
            if (date.getTime() > self.maxDate.getTime()) { return 1; }
            return 0;
        },

        /**
         * 주어진 날짜가 유효한 범위에 있는가 체크
         * @param date
         * @returns {*}
         * @private
         */
        _compareDate: function (date) {
            var self = this;
            if (!(date instanceof Date)) {
                date = dateUtil.parse(date);
            }
            if (!date || isNaN(date)){ return null; }
            date.setHours(0, 0, 0, 0);

            if (date.getTime() < self.minDate.getTime()) { return -1; }
            if (date.getTime() > self.maxDate.getTime()) { return 1; }
            return 0;
        },

        /**
         * 표시할 날짜 설정
         * @param date
         */
        setCurrentDate: function (date) {
            if (!(date instanceof Date)) {
                date = dateUtil.parse(date);
            }
            if (!date || isNaN(date)){ return; }
            var self = this,
                result = self._compareMonth(date);
            if (result < 0) {
                date.setYear(self.minDate.getFullYear());
                date.setMonth(self.minDate.getMonth());
            } else if(result > 0) {
                date.setYear(self.maxDate.getFullYear());
                date.setMonth(self.maxDate.getMonth());
            }
            self.currDate = date;
            //self.$selectboxYears.val(date.getFullYear());
            if (self.isShown) {
                self._renderDate();
            }
        },

        /**
         * 달력 그리기
         * @returns {Calendar}
         * @private
         */
        _renderDate: function() {
            var self = this,
                opts = self.options,
                beforeRenderDay = opts.beforeRenderDay,
                date = self._getDateList(self.currDate),
                html = '',
                tmpl = core.template(opts.template[opts.type] || opts.template.button),
                isHoliday = false,
                isDisabledDay = false,
                isToday = false,
                isSelectDay = false,
                isOtherMonth = false,
                isDisabled = false,
                i, j, y, m, d, week, len, cell, nowd;

            html += '<table class="ui-calendar-table" border="0"><caption>'+opts.caption+'</caption>';
            html += '<colgroup>';
            for(i = 0; i < 7; i++) {
                html += '<col width="'+opts.colWidth+'" />';
            }
            html += '</colgroup><thead>';
            for(i = 0; i < 7; i++) {
                html += '<th class="ui-calendar-dayname ' + (i === 0 ? ' ui-calendar-sunday' : i === 6 ? ' ui-calendar-saturday' : '') + '" scope="col">';
                html += opts.weekNames[i];
                html += '</th>';
            }
            html += '</thead><tbody>';

            for(i = 0, len = date.length; i < len; i++) {
                week = date[i];

                html += '<tr>';
                for(j = 0; j < 7; j++) {
                    y = week[j].year, m = week[j].month, d = week[j].day;
                    nowd = new Date(y, m - 1, d);

                    if (self.activeDate) {
                        isSelectDay = self.activeDate.getFullYear() === y && self.activeDate.getMonth() + 1 === m && self.activeDate.getDate() === d;
                    }
                    isToday = opts.today.getFullYear() === y && opts.today.getMonth() + 1 === m && opts.today.getDate() === d;
                    isOtherMonth = (self.currDate.getMonth() + 1) != m;
                    isDisabled = (self._compareDate(nowd) !== 0) || (opts.weekendDisabled && (j === 0 || j === 6)) || self._isDisabledDay(y,m,d);
                    isHoliday = self._isHoliday(y, m, d);

                    if(beforeRenderDay){
                        cell = beforeRenderDay.call(me, y, m, d, {
                                isSaturday: j === 6,
                                isSunday: j === 0,
                                isHoliday: isHoliday,
                                isToday: isToday,
                                isOtherMonth: isOtherMonth}) || {cls:'', html:'', disabled:''};
                    } else {
                        cell = {cls:'', html:'', disabled:''};
                    }
                    cell.cls = '';

                    html += '<td class="ui-calendar-'+ dateUtil.format(nowd, 'yyyyMMdd') + ' ui-calendar-cell' + (isDisabled?" disabled":"");
                    if(opts.showOtherMonths && isOtherMonth || !isOtherMonth) {
                        html += (isHoliday ? ' ui-calendar-holiday' : '')
                            + (j === 0 ? ' ui-calendar-sunday' : j === 6 ? ' ui-calendar-saturday' : '')
                            + (isToday ? ' ui-calendar-today' : '')
                            + (!isDisabled && isSelectDay ? ' ui-calendar-active' : '');
                    }
                    html += (isOtherMonth ? ' ui-calendar-other' : '')
                        + cell.cls
                        + '" data-year="'+y+'" data-month="'+m+'" data-day="'+d+'">';

                    if(!isOtherMonth || opts.showOtherMonths) {
                        if (cell.html) {
                            html += cell.html;
                        } else {
                            html += tmpl({
                                title: dateUtil.format(nowd, opts.titleFormat) + (isToday ? ' 오늘' : '') + (isDisabled ? " 선택할 수 없음": (isSelectDay ? ' 선택일' : '')),
                                isHoliday: isHoliday,
                                isToday: isToday,
                                isOtherMonth: isOtherMonth,
                                isSunday: j === 0,
                                isSaturday: j === 6,
                                day: d,
                                date: nowd,
                                disabled: isDisabled
                            });
                        }
                    } else {
                        html += '&nbsp;';
                    }
                    html += '</td>';
                } // for
                html += '</tr>';
            } // for
            html += '</tbody></table>';

            self.$calendar.find('.ui-calendar-date').html(html);
            self.$calendar.find('.ui-calendar-text').text(dateUtil.format(self.currDate, 'yyyy-MM'));

            if(opts.header){
                self._renderHeader();
            }

            return self;
        },

        /**
         * 화면 갱신
         */
        refresh: function(){
            this._renderDate();
        },

        /**
         * 주어진 날짜에 해당하는 dom요소를 반환
         * @param day
         * @returns {*}
         */
        findDateCell: function(day) {
            return this.$calendar.find('.data-'+day.getFullYear()+''+(day.getMonth() + 1)+''+day.getDate());
        },

        /**
         * 입력요소를 활성화
         */
        enable: function() {
            var self = this;
            if(!self.options.isInline) {
                self.$input.disabled(false);
            }
            self.$el.disabled(false);
        },

        /**
         * 입력요소를 비활성화
         */
        disable: function() {
            var self = this;

            self.close();
            if(self.options.inputTarget) {
                self.$input.disabled(true);
            }
            self.$el.disabled(true);
        },

        /**
         * 날짜 변경
         * @param date
         */
        setDate: function(date, options) {
            if(!date) { return; }
            var self = this;

            if(options) {
                self.options = $.extend(true, self.options, self.$el.data(), options);
                self._normalizeOptions();
            }

            try {
                if (dateUtil.isValid(date)) {
                    self.activeDate = dateUtil.parse(date);
                } else {
                    return;
                    //self.activeDate = new Date();
                }
                self.currDate = core.clone(self.activeDate);
                if (self.isShown) {
                    self.setCurrentDate(core.clone(self.currDate));
                }
            } catch(e) {
                throw new Error('Calendar#setDate(): 날짜 형식이 잘못 되었습니다.');
            }
            return this;
        },

        /**
         * 오늘날짜 변경
         * @param today
         */
        setToday: function(today) {
            var self = this;

            if(!core.is(today, 'date')) {
                try {
                    self.options.today = core.date.parse(today)
                } catch(e) {
                    throw new Error('calendar#setToday: 날짜 형식이 잘못 되었습니다.')
                }
            }
            self._renderDate();
        },

        /**
         * 오늘날짜 반환
         * @returns {Date} 오늘날짜
         */
        getToday: function() {
            return this.options.today;
        },

        /**
         * 현재 날짜를 반환
         * @returns {*}
         */
        getCurrentDate: function() {
            return this.currDate;
        },

        /**
         * 이전달
         * @returns {Calendar}
         */
        prev: function(){
            var self = this,
                currDate = core.date.add(self.currDate, 'M', -1);
            if(self.options.header && self._compareMonth(currDate) !== 0){ return this; }
            self.currDate = currDate;
            self._renderDate();

            return this;
        },

        /**
         * 다음달
         * @returns {Calendar}
         */
        next: function() {
            var self = this,
                currDate = core.date.add(self.currDate, 'M', 1);
            if(self.options.header && self._compareMonth(currDate) !== 0){ return this; }
            self.currDate = currDate;
            self._renderDate();

            return this;
        },

        /**
         * 날짜 데이타 계산
         * @param {Date} date 렌더링할 날짜 데이타 생성
         * @return {Array}
         */
        _getDateList: function (date) {
            date.setDate(1);

            var self = this,
                month = date.getMonth() + 1,
                year = date.getFullYear(),
                startOnWeek = date.getDay() + 1,
                last = daysInMonth[date.getMonth()],    // 마지막날
                prevLast = daysInMonth[date.getMonth() === 0 ? 11 : date.getMonth() - 1], // 이전달의 마지막날
                startPrevMonth = prevLast - startOnWeek,// 이전달의 시작일
                y = year, m = month;

            if (month > 12) {
                month -= 12, year += 1;
            } else {
                if (month == 2 && self._isLeapYear(year)) {
                    last = 29;
                }
            }

            var data = [],
                week = [];

            if (startOnWeek > 0) {
                if (month == 3 && self._isLeapYear(year)) {
                    startPrevMonth += 1;
                }
                if ((m = month - 1) < 1) {
                    m = 12, y = year - 1;
                }
                for (var i = 1; i < startOnWeek; i++) {
                    week.push({year: y, month: m, day: startPrevMonth + i + 1});        // ***** +1
                }
                if (week.length > 6) {
                    data.push(week), week = [];
                }
            }

            for (var i = 1; i <= last; i++) {
                week.push({year: year, month: month, day: i});
                if (week.length > 6) {
                    data.push(week), week = [];
                }
            }

            if (week.length > 0 && week.length < 7) {
                if ((m = month + 1) > 12) {
                    m -= 12, y = year + 1;
                }
                for (var i = week.length, d = 1; i < 7; i++, d++) {
                    week.push({year: y, month: m, day: d});
                }
            }
            week.length && data.push(week);
            return data;
        },

        /**
         * 다음달
         * @returns {Calendar}
         */
        _enforceFocus: function() {
            var self = this,
                isKeyDown = false;

            $doc.off('keydown.calendar keyup.calendar')
                .on('keydown.calendar keyup.calendar', function(e) {
                    isKeyDown = e.type === 'keydown';
                })
                .off('focusin.calendar')
                .on('focusin.calendar', self.proxy(function(e) {
                    if (!isKeyDown) { return; }
                    if(self.$calendar[0] !== e.target && !$.contains(self.$calendar[0], e.target)) {
                        self.$calendar.find('div:visible').find(':focusable').first().focus();
                        e.stopPropagation();
                    }
                }));
        },

        /**
         * 윤년 여부
         * @param {Date} date 렌더링할 날짜 데이타 생성
         * @return {boolean} 윤년 여부
         */
        _isLeapYear: function (year) {
            return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
        }
    });

	return Calendar;
});
