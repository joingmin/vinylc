var Cookie = {};
Cookie.get = function (cookieName) {
    var search = cookieName + "=";
    var cookie = document.cookie;
    var startIndex, endIndex;

    if (cookie.length > 0) {
        startIndex = cookie.indexOf(cookieName);
        if (startIndex !== -1) {
            startIndex += cookieName.length;
            endIndex = cookie.indexOf(";", startIndex);
            if (endIndex === -1) endIndex = cookie.length;
            return decodeURIComponent(cookie.substring(startIndex + 1, endIndex));
        }
        else {
            return false;
        }
    }
    else {
        // 쿠키 자체가 없을 경우
        return false;
    }
};
Cookie.set = function (cookieName, cookieValue, expireDate) {
    var today = new Date();
    today.setDate(today.getDate() + parseInt(expireDate || 1000000000));
    document.cookie = cookieName + "=" + encodeURIComponent(cookieValue) + "; path=/; expires=" + today.toGMTString() + ";";
};

Cookie.delete = function (cookieName) {
    var expireDate = new Date();

    //어제 날짜를 쿠키 소멸 날짜로 설정한다.
    expireDate.setDate(expireDate.getDate() - 1);
    document.cookie = cookieName + "= " + "; expires=" + expireDate.toGMTString() + "; path=/";
};

$(document).on('keydown', function (e) {
    var $panelBody = $('.panel-body');

    switch (e.keyCode) {
        case 37:
            $panelBody.scrollLeft($panelBody.scrollLeft() - 50);
            break;
        case 39:
            $panelBody.scrollLeft($panelBody.scrollLeft() + 50);
            break;
    }
});

function nextId() {
    return ('idx' in nextId) ? nextId.idx += 1 : (nextId.idx = 1)
}

function generate(tree, parent, depth, callback) {
    var result = [];

    if (!parent) {
        parent = {
            id: '',
            name: '',
            text: '',
            path: ''
        };
    }

    $.each(tree, function (key, val) {
        var id = nextId(),
            opened = key.indexOf(':open') >= 0;

        var item = {
            "id": id,
            "name": key,
            "text": key,
            "path": parent.path ? parent.path + '/' + key : key,
            "state": {"opened": depth === 1 || opened, "selected": selectedNode.toString() === id.toString()},
            "parent_id": parent.id || 0,
            "meta": {},
            "children": null
        };

        if ($.isArray(val)) {
            if (!val[1]) {
                val[1] = 'mainFrame';
            }

            if (!val[2]) {
                val[2] = '진행중';
            }

            var target = '';
            var feature = '';
            var pairs = val[1].split(':');

            if (pairs.length === 2) {
                target = pairs[0];
                feature = pairs[1];
            } else {
                target = pairs[0];
            }

            item["meta"]["target"] = val[1];
            item["meta"]["status"] = val[2];

            item["a_attr"] = {
                "href": val[0],
                "target": target,
                'feature': feature || '',
                "class": "jstree-link"// + statusClass
            };

            callback(item);

        } else if ($.isPlainObject(val)) {
            item.children = generate(val, item, depth + 1, callback);
        }

        result.push(item);
    });

    return result;
}


var states = {};
var selectedNode = (Cookie.get('jstreeSelected') || '');

$(function () {
    $('#uiStatusList>li>a').map(function () {
        states[this.getAttribute('data-label')] = {
            el: this,
            class: this.className,
            label: this.getAttribute('data-label'),
            count: 0
        }
    });

    /*document.onmousedown = function (e) {
        if (e.target.nodeName !== "INPUT" || e.target.nodeName !== "TEXTAREA" || e.target.nodeName !== 'A') {
            e.preventDefault();
            return false;
        }
        return true;
    };

    var pos;
    var scroll;
    var $content = $('.panel-content');
    $(document).on('mousedown mousemove mouseup mousecancel', function (e) {
        switch(e.type) {
            case 'mousedown':
                pos = e.screenX;
                scroll = $content.scrollLeft();
                break;
            case 'mousemove':
                if (!pos) {
                    return;
                }

                $content.scrollLeft(scroll + (pos - e.screenX));
                break;
            case 'mouseup':
            case 'mousecancel':
                pos = null;
                break;
        }
    });*/
});

function builsJsTree(tree) {
    var jsonTreeData = generate(tree, null, 1, function (item) {
        if (item.meta.status && item.path.indexOf('Front') === 0) {
            states[item.meta.status].count += 1;
            item.a_attr.class += ' ' + states[item.meta.status].class;
        }
    });

    $.each(states, function (key, item) {
        $('#uiStatusList a.' + item.class + ' .count').text('(' + item.count + ')');
    });

    $('#jstree-wrap').jstree({
        core: {
            data: jsonTreeData,
            dblclick_toggle: false,
            keyboard: {},
            multiple: false
        },
        "search": {
            "case_insensitive": false,
            "show_only_matches": true,
            "search_leaves_only": true,
            "show_only_matches_children": true,
            "search_callback": function (keyword, node) {
                /*if (!keyword) {
                    return true;
                }

                var words = keyword.split(':'),
                    word = '',
                    target ='';

                if (words.length === 2) {
                    switch(words[0]) {
                        case 'status':
                            target = node.original.meta.state;
                            break;
                    }
                } else {
                    word = keyword;
                }*/

                return node.text.toLowerCase().indexOf(keyword.toLowerCase()) > -1
                    || node.original.meta.status === keyword;
            }
        },
        node_customize: {
            default: function (el, node) {
                var $el = $(el);

                if (node.children.length ||
                    !$el.is('li') ||
                    !$el.find('a.jstree-link').length ||
                    $el.hasClass('jstree-newwin')) {
                    return;
                }

                var link = $el.find('a.jstree-link:first');
                var a = link.clone();

                link.attr('title', node.text);

                a.addClass('jstree-newwin');
                a.html('<i></i>');
                a.attr('target', '_blank');
                $el.append(a);
            }
        },
        plugins: ["search", "node_customize"]
    }).bind("select_node.jstree", function (e, data) {
        var attr = data.node.a_attr;
        var href = attr.href;
        var link = data.event.currentTarget;


        if (data.event.ctrlKey) {
            var popup = window.open(href, '_blank');
            return;
        }

        if (data.node.children.length) {
            $('#jstree-wrap').jstree(true).toggle_node(link);
            return;
        }

        if (href === '#') {
            return '';
        }

        Cookie.set('jstreeSelected', data.node.id);

        if (link.target === '_blank') {
            window.open(href, link.target, attr.feature);
        } else {
            top.frames[attr.target].location.href = href;
        }

    }).on('ready.jstree', function () {
        $('#jstree-wrap a.jstree-clicked:first').trigger('click');
    });

    $('#search').keyup(function () {
        var el = this;

        clearTimeout(window.keyupTimer);
        if (el.value.length <= 2) {
            return;
        }

        window.keyupTimer = setTimeout(function () {
            $('#jstree-wrap').jstree('search', el.value);
        }, 500);
    });

    $('#uiStatusList').on('click', 'a', function (e) {
        e.preventDefault();

        $('#search').val($(this).data('label')).trigger('keyup');
    });

    $('#btn-search').on('click', function (e) {
        e.preventDefault();

        $('#search').val('');
        $('#jstree-wrap').jstree('search', '');
    });
}

$.jstree.defaults.node_customize = {
    "key": "type",
    "switch": {},
    "default": null
};

$.jstree.plugins.node_customize = function (options, parent) {
    this.redraw_node = function (obj, deep, callback, force_draw) {
        var node_id = obj;
        var el = parent.redraw_node.apply(this, arguments);
        if (el) {
            var node = this._model.data[node_id];
            var cfg = this.settings.node_customize;
            var key = cfg.key;
            var type = (node && node.original && node.original[key]);
            var customizer = (type && cfg.switch[type]) || cfg.default;
            if (customizer)
                customizer(el, node);
        }
        return el;
    };
}