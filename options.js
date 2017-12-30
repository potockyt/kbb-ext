const DEFAULT_MOD_KEY = "`";
const DEFAULT_SELECTION_DELAY = 1000;

function saveOptions(e) {
  e.preventDefault();

  // Validation
  var o_mod_key = document.querySelector("#mod_key").value;
  var o_selection_delay = document.querySelector("#selection_delay").value;
  if (!o_mod_key || 0 === o_mod_key.length) {
    o_mod_key = DEFAULT_MOD_KEY;
  }
  if (!o_selection_delay || o_selection_delay <= 0) {
    o_selection_delay = DEFAULT_SELECTION_DELAY;
  }

  // Store options
  browser.storage.local.set({
    mod_key: o_mod_key,
    selection_delay: o_selection_delay
  });
}

function restoreOptions() {

  function setCurrent(result) {
    document.querySelector("#mod_key").value = result.mod_key || DEFAULT_MOD_KEY;
    document.querySelector("#selection_delay").value = result.selection_delay || DEFAULT_SELECTION_DELAY;
  }

  function onError(error) {
    console.log(`kbb options error: ${error}`);
  }

  browser.storage.local.get().then(setCurrent, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#mod_key").onblur = saveOptions;
document.querySelector("#selection_delay").onblur = saveOptions;
