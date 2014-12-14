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
    watch: event.watch,
    unwatch: event.unwatch,
    bind: function(cb) {
      if (!empty)
        cb(value);
      event.watch(cb);
    },
    unbind: event.unbind,
    event: event
  }, Signal.methods);

  Object.defineProperties(r, {
    empty: { get: function() { return empty; }},
    value: { get: function() { return value; }}
  });

  return r;
};

var Cell = Signal.cell = function(initial) {
  var ctrl = Event.pipe();
  var sig;

  if (arguments.length)
    sig = Signal.event(initial, ctrl.event);
  else
    sig = Signal.event(ctrl.event);

  var r = _.assign({}, sig, Signal.methods, {
    set: ctrl.fire,
    signal: sig,
    event: sig.event,
  });

  r.update = function(fn) {
    r.value = _.createCallback(fn)(r.value);
  };

  Object.defineProperties(r, {
    value: {
      get: function() { return sig.value; },
      set: function(value) { ctrl.fire(value); }
    },
    empty: {
      get: function() { return sig.empty; }
    }
  });

  return r;
};

Signal.constant = function(value) {
  return Signal.event(value, Event.identity);
};

Signal.combine = function(signals) {
  var cell;

  if (signals instanceof Array) {

    cell = Cell([]);

    _.forEach(signals, function(signal, index) {
      signal.bind(function(value) {

        cell.update(function(values) {
          var xs = values ? values.slice() : [];
          xs[index] = value;
          return xs;
        });

      });
    });
  }
  else {

    cell = Cell({});

    _.forEach(signals, function(signal, name) {
      signal.bind(function(value) {

        cell.update(function(values) {
          return _.assign({}, values, _.object([[name, value]]));
        });

      });
    });
  }
  return cell.signal;
};

Signal.join = function(signals) {
  var cell = Cell();

  if (signals instanceof Array) {
    _.forEach(signals, function(signal) {
      signal.bind(function() {
        if (!_.any(signals, 'empty'))
          cell.set(_.map(signals, 'value'));
      });
    });
  }
  else {
    _.forEach(signals, function(signal) {
      signal.bind(function() {
        if (!_.any(signals, 'empty'))
          cell.set(_.mapValues(signals, 'value'));
      });
    });
  }
  return cell.signal;
};

Signal.methods = {};

function def(name, impl) {
  Signal[name] = impl;
  Signal.methods[name] = function() {
    return impl.apply(null, [this].concat(_.toArray(arguments)));
  };
}

def('transform', function(event, xform) {
  var cell = Signal.cell();

  xform(cell.set);

  return cell.signal;
});

require('./common').init(def);
