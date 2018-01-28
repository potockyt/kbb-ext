var Mod = function (modKey) {
  this.modKey = modKey || Defaults.modKey;
  this.isMod = false;
}

Mod.prototype.isModKey = function (event) {
  return this.modKey.ctrlKey === event.ctrlKey
    && this.modKey.altKey === event.altKey
    && this.modKey.shiftKey === event.shiftKey
    && this.modKey.key === event.which
}

Mod.prototype.switchOn = function () {
  this.isMod = true;
}
Mod.prototype.switchOff = function () {
  this.isMod = false;
}

Mod.prototype.isEnabled = function () {
  return this.isMod;
}



var ModState = function () {
  this.markCount = 0;
  this.prevEventTimeStamp = 0;
  this.markId = "";
  this.selectedMark = null;
}

ModState.prototype.incMarkCount = function () {
  this.markCount++;
}

ModState.prototype.getMarkCount = function () {
  return this.markCount;
}

ModState.prototype.getMarkId = function (event) {
  if (event.timeStamp - this.prevEventTimeStamp > _selectionDelay || this.markCount < 10) {
    this.prevEventTimeStamp = event.timeStamp;
    this.markId = event.key;
  } else {
    this.markId += event.key;
  }
  return this.markId;
}

ModState.prototype.focusMark = function (elem, selectedMarkClass) {
  if (this.selectedMark != null) {
    this.selectedMark.classList.remove(selectedMarkClass);
  }

  this.selectedMark = elem;
  // If these classes already exist in attribute of the element, then they are ignored.
  this.selectedMark.classList.add(selectedMarkClass);
}



var Position = function (standardMode) {
  this.scrollX = 0;
  this.scrollY = 0;
  this.standardMode = standardMode;
}

Position.prototype.setScroll = function (scrollX, scrollY) {
  this.scrollX = scrollX;
  this.scrollY = scrollY;
}

Position.prototype.getScroll = function () {
  return { scrollX: this.scrollX, scrollY: this.scrollY };
}

Position.prototype.isVisible = function (pos, doc) {
  return pos.y > 0
    && pos.y > (this.standardMode ? doc.documentElement.scrollTop : this.scrollY)
    && pos.y < (this.standardMode ? doc.documentElement.scrollTop + doc.documentElement.clientHeight : this.scrollY + doc.scrollingElement.clientHeight);
}

Position.prototype.isBeyondClient = function (pos, doc) {
  return pos.y > (this.standardMode ? doc.documentElement.scrollTop + doc.documentElement.clientHeight : this.scrollY + doc.scrollingElement.clientHeight);
}

Position.prototype.get = function (el) {
  var xPos = this.standardMode ? 0 : this.scrollX;
  var yPos = this.standardMode ? 0 : this.scrollY;

  var isFixed = false;
  
  while (el) {
    if (!isFixed) {
      isFixed = 'fixed' === window.getComputedStyle(el, null).getPropertyValue('position');
      if (isFixed && 'auto' !== window.getComputedStyle(el, null).getPropertyValue('top')) {
        yPos += this.scrollY;
      }
      if (isFixed && 'auto' !== window.getComputedStyle(el, null).getPropertyValue('left')) {
        xPos += this.scrollX;
      }
    }

    xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
    yPos += (el.offsetTop - el.scrollTop + el.clientTop);
    el = el.offsetParent;
  }
  
  return {
    x: xPos,
    y: yPos
  };
}