var _ = require('lodash');
var Event = require('./event');

var Signal = module.exports = {};

Signal.event = function(initial, event) {
  var value = initial;
  event.watch(function(newValue) { value = newValue; });
  return _.assign({
    get: function() { return value; },
    watch: function(cb) {
      event.watch(cb);
    },
    bind: function(cb) {
      cb(value);
      event.watch(cb);
    },
    event: event
  }, Signal.methods);
};

Signal.cell = function(initial) {
  var ctrl = Event.pipe();
  var sig = Signal.event(initial, ctrl.event);

  return _.assign({}, sig, Signal.methods, {
    set: ctrl.fire,
    signal: sig,
    event: sig.event
  });
};


Signal.constant = function(value) {
  return Signal.event(value, Event.identity);
};

Signal.methods = {};

function def(name, impl) {
  Signal[name] = impl;
  Signal.methods[name] = function() {
    return impl.apply(null, [this].concat(_.toArray(arguments)));
  };
}

def('map', function(sig, fn) {
  return Signal.event(
    fn(sig.get()),
    Event.map(sig, fn)
  );
});

def('reduce', function(sig, fn) {
  var initial = sig.get();

  return Signal.event(
    initial,
    Event.reduce(sig, initial, fn)
  );
});
