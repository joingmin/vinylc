;
(function () {
    'use strict';

    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    var _ = function (element, callback, hard) {

        if (!element || element.nodeType !== 1) return;

        this.element = element;
        this.maxCount = parseInt(element.getAttribute('data-max-count'), 10) || 1000;
        this.callback = typeof callback === 'function' ? callback : function (counter) {
            if (typeof console !== 'undefined') console.log(counter);
        };
        this.hard = hard;
        this.init();

        return this;
    };

    _.prototype = {

        count: function () {
            var orig = (this.element.value || this.element.innerText || this.element.textContent || ''),
                str = orig;

            return {
                paragraphs: str ? (str.match(this.hard ? /\n{2,}/g : /\n+/g) || []).length + 1 : 0,
                words: str ? (str.replace(/\s['";:,.?쩔\-!징]/g, '').match(/\s+/g) || []).length + 1 : 0,
                characters: str ? this._getLength(str) : 0,
                all: orig.replace(/[\n\r]/g, '').length
            };
        },

        init: function () {
            var self = this;

            self.callback.call(self.element, {
                target: self.element
            }, self.count());

            if (typeof self.element.addEventListener !== 'undefined') {
                self.element.addEventListener('input', function () {
                    var data = self.count();
                    self.callback.call(this, {
                        target: self.element
                    }, data);
                });
            } else if (typeof self.element.attachEvent !== 'undefined') {
                self.element.attachEvent('onkeyup', function () {
                    self.callback.call(this, {
                        target: self.element
                    }, self.count());
                });
            }
        },

        _getLength: function (str) {
            for (var b = 0, i = 0, c; c = str.charCodeAt(i++); b += c >> 11 ? 2 /*3*/ : c >> 7 ? 2 : 1){
                if (b >= this.maxCount) {
                    this.element.value = this.element.value.substr(0, i - 1);
                    break;
                }
            }
            return b;
        }

    };

    $.fn.textCounter = function (options) {
        return this.each(function (i) {
            if ($(this).data('textCounter')) {
                return;
            }
            $(this).data('textCounter', new _(this, options.onTextCounting, options.hard));
        });
    };
}());

;
(function () {
    Handlebars.registerHelper('isCheck', function (field, value) {
        return field == value ? "checked" : '';
    });

    Handlebars.registerHelper('isSelect', function (field, value) {
        return field == value ? "selected" : '';
    });

    Handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
        var operators, result;

        if (arguments.length < 3) {
            throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
        }

        if (options === undefined) {
            options = rvalue;
            rvalue = operator;
            operator = "===";
        }

        operators = {
            '==': function (l, r) {
                return l == r;
            },
            '===': function (l, r) {
                return l === r;
            },
            '!=': function (l, r) {
                return l != r;
            },
            '!==': function (l, r) {
                return l !== r;
            },
            '<': function (l, r) {
                return l < r;
            },
            '>': function (l, r) {
                return l > r;
            },
            '<=': function (l, r) {
                return l <= r;
            },
            '>=': function (l, r) {
                return l >= r;
            },
            'typeof': function (l, r) {
                return typeof l == r;
            }
        };

        if (!operators[operator]) {
            throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
        }

        result = operators[operator](lvalue, rvalue);

        if (result) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });


    $.fn.dynamicForm = function (options) {
        var compileRow = function (source, subSource) {
            var tmpl = Handlebars.compile(source);
            var subTmpl = Handlebars.compile(subSource);

            return function (data) {
                var dom = $(tmpl(data));

                $.each(data.children, function (i, subData) {
                    dom.find('.ui-sub-item-wrap').append(subTmpl(subData));
                });

                return dom;
            }
        };

        return this.each(function (i, el) {
            var $listWrap = $(this);
            var data = JSON.parse($listWrap.find('.ui-list-data').text() || []);
            var source = $listWrap.find('.ui-item-tmpl').text();
            var subSource = $listWrap.find('.ui-subitem-tmpl').text();
            var addRow = compileRow(source, subSource);

            $listWrap.empty();

            // 기존데이타 빌드
            $.each(data, function (i, item) {
                $listWrap.append(addRow(item));
            });

            // 글자수 카운팅 빌드
            $listWrap.find('[counting="true"]').textCounter({
                onTextCounting: options.onTextCounting
            });

            // 상위항목 추가
            $(options.addButton).click(function (e) {
                if (options.onBeforeAdd) {
                    var evt = $.Event('beforeAdd');
                    options.onBeforeAdd.call(el, evt);
                    if (evt.isDefaultPrevented()) {
                        return;
                    }
                }

                var dom;
                $listWrap.append(dom = addRow({
                    children: [{}]
                }));
                dom.find('[counting="true"]').textCounter({
                    onTextCounting: options.onTextCounting
                });

                if (options.onAdded) {
                    options.onAdded.call(el, {
                        target: el
                    }, dom.get(0));
                }
            });


            // 하위아이템 추가
            $listWrap.on('click', '.ui-btn-add', function (e) {
                if (options.onBeforeSubAdd) {
                    var evt = $.Event('beforeSubAdd');
                    options.onBeforeSubAdd.call(el, evt);
                    if (evt.isDefaultPrevented()) {
                        return;
                    }
                }

                var $itemWrap = $(this).closest('.ui-item').find('.ui-sub-item-wrap'),
                    dom;

                $itemWrap.append(dom = $(Handlebars.compile(subSource)({
                    children: [{}]
                })));
                dom.find('[counting="true"]').textCounter({
                    onTextCounting: options.onTextCounting
                });

                if (options.onSubAdded) {
                    options.onSubAdded.call(el, {
                        target: el
                    }, dom.get(0));
                };
            });

            // sub 삭제
            $listWrap.on('click', '.ui-sub-item .ui-btn-remove', function (e) {
                e.stopImmediatePropagation();

                if (options.onBeforeRemove) {
                    var evt = $.Event('beforeSubRemove');

                    options.onBeforeSubRemove.call(el, evt, $(e.target).closest('.ui-item').get(0));

                    if (evt.isDefaultPrevented()) {
                        return;
                    }
                }

                $(this).closest('.ui-item').remove();

                if (options.onSubRemoved) {
                    options.onSubRemoved.call(el, {
                        target: el
                    });
                }
            });

            // 상위항목 삭제
            $listWrap.on('click', '.ui-btn-remove', function (e) {
                if (options.onBeforeRemove) {
                    var evt = $.Event('beforeRemove');

                    options.onBeforeRemove.call(el, evt, $(e.target).closest('.ui-item').get(0));

                    if (evt.isDefaultPrevented()) {
                        return;
                    }
                }

                $(this).closest('.ui-item').remove();

                if (options.onRemoved) {
                    options.onRemoved.call(el, {
                        target: el
                    });
                }
            });

            // 위로(상하위 다 처리함)
            $listWrap.on('click', '.ui-btn-up', function (e) {
                var row = $(this).closest('.ui-item');
                if (row.prev().length) {
                    row.insertBefore(row.prev());
                }
            });

            // 아래로(상하위 다 처리함)
            $listWrap.on('click', '.ui-btn-down', function (e) {
                var row = $(this).closest('.ui-item');
                if (row.next().length) {
                    row.insertAfter(row.next());
                }
            });

            // 확장
            $listWrap.on('click', '.ui-btn-expand', function (e) {
                $(this).closest('.ui-item').removeClass('collapse');
            });

            // 축소
            $listWrap.on('click', '.ui-btn-collapse', function (e) {
                $(this).closest('.ui-item').addClass('collapse');
            });
        });
    };
})();