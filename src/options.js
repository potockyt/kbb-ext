var Options = function (doc) {
  this.doc = doc;
  this.modKeyElem = doc.querySelector("#mod_key");
  this.selectionDelayElem = doc.querySelector("#selection_delay");
  this.markColor0Elem = doc.querySelector("#mark_color0");
  this.markColor1Elem = doc.querySelector("#mark_color1");

  this.modKey = Defaults.modKey;
  this.selectionDelay = Defaults.selectionDelay;
  this.markColor0 = Defaults.markStyle.bgColor0;
  this.markColor1 = Defaults.markStyle.bgColor1;

  var self = this;
  this.modKeyElem.onclick = function(e) { self.modKeyElemOnClick(e) };
  this.selectionDelayElem.onblur = function(e) { self.save(e) };
  this.markColor0Elem.onblur = function(e) { self.save(e); self.preview(); };
  this.markColor1Elem.onblur = function(e) { self.save(e); self.preview(); };
}

Options.prototype.saveShortcut = function (ctrlKey, altKey, shiftKey, key) {
  var shortcut = { ctrlKey: ctrlKey, altKey: altKey, shiftKey: shiftKey, key: key };
  browser.storage.local.set({
    mod_key: shortcut
  });
}

Options.prototype.save = function (e) {
  e.preventDefault();

  // Validation
  var selectionDelay = this.selectionDelayElem.value;
  if (!selectionDelay || isNaN(parseFloat(selectionDelay)) || !isFinite(selectionDelay) || selectionDelay <= 0) {
    selectionDelay = this.selectionDelay;
    this.selectionDelayElem.value = this.selectionDelay;
  }
  var markColor0 = this.markColor0Elem.value;
  if (!markColor0 || !markColor0.match("^[0-9a-f]{6}$")) {
     markColor0 = this.markColor0;
     this.markColor0Elem.value = this.markColor0;
  }

  var markColor1 = this.markColor1Elem.value;
  if (!markColor1 || !markColor1.match("^[0-9a-f]{6}$")) {
    markColor1 = this.markColor1;
    this.markColor1Elem.value = this.markColor1;
  }

  // Store options
  browser.storage.local.set({
    selection_delay: selectionDelay,
    mark_color0 : markColor0,
    mark_color1 : markColor1
  });

  this.selectionDelay = selectionDelay;
  this.markColor0 = markColor0;
  this.markColor1 = markColor1;
}

Options.prototype.restore = function () {
  var self = this;

  function setCurrent(result) {
    self.modKey =  result.mod_key || Defaults.modKey;

    var shortcut = [];
    if (self.modKey.ctrlKey) shortcut.push("CTRL");
    if (self.modKey.altKey) shortcut.push("ALT");
    if (self.modKey.shiftKey) shortcut.push("SHIFT");
    shortcut.push(KEY_CODE_MAPPING[self.modKey.key]);
    self.modKeyElem.value = shortcut.join("+");

    self.selectionDelay = result.selection_delay || Defaults.selectionDelay;
    self.markColor0 = result.mark_color0 || Defaults.markStyle.bgColor0;
    self.markColor1 = result.mark_color1 || Defaults.markStyle.bgColor1;

    self.selectionDelayElem.value = self.selectionDelay;
    self.markColor0Elem.value = self.markColor0;
    self.markColor1Elem.value = self.markColor1;

    self.preview();
  }

  function onError(error) {
    console.log(`kbb options error: ${error}`);
  }

  browser.storage.local.get().then(setCurrent, onError);
}

Options.prototype.modKeyElemOnClick = function () {
  this.modKeyElem.value = "press key combination";

  self = this;
  this.doc.addEventListener("keyup", function keyUpListener(event) {
    event.preventDefault();
    // if last keyup was shift, ctrl or alt then skip
    if (event.which == 16 || event.which == 17 || event.which == 18) {
      return;
    }

    var shortcut = [];
    if (event.ctrlKey) shortcut.push("CTRL");
    if (event.altKey) shortcut.push("ALT");
    if (event.shiftKey) shortcut.push("SHIFT");
    shortcut.push(KEY_CODE_MAPPING[event.which]);
    self.modKeyElem.value = shortcut.join("+");
    self.doc.removeEventListener("keyup", keyUpListener, true);
    self.saveShortcut(event.ctrlKey, event.altKey, event.shiftKey, event.which);
  }, true);
}

Options.prototype.preview = function() {
  this.doc.querySelector("#mark_color0_preview").style.fill = "#" + this.markColor0;
  this.doc.querySelector("#mark_color1_preview").style.fill = "#" + this.markColor1;
}

var _options = new Options(document);
document.addEventListener("DOMContentLoaded", _options.restore());

const KEY_CODE_MAPPING = {
  8: "Backspace",
  9: "Tab",
  13: "Enter",
  16: "Shift",
  17: "Ctrl",
  18: "Alt",
  19: "Pause/Break",
  20: "Caps Lock",
  27: "Escape",
  32: "Space",
  33: "PgUp",
  34: "PgDn",
  35: "End",
  36: "Home",
  37: "Left",
  38: "Up",
  39: "Right",
  40: "Down",
  45: "Insert",
  46: "Delete",
  91: "WinLeft",
  92: "WinRight",
  93: "SelectKey)",
  96: "NumPad 0",
  97: "NumPad 1",
  98: "NumPad 2",
  99: "NumPad 3",
  100: "NumPad 4",
  101: "NumPad 5",
  102: "NumPad 6",
  103: "NumPad 7",
  104: "NumPad 8",
  105: "NumPad 9",
  106: "NumPad *",
  107: "NumPad +",
  109: "NumPad -",
  110: "NumPad .",
  111: "NumPad /",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  186: ";",
  187: "=",
  188: ",",
  189: "-",
  190: ".",
  191: "/",
  192: "`",
  219: "[",
  220: "\\",
  221: "]",
  222: "'",
};
