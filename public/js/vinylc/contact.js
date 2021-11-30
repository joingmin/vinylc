/*! 
 * module vcui.vinylc.Contact 
 * extends vcui.ui.View 
 * description Contact content 
 * author VinylC UID Group 
 * create 2018-10-10
*/ 

define( 'vinylc/contact', ['jquery', 'jquery.transit', 'vcui', 'vinylc/header'], function( $, transit, core, Header ) { 
    'use strict';

    var Contact = core.ui( 'Contact', {
        bindjQuery: 'contact', 
        selectors: {
            moduleWrap: '.content', 
        }, 
        initialize: function initialize( el, options ) {
            if( this.supr(el, options) === false ) return; 

            new Header( $('header') ); 
            this.mouseWheelable = true; 
            this.windowHeight = $(window).height(); 

            this._setLayout(); 
            this._bindEvent(); 
            setTimeout( function() {
                this.render();     
            }.bind(this), 500 ); 
        }, 

        render: function() { 
        }, 

        _setLayout: function() { 
        }, 

        _bindEvent: function() { 
            $(window).on( 'resize.contact', this._resizeHandler.bind(this) ); 
            $(window).on( 'scroll.contact', this._scrollHandler.bind(this) ); 
            $(document).on( 'mousewheel.contact', this._mouseWheelHandler.bind(this) ); 
        }, 

        _resizeHandler: function( evt ) { 
            this.windowHeight = $(window).height(); 
        }, 

        _scrollHandler: function( evt ) { 
            var scrollTop = $(window).scrollTop(); 
        }, 

        _mouseWheelHandler: function( evt ) { 
            if( !this.mouseWheelable ) return; 
            this.mouseWheelable = false; 

            setTimeout( function() {
                this.mouseWheelable = true; 
            }.bind(this), 1000 ); 
        }
    });

    return Contact;
});