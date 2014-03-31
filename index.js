/*jshint multistr:true */

(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define([
      'which-transition-end',
      'bind',
      'custom-event'
    ], factory);
  }
  else if (typeof exports === 'object') {
    module.exports = factory(
      require('which-transition-end'),
      require('bind'),
      require('custom-event')
    );
  }
  else {
    global.ClassObserver = factory(
      global.whichTransitionEnd,
      global.bind,
      global.CustomEvent
    );
  }
}(this, function(whichTransitionEnd, bind, CustomEvent) {

  var transitionend = whichTransitionEnd(),
      instanceCount = 0;

  /**
   * Get an unused instance id number.
   *
   * @return {Number} instance id
   */

  function newInstanceId() {
    return ++instanceCount;
  }

  /**
   * Build a unique stylesheet for an observed element’s current state.
   *
   * The CSS specifies two style rules: the first on the element sets a dummy
   * transition on the provided propery with a near-zero duration. The second
   * sets a different value for the provided property for any value of the class
   * attribute other than its current value. Hence, a transitionend even will
   * be fired on the element whenever the class changes.
   *
   * @param  {[type]} id        [description]
   * @param  {[type]} prop      [description]
   * @param  {[type]} classAttr [description]
   * @return {[type]}           [description]
   */

  function getBeaconStyle(id, prop, classAttr) {
    var template = '\
      [data-class-observee="' + id + '"] {\
        -webkit-transition: ' + prop + ' 1ms;\
        -moz-transition: ' + prop + ' 1ms;\
        -o-transition: ' + prop + ' 1ms;\
        transition: ' + prop + ' 1ms;\
      }\
      [data-class-observee="' + id + '"]:not([class="' + classAttr + '"]) {\
        ' + prop + ': hsla(0, 0%, 100%, 0);\
      }\
    ';

    return template;
  }

  /**
   * Create a ClassObserver instance that watches for changes to an element’s
   * class attribute.
   *
   * @param {Element} el          Element to observe for class changes
   * @param {String}  beaconProp  CSS property to use
   */

  function ClassObserver(el, beaconProp) {
    this.el = el,
    this.oldClass = '',
    this.currentClass = '',
    this.id = newInstanceId(),
    this.beaconProp = beaconProp || 'outline-color',
    this.beaconStyle = document.getElementsByTagName('head')[0].appendChild(document.createElement('style'));

    this.el.setAttribute('data-class-observee', this.id);
    this.el.addEventListener( transitionend, bind(this.onChange, this) );

    this.update();
  }

  /**
   * Update internal state:
   * - Track previous and current class attribute values;
   * - Update the current observer’s beacon stylesheet to match the new state.
   */

  ClassObserver.prototype.update = function() {
    this.oldClass = this.currentClass;

    if ( this.el.getAttribute('class') === null ) {
      this.el.setAttribute('class', '');
    }

    this.currentClass = this.el.getAttribute('class');

    this.beaconStyle.innerHTML = getBeaconStyle(this.id, this.beaconProp, this.currentClass);
  };

  /**
   * Handle a change to el’s class attribute.
   */

  ClassObserver.prototype.onChange = function(event) {

    if (
      event.propertyName === this.beaconProp &&
      event.elapsedTime < 0.005 // Leave some extra time, just in case.
    ) {
      this.update();

      // Check that the class value actually changed before dispatching. Avoids
      // duplicate dispatches when restoring a missing class attribute.

      if (this.currentClass !== this.oldClass) {
        var classChanged = new CustomEvent('classChanged', {'detail': {
          'observeeId': this.id,
          'oldClass': this.oldClass,
          'currentClass': this.currentClass
        }});

        this.el.dispatchEvent(classChanged);
      }
    }
  };

  /**
   * Exports
   */

  return ClassObserver;
}));
