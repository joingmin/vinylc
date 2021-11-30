$.fn.buildCommonUI = function() {
    // $('body').buildCommonUI()로 호출하면 해당요소 안에 있는
    // 아래에 기술된 모듈들이 한번에 빌드된다.(자주 쓰이는 UI모듈은 이렇게 하는게 효율적이다)
    vcui.require(['ui/accordion', 'ui/dropdown', 'ui/tab'], function() {
        // dropdown은 호출안해도 됨

        this.find('.ui_accordion').vcAccordion();
        this.find('.ui_tab').vcTab();
        this.find('.ui_dropdown').vcDropdown();
    }.bind(this));
    return this;
};
