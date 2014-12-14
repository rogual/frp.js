var _ = require('lodash');
var assert = require('assert');

var Event = module.exports = function(watch, unwatch) {
  return _.assign({
    watch: watch, 
    bind: watch,
    unwatch: unwatch,
    unbind: unwatch
  }, Event.methods);
};

var Pipe = Event.pipe = function() {
  var Event = require('./Event');
  var watchers = [];

  var unwatch = function(cb) {
    _.pull(watchers, cb);
  };

  var watch = function(cb) {
    watchers.push(cb);
    return _.partial(r.unwatch, cb);
  };

  var event = Event(watch, unwatch);

  var r = _.assign({}, event, {
    fire: function(value) {
      watchers.forEach(function(watcher) {
        watcher(value);
      });
    },
    watch: watch,
    unwatch: unwatch,
    bind: watch,
    unbind: unwatch,
    event: event,
    countWatchers: function() { return watchers.length; }
  });

  return r;
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

def('transform', function(event, xform) {
  var pipe = Pipe();

  var unbind = xform(pipe.fire);

  var r = pipe.event;

  var refs = 0;

  function update() {
    if (refs <= 0 && pipe.countWatchers() === 0) {
      (unbind || _.noop)();
    }
  }

  pipe.unwatch = _.compose(update, pipe.unwatch);
  pipe.unbind = _.compose(update, pipe.unbind);

  r.free = function() {
    refs -= 1;
    update();
    return r;
  };

  r.retain = function() {
    refs += 1;
    return r;
  };

  return r;
});

def('flatMap', function(event, fn) {
  var pipe = Pipe();
  fn = _.createCallback(fn);

  event.watch(function(value) {
    fn(value).watch(pipe.fire);
  });
  return pipe.event;
});

require('./common').init(def);
