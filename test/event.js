var _ = require('lodash');
var assert = require('assert');
var Event = require('../src/event');
var Pipe = require('../src/pipe');

suite('event', function() {

  test('watch', function() {
    var ctrl = Pipe();
    var fire = ctrl.fire;

    var a = [], b = [];
    ctrl.event.watch(a.push.bind(a));
    fire(1); fire(); fire(null); fire(""); fire("xyz");
    ctrl.event.watch(b.push.bind(b));
    fire([1, 2]); fire({}); fire({a: 'b'});

    assert.deepEqual(b, [[1, 2], {}, {a: 'b'}]);
    assert.deepEqual(a, [1, undefined, null, "", "xyz"].concat(b));
  });

  test('unwatch', function() {
    var ctrl = Pipe();
    var fire = ctrl.fire;

    var a = [];
    var cb = a.push.bind(a);

    ctrl.event.watch(cb);
    fire(1); fire(2);
    ctrl.event.unwatch(cb);
    fire(3); fire(4);
    ctrl.event.watch(cb);
    fire(5); fire(6);

    assert.deepEqual(a, [1, 2, 5, 6]);

  });

  test('concise unwatch', function() {
    var ctrl = Pipe();
    var fire = ctrl.fire;

    var a = [];
    var cb = a.push.bind(a);

    var unwatch = ctrl.event.watch(cb);
    fire(1); fire(2);
    unwatch();
    fire(3); fire(4);
    ctrl.event.watch(cb);
    fire(5); fire(6);

    assert.deepEqual(a, [1, 2, 5, 6]);
  });

  test('combine', function() {
    var ctrl1 = Pipe();
    var ctrl2 = Pipe();
    var out = Event.combine([ctrl1.event, ctrl2.event]);

    var values = [];
    out.watch(values.push.bind(values));

    ctrl1.fire(1); ctrl1.fire(2);
    ctrl2.fire(3); ctrl1.fire(4);
    ctrl2.fire(5); ctrl2.fire(6);

    assert.deepEqual(values, [1, 2, 3, 4, 5, 6]);
  });

  test('map', function() {
    var ctrl = Pipe();
    var event = ctrl.event;

    var add1 = function(a) { return a + 1; };

    [event.map(add1), Event.map(event, add1)].forEach(function(out) {
      var values = [];
      out.watch(values.push.bind(values));

      ctrl.fire(1);
      ctrl.fire(2);

      assert.deepEqual(values, [2, 3]);
    });

  });

  test('filter', function() {
    var ctrl = Pipe();
    var event = ctrl.event;

    var evens = event.filter(function(x) { return x % 2 === 0; });

    var r = [];
    evens.watch(r.push.bind(r));

    assert.deepEqual(r, []);
    ctrl.fire(1);
    assert.deepEqual(r, []);
    ctrl.fire(2);
    assert.deepEqual(r, [2]);
    ctrl.fire(3);
    assert.deepEqual(r, [2]);
    ctrl.fire(4);
    assert.deepEqual(r, [2, 4]);

    r = [];
    var truthy = event.filter();
    truthy.watch(r.push.bind(r));

    ctrl.fire(3);
    assert.deepEqual(r, [3]);
    ctrl.fire(0);
    assert.deepEqual(r, [3]);

    r = [];
    var good = event.filter({alignment: 'good'});
    good.watch(r.push.bind(r));

    ctrl.fire({name: 'Jenny', alignment: 'evil'});
    ctrl.fire({name: 'Bruce', alignment: 'good'});
    ctrl.fire({name: 'Boz', alignment: 'wonky'});
    assert.deepEqual(r, [{name: 'Bruce', alignment: 'good'}]);
  });

  test('reduce', function() {
    var ctrl = Pipe();
    var event = ctrl.event;

    var initial = 1000;
    var op = function(a, b) { return a + b; };

    var items = [
      function() { return event.reduce(initial, op); },
      function() { return Event.reduce(event, initial, op); }
    ];

    items.forEach(function(getOut) {

      var out = getOut();

      var values = [];
      out.watch(values.push.bind(values));

      ctrl.fire(500);
      ctrl.fire(30);
      ctrl.fire(7);

      assert.deepEqual(values, [1500, 1530, 1537]);
    });
  });

  test('flatMap', function() {
    var ctrl = Pipe();

    var a = Pipe(), b = Pipe();
    var things = {a: a, b: b};

    var r = [];
    ctrl.flatMap(function(name) {
      return things[name].event;
    }).watch(r.push.bind(r));

    assert.deepEqual(r, []);
    ctrl.fire('a');
    assert.deepEqual(r, []);
    a.fire(1);
    assert.deepEqual(r, [1]);
    ctrl.fire('b');
    assert.deepEqual(r, [1]);
    b.fire(2);
    assert.deepEqual(r, [1, 2]);
    a.fire(3);
    assert.deepEqual(r, [1, 2, 3]);

  });

  test('unique', function() {
    var ctrl = Pipe();
    var u = ctrl.unique();

    var r = [];
    u.bind(r.push.bind(r));

    var s = [];
    ctrl.bind(s.push.bind(s));

    assert.deepEqual(r, []);
    ctrl.fire(1);
    assert.deepEqual(r, [1]);
    ctrl.fire(1);
    assert.deepEqual(r, [1]);
    ctrl.fire(2);
    assert.deepEqual(r, [1, 2]);
    assert.deepEqual(s, [1, 1, 2]);
  });

  test('free', function() {
    var ctrl = Pipe();

    assert.equal(ctrl.countWatchers(), 0);

    var e2 = ctrl.event.map(function(x) { return x + 1; });

    assert.equal(ctrl.countWatchers(), 1);

    e2.free();

    assert.equal(ctrl.countWatchers(), 0);
  });

  test('free & unwatch', function() {
    var ctrl = Pipe();
    var e0 = ctrl.event;

    var e1 = e0.map(_.identity);

    var unwatch = e1.watch(_.noop);

    assert.equal(ctrl.countWatchers(), 1);

    unwatch();
    assert.equal(ctrl.countWatchers(), 0);

  });

  test('free & unwatch chain', function() {
    var ctrl = Pipe();
    var e0 = ctrl.event;

    var e1 = e0.map(_.identity);
    var e2 = e1.map(_.identity);

    var unwatch = e2.watch(_.noop);

    assert.equal(ctrl.countWatchers(), 1);

    unwatch();
    assert.equal(ctrl.countWatchers(), 0);
  });

  test('retain', function() {
    var ctrl = Pipe();
    var e0 = ctrl.event;

    var e1 = e0.map(_.identity).retain();

    var unwatch = e1.watch(_.noop);

    assert.equal(ctrl.countWatchers(), 1);
    unwatch();
    assert.equal(ctrl.countWatchers(), 1);

    e1.free();
    assert.equal(ctrl.countWatchers(), 0);
  });

});
