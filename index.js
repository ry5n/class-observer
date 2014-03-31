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
   * Render stylesheet that will trigger an event when the specified element’s
   * class attribute changes.
   *
   * The CSS specifies two style rules: the first on the element sets a dummy
   * transition on the provided propery with a near-zero duration. The second
   * sets a different value for the provided property for any value of the class
   * attribute other than its current value. Hence, a transitionend even will
   * be fired on the element whenever the class changes.
   *
   * @param {Number}  id
   *   Id of the target instance
   *
   * @param {Object}  config
   *   Beacon config object with the following keys:
   *   - property: the CSS property to transition
   *   - from: the initial value
   *   - to: the final value
   *
   * @param {String}  currentClass
   *   The current value of the observed element’s class attriute
   *
   * @return {String}
   *   Rendered beacon stylesheet
   */

  function renderBeacon(id, config, currentClass) {
    var prop = config.property,
        from = config.from,
        to = config.to,
        template = '\
          [data-class-observee="' + id + '"] {\
            ' + prop + ': ' + from + ';\
            -webkit-transition: ' + prop + ' 1ms;\
            -moz-transition: ' + prop + ' 1ms;\
            -o-transition: ' + prop + ' 1ms;\
            transition: ' + prop + ' 1ms;\
          }\
          [data-class-observee="' + id + '"]:not([class="' + currentClass + '"]) {\
            ' + prop + ': ' + to + ';\
          }\
        ';

    return template;
  }

  /**
   * Create a ClassObserver instance that watches for changes to an element’s
   * class attribute.
   *
   * @param {Element}  el
   *   Element to observe for class changes
   *
   * @param {Object}  beaconConfig
   *   Configuration for the observer’s internal beacon stylesheet, with the
   *   following keys:
   *   - property: the CSS property to transition
   *   - from: the initial value
   *   - to: the final value
   */

  function ClassObserver(el, beaconConfig) {
    this.el = el,
    this.oldClass = '',
    this.currentClass = '',
    this.id = newInstanceId(),
    this.beaconConfig = beaconConfig || {
      property: 'outline-color',
      from: '#fff',
      to: '#000'
    },
    this.beacon = document.getElementsByTagName('head')[0].appendChild(document.createElement('style'));

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

    this.beacon.innerHTML = renderBeacon(this.id, this.beaconConfig, this.currentClass);
  };

  /**
   * Handle a change to el’s class attribute.
   */

  ClassObserver.prototype.onChange = function(event) {

    if (
      event.propertyName === this.beaconConfig.property &&
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
