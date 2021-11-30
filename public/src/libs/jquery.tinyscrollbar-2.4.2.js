/*! 
 * tinyscrollbar - v2.4.2 
 * Licensed under the MIT license
 * author Maarten Baijs
 * create 2016-02-09 
 * update 2018-12-20 
*/ 
 
;(function( factory ) { 
    if( typeof define === 'function' && define.amd ) define( ['jquery'], factory ); 
    else if( typeof exports === 'object' ) module.exports = factory( require('jquery') ); 
    else factory( jQuery ); 
}( function( $ ) {
    'use strict';

    var pluginName = 'tinyscrollbar'; 
    var defaults = {
        axis: 'y', 
        wheel: true, 
        wheelSpeed: 40, 
        wheelLock: true, 
        touchLock: true, 
        trackSize: false, 
        thumbSize: false, 
        thumbSizeMin: 20
    };

    function Plugin( $container, options ) { 
        this.options = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;

        var self = this, 
        $viewport = $container.find('.viewport'), 
        $overview = $container.find('.overview'), 
        $scrollbar = $container.find('.scrollbar'), 
        $track = $scrollbar.find('.track'), 
        $thumb = $scrollbar.find('.thumb'), 

        hasTouchEvents = ('ontouchstart' in document.documentElement), 
        wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : // Modern browsers support 'wheel'
        document.onmousewheel !== undefined ? 'mousewheel' : // Webkit and IE support at least 'mousewheel'
        'DOMMouseScroll',  // let's assume that remaining browsers are older Firefox
        isHorizontal = this.options.axis === 'x', 
        sizeLabel = isHorizontal ? 'width' : 'height', 
        posiLabel = isHorizontal ? 'left' : 'top', 
        mousePosition = 0;

        this.contentPosition = 0;
        this.viewportSize = 0;
        this.contentSize = 0;
        this.contentRatio = 0;
        this.trackSize = 0;
        this.trackRatio = 0;
        this.thumbSize = 0;
        this.thumbPosition = 0;
        this.hasContentToSroll = false;
        if( TweenLite ) this.TW = {}; 

        function _initialize() {
            self.update();
            _setEvents();
            return self;
        }

        this.update = function( scrollTo ) {
            var sizeLabelCap = sizeLabel.charAt(0).toUpperCase() + sizeLabel.slice(1).toLowerCase();
            this.viewportSize = $viewport[0]['offset'+ sizeLabelCap];
            this.contentSize = $overview[0]['scroll'+ sizeLabelCap];
            this.contentRatio = this.viewportSize / this.contentSize;
            this.trackSize = this.options.trackSize || this.viewportSize;
            this.thumbSize = Math.min(this.trackSize, Math.max(this.options.thumbSizeMin, (this.options.thumbSize || (this.trackSize * this.contentRatio))));
            this.trackRatio = (this.contentSize - this.viewportSize) / (this.trackSize - this.thumbSize);
            this.hasContentToSroll = this.contentRatio < 1;
            $scrollbar.toggleClass('disable', !this.hasContentToSroll);

            switch( scrollTo ) {
                case 'bottom': this.contentPosition = Math.max(this.contentSize - this.viewportSize, 0); break; 
                case 'relative': this.contentPosition = Math.min(Math.max(this.contentSize - this.viewportSize, 0), Math.max(0, this.contentPosition)); break; 
                default: this.contentPosition = parseInt(scrollTo,10) || 0;
            }
            this.thumbPosition = this.contentPosition / this.trackRatio;
            _setCss();
            return self;
        };

        function _setCss() {
            $thumb.css(posiLabel, self.thumbPosition);
            $overview.css(posiLabel, -self.contentPosition);
            $scrollbar.css(sizeLabel, self.trackSize);
            $track.css(sizeLabel, self.trackSize);
            $thumb.css(sizeLabel, self.thumbSize);
        }

        function _setEvents() {
            if( hasTouchEvents ) {
                $viewport[0].ontouchstart = function( event ) {
                    if( event.touches.length === 1 ) {
                        event.stopPropagation();
                        _start( event.touches[0] );
                    }
                };
            }

            $thumb.bind( 'mousedown', function( event ) {
                event.stopPropagation();
                _start( event );
            });

            $track.bind( 'mousedown', function( event ) {
                _start( event, true );
            });

            $(window).resize( function() {
                self.update( 'relative' );
            });

            if( self.options.wheel && window.addEventListener ) {
                $container[0].addEventListener( wheelEvent, _wheel, false );

            } else if( self.options.wheel ) {
                $container[0].onmousewheel = _wheel;
            }
        }

        function _isAtBegin() {
            return self.contentPosition > 0;
        }

        function _isAtEnd() {
            return self.contentPosition <= (self.contentSize-self.viewportSize)-5;
        }

        function _start( event, gotoMouse ) {
            if( self.hasContentToSroll ) {
                $('body').addClass('noSelect');
                mousePosition = gotoMouse ? $thumb.offset()[posiLabel] : (isHorizontal?event.pageX:event.pageY);

                if( hasTouchEvents ) {
                    document.ontouchmove = function( event ) {
                        if( self.options.touchLock || _isAtBegin() && _isAtEnd() ) event.preventDefault(); 
                        event.touches[0][pluginName+'Touch'] = 1;
                        _drag(event.touches[0]);
                    };
                    document.ontouchend = _end;
                }
                $(document).bind('mousemove', _drag);
                $(document).bind('mouseup', _end);
                $thumb.bind('mouseup', _end);
                $track.bind('mouseup', _end);
                _drag(event);
            }
        }

        function _wheel( event ) {
            if( self.hasContentToSroll ) {
                var evntObj = event || window.event, 
                wheelDelta = -(evntObj.deltaY || evntObj.detail || (-1 / 3 * evntObj.wheelDelta)) / 40, 
                multiply = ( evntObj.deltaMode === 1 ) ? self.options.wheelSpeed : 1;

                self.contentPosition -= wheelDelta * multiply * self.options.wheelSpeed;
                self.contentPosition = Math.min((self.contentSize - self.viewportSize), Math.max(0, self.contentPosition));
                self.thumbPosition = self.contentPosition / self.trackRatio;

                $container.trigger('move');
                $thumb.css(posiLabel, self.thumbPosition);

                if( TweenLite && self.options.duration ) { 
                    var obj = { ease:self.options.ease, overwrite:1, onUpdate:_updateWheelTween }; 
                    obj[isHorizontal?'x':'y'] = -self.contentPosition; 
                    TweenLite.to( self.TW, self.options.duration, obj ); 

                } else { 
                    $overview.css(posiLabel, -self.contentPosition);
                } 

                if( self.options.wheelLock || _isAtBegin() && _isAtEnd() ) {
                    evntObj = $.event.fix(evntObj);
                    evntObj.preventDefault();
                }
            }
            event.stopPropagation();
        }

        function _updateWheelTween() { 
            $overview.css( posiLabel, self.TW.y ); 
        } 

        function _drag( event ) {
            if( self.hasContentToSroll ) {
                var mousePositionNew = isHorizontal ? event.pageX : event.pageY, 
                thumbPositionDelta = event[pluginName + 'Touch'] ? (mousePosition - mousePositionNew) : (mousePositionNew - mousePosition), 
                thumbPositionNew = Math.min((self.trackSize - self.thumbSize), Math.max(0, self.thumbPosition + thumbPositionDelta));
                self.contentPosition = thumbPositionNew * self.trackRatio;
                $container.trigger('move');
                $thumb.css(posiLabel, thumbPositionNew);

                if( TweenLite && self.options.duration ) { 
                    var obj = { ease:self.options.ease, overwrite:1, onUpdate:_updateWheelTween }; 
                    obj[isHorizontal?'x':'y'] = -self.contentPosition; 
                    TweenLite.to( self.TW, self.options.duration, obj ); 

                } else { 
                    $overview.css(posiLabel, -self.contentPosition);
                } 
            }
        }

        function _end() {
            self.thumbPosition = parseInt($thumb.css(posiLabel),10) || 0;
            $('body').removeClass('noSelect');
            $(document).unbind('mousemove', _drag);
            $(document).unbind('mouseup', _end);
            $thumb.unbind('mouseup', _end);
            $track.unbind('mouseup', _end);
            document.ontouchmove = document.ontouchend = null;
        }

        return _initialize();
    }

    $.fn[pluginName] = function( options ) { 
        return this.each( function() {
            if( !$.data(this,'plugin_'+pluginName) ) {
                $.data(this,'plugin_'+pluginName, new Plugin($(this),options));
            }
        });
    };
}));