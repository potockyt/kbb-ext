// User configuration
var _mod = new Mod();
var _selectionDelay = Defaults.selectionDelay;
var _modState = new ModState();
var _position = new Position(document.compatMode === 'CSS1Compat'); // standard/quirks mode

browser.storage.local.get().then(
  function (result) {
    _mod = new Mod(result.mod_key);
    _selectionDelay = result.selection_delay || Defaults.selectionDelay;
  },
  function (error) { console.log(`kbb error: ${error}`) }
);

/**
 * add addon styles to page
 */
(function () {
  var cssId = 'kbbCss';
  if (!document.getElementById(cssId)) {
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = browser.extension.getURL("resources/kbb.css");
    link.media = 'all';
    head.appendChild(link);
  }
})();

/**
 * get style property of element
 *
 * @param element
 * @param property
 */
var getStyleProp = function (element, property) {
  return window.getComputedStyle(element, null).getPropertyValue(property);
};

/**
 * marks links and forms
 */
var markLinks = function () {
  var linkIter = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: function (node) {
        // TODO nodes with onclick attribute?
        if (getStyleProp(node, "display") == 'none'
          || getStyleProp(node, "visibility") == 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.localName == 'a' || node.localName == 'form') {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }, false);


  var el;
  while ((el = linkIter.nextNode())) {
    // mark first input of any form that is not hidden or submit
    if (el.localName == 'form') {
      var list = el.querySelectorAll('input');
      for (var entry of list.entries()) {
        var firstInput = entry.find(function (node) {
          return node instanceof Node && node.getAttribute("type") != 'hidden' && node.getAttribute("type") != 'submit'
        });
        if (firstInput !== undefined) {
          el = firstInput;
          break;
        }
      }
    }
    var pos = _position.get(el);

    // mark only visible links
    if (_position.isBeyondClient(pos, document)) {
      break;
    }

    if (!_position.isVisible(pos, document)) {
      continue;
    }

    _modState.incMarkCount();

    // adds mark to page
    var mark = document.createElement('div');
    el.setAttribute("kbbId", _modState.getMarkCount());
    mark.setAttribute("kbbmId", _modState.getMarkCount());
    mark.className = 'kbbMark';
    var top = pos.y - Defaults.markerBg.height / 2;
    var left = pos.x - Defaults.markerBg.width / 2;
    if (top < 0) top = 0;
    if (left < 0) left = 0;
    mark.style.cssText = [
      'top: ', top, 'px;',
      'left: ', left, 'px;',
      'width: ', Defaults.markerBg.width, 'px;',
      'height: ', Defaults.markerBg.height, 'px;',
      'line-height: ', Defaults.markerBg.height, 'px;'
    ].join("");

    mark.innerHTML = Number(_modState.getMarkCount());
    document.body.appendChild(mark);
  }
};

/**
 * unmarks links
 */
var unmarkLinks = function () {
  var kbbIter = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (node) {
        if (node.getAttribute("kbbId") != null || node.getAttribute("kbbmId") != null) {
          return NodeFilter.FILTER_ACCEPT
        }
        return NodeFilter.FILTER_REJECT;
      }
    }, false);

  var el;
  while ((el = kbbIter.nextNode())) {
    if (el.getAttribute("kbbId") != null) { // remove kbbId attribute from elements
      el.removeAttribute("kbbId");
    } else if (el.getAttribute("kbbmId") != null) { // remove marker element
      el.parentElement.removeChild(el);
    }
  }
};

var switchMod = function () {
  if (_mod.isEnabled()) {
    unmarkLinks();
    _modState = new ModState();
    _mod.switchOff();
  } else {
    markLinks();
    _mod.switchOn();
  }
}


var focusElement = function (event) {
  var markId = _modState.getMarkId(event);

  var element = document.querySelector('[kbbId="' + markId + '"]');
  if (element == null) {
    return;
  }

  var delayedInputFocus = function (inputElement, id) {
    if (typeof inputElement.focus === 'function' && markId == id) {
      inputElement.focus();
      unmarkLinks();
      _modState = new ModState();
      _mod.switchOff();
    }
  }

  _modState.focusMark(document.querySelector('div[kbbmId="' + markId + '"]'), 'kbbMarkX');

  // delay input focus in case the node ID > 9
  if (element.localName == 'input') {
    setTimeout(delayedInputFocus, _selectionDelay, element, markId);
  } else {
    element.focus();
  }
}



document.addEventListener("keyup", function (event) {
  const contentEditable = event.target.getAttribute('contenteditable');
  const formElements = ['input', 'textarea', 'select'];
  const isFormElement = formElements.indexOf(event.target.tagName.toLowerCase()) != -1;
  if (contentEditable || isFormElement) {
    return;
  }

  if (_mod.isEnabled() && !_mod.isModKey(event)) {
    focusElement(event)
    return
  }

  if (_mod.isModKey(event)) {
    switchMod();
    return;
  }
}, false);

document.addEventListener("scroll", function (event) {
  _position.setScroll(event.pageX, event.pageY);
  // TODO update fixed marks
}, false);
