var _ = require('lodash');

var methods = {};

function def(name, impl) {
  methods[name] = impl;
}

def('map', function(functor, fn) {
  return functor.transform(function(emit) {
    fn = _.createCallback(fn);

    return functor.bind(function(value) {
      emit(fn(value));
    });
  });
});

def('reduce', function(functor, initial, fn) {
  return functor.transform(function(emit) {
    var value = initial;
    return functor.bind(function(newValue) {
      value = fn(value, newValue);
      emit(value);
    });
  });
});

def('filter', function(functor, fn) {
  return functor.transform(function(emit) {
    fn = _.createCallback(fn);

    return functor.bind(function(value) {
      if (fn(value))
        emit(value);
    });
  });
});

def('unique', function(functor, eq) {
  return functor.transform(function(emit) {
    eq = eq || function(a, b) { return a === b; };
    var last = [];
    return functor.bind(function(value) {
      if (last.length === 0 || !eq(last[0], value)) {
        last[0] = value;
        emit(value);
      }
    });
  });
});

def('debounce', function(functor, msec) {
  return functor.transform(function(emit) {
    return functor.bind(_.debounce(emit, msec));
  });
});

exports.init = function(def) {
  _.forEach(methods, function(impl, name) {
    def(name, impl);
  });
};
