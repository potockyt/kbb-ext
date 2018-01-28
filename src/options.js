
function saveShortcut(ctrlKey, altKey, shiftKey, key) {
  var shortcut = { ctrlKey: ctrlKey, altKey: altKey, shiftKey: shiftKey, key: key };
  browser.storage.local.set({
    mod_key: shortcut
  });
}

function saveOptions(e) {
  e.preventDefault();

  // Validation
  var selectionDelay = document.querySelector("#selection_delay").value;
  if (!selectionDelay || selectionDelay <= 0) {
    selectionDelay = Defaults.selectionDelay;
  }

  // Store options
  browser.storage.local.set({
    selection_delay: selectionDelay
  });
}

function restoreOptions() {

  function setCurrent(result) {
    var res = result.mod_key || Defaults.modKey;
    var shortcut = [];
    if (res.ctrlKey) shortcut.push("CTRL");
    if (res.altKey) shortcut.push("ALT");
    if (res.shiftKey) shortcut.push("SHIFT");
    shortcut.push(keyCodeMapping[res.key]);
    document.querySelector("#mod_key").value = shortcut.join("+");
    document.querySelector("#selection_delay").value = result.selection_delay || Defaults.selectionDelay;
  }

  function onError(error) {
    console.log(`kbb options error: ${error}`);
  }

  browser.storage.local.get().then(setCurrent, onError);
}

const MOD_KEY_ELEM = document.querySelector("#mod_key");

MOD_KEY_ELEM.onclick = function () {
  MOD_KEY_ELEM.value = "press key combination";

  document.addEventListener("keyup", function keyUpListener(event) {
    event.preventDefault();
    // if last keyup was shift, ctrl or alt then skip
    if (event.which == 16 || event.which == 17 || event.which == 18) {
      return;
    }

    var shortcut = [];
    if (event.ctrlKey) shortcut.push("CTRL");
    if (event.altKey) shortcut.push("ALT");
    if (event.shiftKey) shortcut.push("SHIFT");
    shortcut.push(keyCodeMapping[event.which]);
    MOD_KEY_ELEM.value = shortcut.join("+");
    document.removeEventListener("keyup", keyUpListener, true);
    saveShortcut(event.ctrlKey, event.altKey, event.shiftKey, event.which);
  }, true);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#selection_delay").onblur = saveOptions;


var keyCodeMapping = {
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
