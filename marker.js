// User configuration
var MOD_KEY = "`";
var SELECTION_DELAY = 1000;

browser.storage.local.get().then(
  function(result) {
    MOD_KEY =  result.mod_key || "`";
    SELECTION_DELAY =  result.selection_delay || 1000;
  },
  function(error) { console.log(`kbb error: ${error}`) }
);

var _markerBg = {
		url: browser.extension.getURL("resources/marker_bg.png"),
		urlX: browser.extension.getURL("resources/marker_bg_x.png"),
		width : 20,
		height : 20
	};


/**
 * add addon styles to page
 */
var addStyles = function() {
	var css = ".kbbMark { position: absolute; color: #fff; background: url(" + _markerBg.url + ");"
			+ " font-size: 11px; text-align: center; z-index:9999; }"
			+ "\n.kbbMarkX { background: url(" + _markerBg.urlX + ") };";
	var style = document.createElement('style');
	style.type = 'text/css';
	style.appendChild(document.createTextNode(css));
	document.head.appendChild(style);
};

/**
 * get style property of element
 * 
 * @param element
 * @param property
 */
var getStyleProp = function(element, property) {
	return window.getComputedStyle(element, null).getPropertyValue(property);
};

/**
 * get element position
 * 
 * @param el
 */
var getPosition = function(el) {
	var xPos = 0;
	var yPos = 0;

	while (el) {
		xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
		yPos += (el.offsetTop - el.scrollTop + el.clientTop);
		el = el.offsetParent;
	}
	return {
		x : xPos,
		y : yPos
	};
};

/**
 * marks links and forms
 */
var markLinks = function() {
	var linkIter = document.createNodeIterator(
			document.body,
			NodeFilter.SHOW_ELEMENT,
			{
				acceptNode : function(node) {
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
				var firstInput = entry.find(function(node) { 
						return node instanceof Node && node.getAttribute("type") != 'hidden' && node.getAttribute("type") != 'submit'
					});
				if (firstInput !== undefined) {
					el = firstInput;
					break;
				}
			}
		} 
		
		var pos = getPosition(el);
		// mark only visible links
		if (pos.y != 0 
				&& pos.y > document.documentElement.scrollTop 
				&& pos.y < document.documentElement.scrollTop + document.documentElement.clientHeight) {
			_markCount++;
			
			var mark = document.createElement('div');
			el.setAttribute("kbbId", _markCount);
			mark.setAttribute("kbbmId", _markCount);
			mark.className = 'kbbMark';
			mark.style.cssText = [ 'top: ', pos.y - _markerBg.height/2 , 'px;', 'left: ',
					pos.x - _markerBg.width/2, 'px;', 'width: ', _markerBg.width, 'px;',
					'height: ', _markerBg.height, 'px;', 'line-height: ',
					_markerBg.height, 'px;' ].join("");

			mark.innerHTML = Number(_markCount);
			document.body.appendChild(mark);
		}
	}
};

/**
 * unmarks links
 */
var unmarkLinks = function() {
	var kbbIter = document.createNodeIterator(document.body,
			NodeFilter.SHOW_ELEMENT, {
				acceptNode : function(node) {
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



var _markCount = 0;
var _prevEventTimeStamp = 0;
var _selectedId = "";
var _prevSelectedMark = null;
var _isMod = false;

var resetGlobalState = function() {
	_markCount = 0;
	_prevEventTimeStamp = 0;
	_selectedId = "";
	_prevSelectedMark = null;
};

/**
 * mod keypress
 * 
 * @param event
 * @returns
 */
document.addEventListener("keypress", function(event) {
	if (event.key != MOD_KEY) {
		return;
	}
	
	const contentEditable = event.target.getAttribute('contenteditable');
	const formElements = ['input', 'textarea', 'select'];
	const isFormElement = formElements.indexOf(event.target.tagName.toLowerCase()) != -1;
	if (contentEditable || isFormElement) {
	    return;
	}

	if (_isMod) {
		unmarkLinks();
		resetGlobalState();
		_isMod = false;
	} else {
		markLinks();
		_isMod = true;
	}
}, false);


/**
 * delayed focus of input element
 * 
 * @param inputElement
 * @param id - a selected node ID when timer was scheduled
 */
var delayedInputFocus = function(inputElement, id) {
	 if (typeof inputElement.focus === 'function' && _selectedId == id) {
		 inputElement.focus();
		 unmarkLinks();
		 resetGlobalState();
		 _isMod = false;
	 }
}

/**
 * link number keypress
 * 
 * @param event
 * @returns
 */
document.addEventListener("keypress", function(event) {
	if (!_isMod || event.key == MOD_KEY) {
		return;
	}
	
	if (event.timeStamp - _prevEventTimeStamp > SELECTION_DELAY || _markCount < 10) {
		_prevEventTimeStamp = event.timeStamp;
		_selectedId = event.key;
	} else {
		_selectedId += event.key;
	}
	
	var element = document.querySelector('[kbbId="' + _selectedId + '"]');
	if (element == null) {
		return;
	}

	// delay input focus in case the node ID > 9
	if (element.localName == 'input') {
		setTimeout(delayedInputFocus, SELECTION_DELAY, element, _selectedId);
	} else {
		element.focus();		
	}


	if (_prevSelectedMark!=null) {
		_prevSelectedMark.className = 'kbbMark';
	}
	_prevSelectedMark = document.querySelector('div[kbbmId="' + _selectedId + '"]');
	_prevSelectedMark.className = 'kbbMark kbbMarkX';
	
	
}, false);

addStyles();
