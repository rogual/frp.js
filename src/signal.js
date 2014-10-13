var _ = require('lodash');
var Event = require('./event');

var Signal = module.exports = {};

/* event(initial, event)
   event(event) */
Signal.event = function() {
  var args = _.toArray(arguments);
  var event = args.pop();

  var initial;
  var empty;
  if (args.length) {
    initial = args[0];
    empty = false;
  }
  else {
    empty = true;
  }

  var value = initial;

  event.watch(function(newValue) { value = newValue; empty = false; });

  var r = _.assign({
    get: function() { return value; },
    watch: function(cb) {
      event.watch(cb);
    },
    bind: function(cb) {
      if (!empty)
        cb(value);
      event.watch(cb);
    },
    event: event
  }, Signal.methods);

  Object.defineProperties(r, {
    empty: { get: function() { return empty; }}
  });

  return r;
};

Signal.cell = function(initial) {
  var ctrl = Event.pipe();
  var sig;

  if (arguments.length)
    sig = Signal.event(initial, ctrl.event);
  else
    sig = Signal.event(ctrl.event);

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

def('filter', function(sig, fn) {
  var cell = Signal.cell();
  sig.bind(function(value) {
    if (fn(value))
      cell.set(value);
  });
  return cell.signal;
});

