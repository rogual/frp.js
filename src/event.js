var _ = require('lodash');

var Event = module.exports = function(watch, unwatch) {
  return _.assign({
    watch: watch,
    bind: watch,
    unwatch: unwatch,
    unbind: unwatch
  }, Event.methods);
};

var Pipe = Event.pipe = function() {
  var watchers = [];

  var unwatch = function(cb) {
    _.pull(watchers, cb);
  };

  var watch = function(cb) {
    watchers.push(cb);
    return _.partial(unwatch, cb);
  };

  var event = Event(watch, unwatch);

  return _.assign({}, event, {
    fire: function(value) {
      watchers.forEach(function(watcher) {
        watcher(value);
      });
    },
    watch: watch,
    unwatch: unwatch,
    bind: watch,
    unbind: unwatch,
    event: event
  });
};

Event.identity = Pipe().event;

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

def('ref', function(event) {
  var pipe = Pipe();
  var unbind = event.bind(pipe.fire);

  return _.assign(pipe.event, {release: unbind});
});

def('transform', function(event, xform) {
  var pipe = Pipe();

  xform(pipe.fire);

  return pipe.event;
});

require('./common').init(def);
