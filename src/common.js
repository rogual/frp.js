var _ = require('lodash');

var methods = {};

function def(name, impl) {
  methods[name] = impl;
}

def('map', function(functor, fn) {
  return functor.transform(function(emit) {
    fn = _.callback(fn);

    functor.bind(function(value) {
      emit(fn(value));
    });
  });
});


def('sync', function(functor, gate) {
  return functor.transform(function(emit) {

    var queue = [];

    functor.bind(function(x) {
      queue.push(x);
    });

    gate.watch(function() {
      var vals = queue;
      queue = [];
      vals.forEach(emit);
    });

  });
});


def('reduce', function(functor, fn) {
  return functor.transform(function(emit) {
    var last = [];
    functor.bind(function(newValue) {
      if (last.length) {
        var value = last[0] = fn(last[0], newValue);
        emit(value);
      }
      else {
        last[0] = newValue;
      }
    });
  });
});

def('filter', function(functor, fn) {
  return functor.transform(function(emit) {
    fn = _.callback(fn);

    functor.bind(function(value) {
      if (fn(value))
        emit(value);
    });
  });
});

def('unique', function(functor, eq) {
  return functor.transform(function(emit) {
    eq = eq || function(a, b) { return a === b; };
    var last = [];
    functor.bind(function(value) {
      if (last.length === 0 || !eq(last[0], value)) {
        last[0] = value;
        emit(value);
      }
    });
  });
});

def('debounce', function(functor, msec) {
  return functor.transform(function(emit) {
    functor.bind(_.debounce(emit, msec));
  });
});

def('sum', function(functor) {
  return functor.fold(0, function(a, b) { return a + b; });
});

def('product', function(functor) {
  return functor.fold(1, function(a, b) { return a * b; });
});

exports.init = function(def) {
  _.forEach(methods, function(impl, name) {
    def(name, impl);
  });
};
