var _ = require('lodash');

var Event = module.exports = function(watch) {
  return _.assign({watch: watch}, Event.methods);
};

var Pipe = Event.pipe = function() {
  var Event = require('./Event');
  var watchers = [];

  var event = Event(watchers.push.bind(watchers));

  var watch = watchers.push.bind(watchers);

  return _.assign({}, event, {
    fire: function(value) {
      watchers.forEach(function(watcher) {
        watcher(value);
      });
    },
    watch: watch,
    bind: watch,
    event: event
  });
};

Event.identity = Pipe().event;

Event.dom = function(element, eventName) {
  var pipe = Pipe();
  element.addEventListener(eventName, pipe.fire);
  return pipe.event;
};

Event.combine = function(events) {
  var pipe = Pipe();
  events.forEach(function(event) {
    event.watch(pipe.fire);
  });
  return pipe.event;
};

Event.methods = {};

function def(name, impl) {
  Event[name] = impl;
  Event.methods[name] = function() {
    return impl.apply(null, [this].concat(_.toArray(arguments)));
  };
}

def('map', function(event, fn) {
  var pipe = Pipe();
  event.watch(function(value) {
    pipe.fire(fn(value));
  });
  return pipe.event;
});

def('filter', function(event, fn) {
  var pipe = Pipe();
  fn = fn || _.identity;
  event.watch(function(value) {
    if (fn(value))
      pipe.fire(value);
  });
  return pipe.event;
});

def('reduce', function(event, initial, fn) {
  var pipe = Pipe();
  var value = initial;
  event.watch(function(newValue) {
    value = fn(value, newValue);
    pipe.fire(value);
  });
  return pipe.event;
});

def('flatMap', function(event, fn) {
  var pipe = Pipe();
  event.watch(function(value) {
    fn(value).watch(pipe.fire);
  });
  return pipe.event;
});
