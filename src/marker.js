// User configuration
var _mod = new Mod();
var _modState = new ModState();
var _position = new Position(document.compatMode === 'CSS1Compat'); // standard/quirks mode
var _style = new Style(document);

_style.addDefault();

browser.storage.local.get().then(
  function (result) {
    _mod = new Mod(result.mod_key || Defaults.modKey,
      result.selection_delay || Defaults.selectionDelay
    );
    _style.addCustom(result.mark_color0 || Defaults.markStyle.bgColor0,
      result.mark_color1 || Defaults.markStyle.bgColor1)
  },
  function (error) { console.log(`kbb error: ${error}`) }
);

var getSvgNode = function (nodeName, attributes) {
  var n = document.createElementNS("http://www.w3.org/2000/svg", nodeName);
  for (var a in attributes) {
    n.setAttributeNS(null, a, attributes[a]);
  }
  return n;
}

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
        if (!_style.isVisible(node)) {
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

    el.setAttribute("kbbId", _modState.incMarkCount());

    // adds mark to page
    var top = pos.y - Defaults.markStyle.height / 2;
    var left = pos.x - Defaults.markStyle.width / 2;
    if (top < 0) top = 0;
    if (left < 0) left = 0;

    var mark = getSvgNode('circle', { cx: Defaults.markStyle.width / 2, cy: Defaults.markStyle.height / 2, r: Defaults.markStyle.width / 2 });
    var text = getSvgNode('text', { x: '50%', y: '50%', 'text-anchor': 'middle', dy: '.3em' });
    text.appendChild(document.createTextNode(Number(_modState.getMarkCount())));

    var svg = getSvgNode('svg', { width: 20, height: 20 });
    svg.setAttribute("kbbmId", _modState.getMarkCount());
    svg.classList.add('kbbMark');
    svg.style.top = top + 'px';
    svg.style.left = left + 'px';
    svg.appendChild(mark);
    svg.appendChild(text);
    document.body.appendChild(svg);
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
  var markId = _modState.getMarkId(event, _mod.getSelectionDelay());

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

  _modState.focusMark(document.querySelector('svg[kbbmId="' + markId + '"]'), 'kbbMarkX');

  // delay input focus in case the node ID > 9
  if (element.localName == 'input') {
    setTimeout(delayedInputFocus, _mod.getSelectionDelay(), element, markId);
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
