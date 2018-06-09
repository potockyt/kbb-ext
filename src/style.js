var Style = function (document) {
    this.document = document;
}

Style.prototype.addDefault = function () {
    var cssId = 'default_kbb_css';
    if (!this.document.getElementById(cssId)) {
         // default kbb.css
        var link = this.document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = browser.extension.getURL("resources/kbb.css");

        var head = this.document.getElementsByTagName('head')[0];
        head.appendChild(link);
    }
}

Style.prototype.addCustom = function(markColor0, markColor1) {
    var cssId = 'custom_kbb_css';
    if (this.document.getElementById(cssId)) {
        this.document.getElementById(cssId).remove();
    }

    var css = ".kbbMark circle { fill: #" + markColor0 + "; }";
    css += "\n.kbbMarkX circle { fill: #" + markColor1 + "; }";
    var style = this.document.createElement('style');
    style.type = 'text/css';
    style.id = cssId;
    style.appendChild(this.document.createTextNode(css));

    var head = this.document.getElementsByTagName('head')[0];
    head.appendChild(style);
}

Style.prototype.isVisible = function (node) {
    return window.getComputedStyle(node, null).getPropertyValue('display') != 'none'
        && window.getComputedStyle(node, null).getPropertyValue('visibility') != 'hidden';
}