/*!
 * @module vcui.helper.Geolocation
 * @license MIT License
 * @description 지오로케이션 헬퍼
 * @copyright VinylC UID Group
 */
define('ui/formValidator', ['jquery', 'vcui'], function ($, core) {
    "use strict";

    var messages = {
        required: "'[name]'항목은 필수입력 항목입니다.",
        match: "'[name]'항목은 '{targetName}'항목과 동일해야 합니다.",
        email: "'[name]'항목이 이메일 형식에 맞지 않습니다.",
        minlength: "'[name]'항목의 최소길이는 {0}입니다.",
        maxlength: "'[name]'항목의 최대길이는 {0}입니다",
        exactlength: "'[name]'항목은 {0}길이여야 합니다.",
        rangelength: "'[name]'항목의 길이가 {0}와 {1}사이여야 합니다.",
        minchecked: "'[name]'항목의 최소 {0}개 이상 체크해 주세요.",
        maxchecked: "'[name]'항목의 최대 {0}개 이하 체크해 주세요.",
        exactchecked: "'[name]'항목은 {0}개 체크해 주세요.",
        rangechecked: "'[name]'항목은 {0}개에서 {1}개 사이에만 체크해 주세요.",
        alpha: "'[name]'항목은 영문자만 유효합니다.",
        alnum: "'[name]'항목은 영문자와 숫자만 유효합니다.",
        numeric: "'[name]'항목은 숫자, ., -만 유효합니다.",
        integer: "'[name]'항목은 -, 숫자만 유효합니다.",
        decimal: "'[name]'항목은 -, ., 숫자만 유효합니다.",
        nozero: "'[name]'항목은 0으로 시작하면 안됩니다.",
        file: "'[name]'항목은 {0}확장자만 유효합니다.",
        url: "url주소 형식이 잘못 되었습니다.",
        tel: "전화번호가 잘못 되었습니다.",
        mobile: "휴대폰번호 형식이 잘못 되었습니다.",
        gt_date: "'[name]'날짜는 '{targetName}'날짜보다 이후여야 합니다.",
        lt_date: "'[name]'날짜는 '{targetName}'날짜보다 이전이어야 합니다.",
        eqgt_date: "'[name]'날짜는 '{targetName}'날짜와 같거나 이후여야 합니다.",
        eqlt_date: "'[name]'날짜는 '{targetName}'날짜와 같거나 이전이어야 합니다.",
        regexp: "[data-pattern] 정규식에 안맞습니다.",
        filemaxsize: "'[name]'는 '{0}' 이상 올릴 수 없습니다.",
        filemaxcount: "'[name]'는 {0}개까지만 등록할 수 있습니다."
    };

    var ruleRegex = /^(.+?)\((.+)\)$/,
        numericRegex = /^[0-9]+$/,
        integerRegex = /^\-?[0-9]+$/,
        decimalRegex = /^\-?[0-9]*\.?[0-9]+$/,
        emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        alphaRegex = /^[a-z]+$/i,
        alphaNumericRegex = /^[a-z0-9]+$/i,
        naturalNoZeroRegex = /^[1-9][0-9]*$/i,
        ipRegex = /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/i,
        base64Regex = /[^a-zA-Z0-9\/\+=]/i,
        numericDashRegex = /^[\d\-\s]+$/,
        telRegex = /^\d{2,3}-\d{3,4}-\d{4}$/,
        mobileRegex = /^(010|011|17|018|019)-\d{3,4}-\d{4}$/,
        urlRegex = /^((http|https):\/\/(\w+:{0,1}\w*@)?(\S+)|)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,
        dateRegex = /^\d{4}-\d{1,2}-\d{1,2}/;


    function typeName(el) {
        return (el.type || '').toLowerCase();
    }

    function tagName(el) {
        return (el.tagName || '').toLowerCase();
    }

    function getValue(el) {
        if (typeof el === 'string') {
            return el;
        }

        var type = typeName(el),
            items;
        if (type === 'checkbox' || type === 'radio') {
            items = [].slice.call(el.form.elements[el.name]);
            for (var i = -1, item; item = items[++i];) {
                if (item.checked === true) {
                    return item.value;
                }
            }
            return '';
        }
        return el.value.trim();
    }

    function getCheckedCount(el) {
        var items = [].slice.call(el.form.elements[el.name]),
            cnt = 0;

        for (var i = -1, item; item = items[++i];) {
            if (item.checked) {
                cnt += 1;
            }
        }
        return cnt;
    }

    function parseDate(date) {
        if (!date.match('today') && !date.match(dateRegex)) {
            return false;
        }

        var validDate = new Date(),
            validDateArray;

        if (!date.match('today')) {
            validDateArray = date.split('-');
            validDate.setFullYear(validDateArray[0]);
            validDate.setMonth(validDateArray[1] - 1);
            validDate.setDate(validDateArray[2]);
        }
        return validDate;
    }

    function getInputName(el) {
        var label;
        if (el.length) {
            el = el[0];
        }

        if (label = el.getAttribute('data-name')) {
            return label;
        }
        if (label = el.getAttribute('id')) {
            if (label = $('label[for=' + label + ']')[0]) {
                return label.innerText;
            }
            if ((label = $(el).closest('label')).length) {
                return label[0].innerText;
            }
        }
        return el.name;
    }

    function byteLength(value) {
        var l = 0;
        for (var i = 0, len = value.length; i < len; i++) {
            l += (value.charCodeAt(i) > 255) ? 2 : 1;
        }
        return l;
    }

    var FormValidator = function (el, options) {
        var self = this;

        self.errors = [];
        self.$form = $(el);
        self.form = self.$form.get(0);
        self.messages = $.extend({}, messages, options.messages);
        self.befores = {};
        self.afters = {};

        var opt = self.options = core.extend({
            autoCheck: true,
            notifyType: 'alert', // tooltip, none
            /*tooltip: function () {
            },*/
            onBeforeSubmit: function () {
            },
            onInvalid: function () {
            },
        }, options);

        core.each(opt.validBefore || {}, function (v, k) {
            self.addValidBefore(k, v);
        });

        core.each(opt.validAfter || {}, function (v, k) {
            self.addValidAfter(k, v);
        });

        if (opt.autoCheck) {
            self.$form.on('submit', function (e) {
                if (!self.run()) {
                    e.preventDefault();
                    opt.onInvalid.call(self, this);
                    return false;
                }
                try {
                    if (opt.onBeforeSubmit.call(self, this) === false) {
                        e.preventDefault();
                    }
                } catch(ex) {
                    e.preventDefault();
                    self.errors.push(ex);
                    self._showError();
                }
            });
        }

        if (opt.notifyType === 'tooltip') {
            this._bindInputEvent();
        }
    };

    core.extend(FormValidator, {
        messages: messages,
        rules: {
            required: {
                fn: function (element) {
                    var value = getValue(element);
                    return !!(value);
                }
            },
            match: {
                fn: function (element, matchName) {
                    var el = this.form[matchName];
                    this.currentData.targetName = getInputName(el) || matchName;

                    if (el) {
                        return element.value === getValue(el);
                    }

                    return false;
                }
            },
            email: {
                fn: function (element, other) {
                    var val = getValue(element), domain;
                    if (other && (domain = element.form.elements[other])) {
                        val += '@' + getValue(domain);
                    }
                    return emailRegex.test(val);
                }
            },
            tel: {
                fn: function (element, tel2name, tel3name) {
                    var val = getValue(element);
                    if (arguments.length > 1) {
                        val += '-' + getValue(element.form[tel2name]) + '-' + getValue(element.form[tel3name]);
                    }
                    return telRegex.test(val);
                }
            },
            mobile: {
                fn: function (element, tel2name, tel3name) {
                    var val = getValue(element);
                    if (arguments.length > 1) {
                        val += '-' + getValue(element.form[tel2name]) + '-' + getValue(element.form[tel3name]);
                    }
                    return mobileRegex.test(val);
                }
            },
            minlength: {
                fn: function (element, length) {
                    return (getValue(element).length >= parseInt(length, 10));
                }
            },
            maxlength: {
                fn: function (element, length) {
                    return (getValue(element).length <= parseInt(length, 10));
                }
            },
            exactlength: {
                fn: function (element, length) {
                    return (getValue(element).length === length | 0);
                }
            },
            rangelength: {
                fn: function (element, min, max) {
                    var len = getValue(element).length;
                    return len >= min && len <= max;
                }
            },
            minbyte: {
                fn: function (element, length) {
                    return (byteLength(getValue(element)) >= parseInt(length, 10));
                }
            },
            maxbyte: {
                fn: function (element, length) {
                    return (byteLength(getValue(element)) <= parseInt(length, 10));
                }
            },
            exactbyte: {
                fn: function (element, length) {
                    return (byteLength(getValue(element)) === length | 0);
                }
            },
            minchecked: {
                fn: function (element, min) {
                    return getCheckedCount(element) >= min | 0;
                }
            },
            maxchecked: {
                fn: function (element, max) {
                    return getCheckedCount(element) <= max | 0;
                }
            },
            exactchecked: {
                fn: function (element, cnt) {
                    return getCheckedCount(element) === cnt | 0;
                }
            },
            rangechecked: {
                fn: function (element, min, max) {
                    var cnt = getCheckedCount(element);
                    if (typeof max === 'undefined') {
                        max = min;
                    }
                    return cnt >= min && cnt <= max;
                }
            },
            lt: {
                fn: function (element, param) {
                    if (!decimalRegex.test(getValue(element))) {
                        return false;
                    }

                    return (parseFloat(element.value) > parseFloat(param));
                }
            },
            gt: {
                fn: function (element, param) {
                    if (!decimalRegex.test(getValue(element))) {
                        return false;
                    }

                    return (parseFloat(getValue(element)) < parseFloat(param));
                }
            },
            alpha: {
                fn: function (element) {
                    return (alphaRegex.test(getValue(element)));
                }
            },
            alnum: {
                fn: function (element) {
                    return (alphaNumericRegex.test(getValue(element)));
                }
            },
            numeric: {
                fn: function (element) {
                    return (numericRegex.test(getValue(element)));
                }
            },
            integer: {
                fn: function (element) {
                    return (integerRegex.test(getValue(element)));
                }
            },
            decimal: {
                fn: function (element) {
                    return (decimalRegex.test(getValue(element)));
                }
            },
            nozero: {
                fn: function (element) {
                    return (naturalNoZeroRegex.test(getValue(element)));
                }
            },
            url: {
                fn: function (element) {
                    return (urlRegex.test(getValue(element)));
                }
            },
            file: {
                fn: function (element, exts, original) {
                    if (element.type !== 'file') {
                        return true;
                    }

                    var ext = element.value.substr((getValue(element).lastIndexOf('.') + 1)),
                        typeArray = exts.split(';'),
                        inArray = false,
                        i = 0,
                        len = typeArray.length;

                    for (i; i < len; i++) {
                        if (ext === typeArray[i]) {
                            inArray = true;
                            break;
                        }
                    }

                    return inArray;
                }
            },
            filemaxsize: {
                fn: function (element, size, original) {
                    if (element.type !== 'file') {
                        return true;
                    }

                    var total = 0;
                    var value = size.match(/^(\d+)(\w+)?$/i);
                    var units = {b: 1024, kb: Math.pow(1024, 2), mb: Math.pow(1024, 3), gb: Math.pow(1024, 4)};
                    var maxSize = (value[0] | 0) * (units[value[1]] || 1);

                    for (var i = 0; i < element.files.length; i++) {
                        total += element.files[i].size;
                    }

                    return total <= maxSize;
                }
            },
            filemaxcount: {
                fn: function (element, count, original) {
                    var count = count | 0;

                    return element.files.length <= count;
                }
            },
            date: {
                fn: function (element, format) {
                    return dateRegex.test(getValue(element));
                }
            },
            gt_date: {
                fn: function (element, date) {
                    var enteredDate = parseDate(getValue(element)),
                        validDate = parseDate(element.form[date] ? getValue(element.form[date]) : date);

                    if (!validDate || !enteredDate) {
                        return false;
                    }
                    if (enteredDate > validDate) {
                        return true;
                    }
                    else {
                        element.form[date] && (this.currentTarget = element.form[date]);
                        return false;
                    }
                }
            },
            lt_date: {
                fn: function (element, date) {
                    var enteredDate = parseDate(getValue(element)),
                        validDate = parseDate(element.form[date] ? getValue(element.form[date]) : date);

                    if (!validDate || !enteredDate) {
                        return false;
                    }

                    if (enteredDate < validDate) {
                        return true;
                    }
                    else {
                        element.form[date] && (this.currentTarget = element.form[date]);
                        return false;
                    }
                }
            },
            eqgt_date: {
                fn: function (element, date) {
                    var enteredDate = parseDate(getValue(element)),
                        validDate = parseDate(element.form[date] ? getValue(element.form[date]) : date);

                    if (!validDate || !enteredDate) {
                        return false;
                    }

                    if (enteredDate >= validDate) {
                        return true;
                    }
                    else {
                        element.form[date] && (this.currentTarget = element.form[date]);
                        return false;
                    }
                }
            },
            eqlt_date: {
                fn: function (element, date) {
                    var enteredDate = parseDate(getValue(element)),
                        validDate = parseDate(element.form[date] ? getValue(element.form[date]) : date);

                    if (!validDate || !enteredDate) {
                        return false;
                    }

                    if (enteredDate <= validDate) {
                        return true;
                    }
                    else {
                        element.form[date] && (this.currentTarget = element.form[date]);
                        return false;
                    }
                }
            },
            regexp: {
                fn: function (element) {
                    var regstr = element.getAttribute('data-pattern');
                    var regexp = new RegExp(regstr);
                    return regexp.test(getValue(element));
                }
            }
        },
        addRule: function (name, handler) {
            this.rules[name] = handler;
        }
    });

    FormValidator.prototype = {
        constructor: FormValidator,
        _bindInputEvent: function () {
            var els = this.form.elements;
            var el;

            for (var i = -1; el = els[++i]; ) {
                $(el).on('input paste cut', function (e) {
                    $(this).parent().removeClass('error');
                });
            }
        },
        setMessage: function (rule, message) {
            this.messages[rule] = message;

            return this;
        },
        addValidBefore: function (name, handler) {
            if (name && typeof this.form[name] && handler && typeof handler === 'function') {
                this.befores[name] = handler;
            }
        },
        addValidAfter: function (name, handler) {
            if (name && typeof this.form[name] && handler && typeof handler === 'function') {
                this.afters[name] = handler;
            }
        },
        run: function () {
            var self = this,
                opt = self.options;

            if (!self._validateForm()) {
                opt.onInvalid.call(self.form, self._getLastError());
                if (opt.notifyType !== 'none') {
                    self._showError();
                }
                return false;
            }
            return true;
        },
        _normalizeMessage: function (el, msg, params, data) {
            data = data || {};

            return msg && msg.replace(/\[name\]/ig, function (v, s) {
                return getInputName(el);
            }).replace(/\{([a-z0-9-]+)\}/ig, function (v, s) {
                if (/[0-9]+/.test(s)) {
                    return params[s] || '';
                } else {
                    return el.getAttribute('data-' + s) || data[s] || 'unknown';
                }
            }).replace(/\[([a-z0-9-]+)\]/ig, function (v, s) {
                return el.getAttribute(s) || '';
            }) || 'unknown msg';
        },
        _getLastError: function () {
            return this.errors[this.errors.length - 1];
        },
        _showError: function () {
            if (!this.errors.length) {
                return;
            }

            switch (this.options.notifyType) {
                case 'alert':
                    var error = this._getLastError();
                    var message = this._normalizeMessage(error.el, error.msg || this.messages[error.rule], error.params, error.data);

                    alert(message);
                    error.el.focus();
                    error.el.select();
                    break;
                case 'tooltip':
                    for (var i = 0, len = this.errors.length; i < len; i++) {
                        var error = this.errors[i];
                        var $tooltip = $(this.options.tooltip ? this.options.tooltip(error.el) : $(error.el).next('.message'));
                        var message = this._normalizeMessage(error.el, error.msg || this.messages[error.rule], error.params, error.data);

                        if ($tooltip.length) {
                            $tooltip.html(message);
                        }

                        $(error.el).parent().addClass('error');
                    }
                    this.errors[0].el.focus();
                    if (this.errors[0].el.select) {
                        this.errors[0].el.select();
                    }
                    break;
            }
        },
        _validateForm: function () {
            var self = this,
                elements = self.form.elements,
                success = true,
                fn,
                isStopOnError = self.options.notifyType === 'alert';

            self.errors = [];
            if (!elements.length) {
                return true;
            }


            try {
                for (var i = -1, element; element = elements[++i];) {
                    if ((fn = self.befores[element.name]) && fn.call(self, element) === false) {
                        success = false;
                        break;
                    }

                    if ((!isStopOnError || success) && self._validateField(element)) {
                        if (fn = self.afters[element.name]) {
                            if (fn.call(self, element) === false) {
                                success = false;
                                break;
                            }
                        }
                    } else {
                        success = false;
                        if (isStopOnError) {
                            break;
                        }
                    }
                }
            } catch (ex) {
                console.error(ex);
                return false;
            }

            return success;
        },
        _parseRules: (function () {
            var paramRegex = /^([a-z]+)(?:\((.+)\)$)*/;
            return function (element) {
                var rules = (element.getAttribute('data-valid') || '').split('|'),
                    matches, result = {};

                if (element.hasAttribute('required')) {
                    result['required'] = true;
                    element.removeAttribute('required');
                }

                for (var i = -1, rule; (rule = rules[++i]) && (matches = rule.match(paramRegex));) {
                    result[matches[1]] = {
                        params: matches[2] ? (matches[2] || '').split(/,\s*/g).map(function (val) {
                            return typeof val === 'number' ? val | 0 : val;
                        }) : [],
                        original: rule,
                        data: matches[2]
                    }
                }

                console.log(result);
                return result;
            };
        })(),
        _validateField: function (element) {
            var self = this,
                rules = self._parseRules(element),
                rule;

            for (var name in rules) {
                if (!rules.hasOwnProperty(name)) {
                    continue;
                }
                if (!rules['required'] && !element.value.trim()) {
                    continue;
                }
                if (rule = FormValidator.rules[name]) {
                    delete self['currentTarget'];
                    self.currentData = {};
                    if (!rule.fn.apply(self, [element].concat(rules[name].params))) {
                        self.errors.push({
                            rule: name,
                            el: element,
                            target: self.currentTarget,
                            params: rules[name].params,
                            data: self.currentData
                        });
                        return false;
                    }
                } else {
                    throw new Error('[Validator] ' + name + '는 지원하지 않는 규칙입니다.');
                }
            }

            return true;
        }
    };

    //window.FormValidator = FormValidator;
    /*$.fn.validator = function(options){
        return this.each(function() {
            new FormValidator(this, options);
        });
    };*/
    return FormValidator;
});
