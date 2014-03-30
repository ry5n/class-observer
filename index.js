/*jshint multistr:true */

(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['which-transition-end', 'bind'], factory);
  }
  else if (typeof exports === 'object') {
    module.exports = factory( require('which-transition-end'), require('bind') );
  }
  else {
    global.ClassObserver = factory(global.whichTransitionEnd, global.bind);
  }
}(this, function(whichTransitionEnd, bind) {

  // style writing
  var transitionend = whichTransitionEnd();

  function getBeaconStyle(prop, classAttr) {
    var template,
        classSelector;

    // Convert the class
    // classSelector = '.' + classAttr.replace(/\s+/g, '.');

    template = '\
      .js-assist-transition {\
        -webkit-transition: -webkit-' + prop + ' 1ms;\
        -moz-transition: -moz-' + prop + ' 1ms;\
        -o-transition: -o-' + prop + ' 1ms;\
        transition: ' + prop + ' 1ms;\
      }\
      .js-assist-transition:not([class="' + classAttr + '"]) {\
        ' + prop + ': hsla(0, 0%, 100%, 0);\
      }\
    ';

    return template;
  }

  /**
   * Constructor
   */

  function ClassObserver(el, beaconProp) {
    this.el = el,
    this.oldClass = '',
    this.currentClass = '',
    this.beaconProp = beaconProp || 'outline-color',
    this.beaconStyle = document.getElementsByTagName('head')[0].appendChild(document.createElement('style'));

    this.update();

    this.el.addEventListener( transitionend, bind(this.onChange, this) );

    // Testing
    this.el.addEventListener( 'classChanged', function(event) {
      console.log('oldClass:', event.detail.oldClass);
      console.log('curClass:', event.detail.currentClass);
    });
  }

  ClassObserver.prototype.update = function() {
    this.oldClass = this.currentClass;
    this.currentClass = this.el.getAttribute('class');
    this.beaconStyle.innerHTML = getBeaconStyle(this.beaconProp, this.currentClass);
  };

  ClassObserver.prototype.onChange = function(event) {
    // Leave some extra time, just in case.
    if (event.propertyName === this.beaconProp && event.elapsedTime < 0.005) {
      this.update();

      var classChanged = new CustomEvent('classChanged', {
        'detail': {
          'oldClass': this.oldClass,
          'currentClass': this.currentClass
        }
      });

      this.el.dispatchEvent(classChanged);
    }
  };

  /**
   * Exports
   */

  return ClassObserver;
}));
