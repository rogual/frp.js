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

  test('multimap', function() {
    var ctrl = Pipe();

    var r = [];

    ctrl.multimap(function(value, emit) {

      for (var i=0; i<value.times; i++)
        emit(value.value);

    }).bind(r.push.bind(r));

    ctrl.fire({value: 62, times: 3});
    ctrl.fire({value: 98, times: 0});
    ctrl.fire({value: 14, times: 1});

    assert.deepEqual(r, [62, 62, 62, 14]);

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

  test('exclude', function() {
    var ctrl = Pipe();
    var event = ctrl.event;

    var odds = event.exclude(function(x) { return x % 2 === 0; });

    var r = [];
    odds.watch(r.push.bind(r));

    assert.deepEqual(r, []);
    ctrl.fire(1);
    assert.deepEqual(r, [1]);
    ctrl.fire(2);
    assert.deepEqual(r, [1]);
    ctrl.fire(3);
    assert.deepEqual(r, [1, 3]);
    ctrl.fire(4);
    assert.deepEqual(r, [1, 3]);

    r = [];
    var falsy = event.exclude();
    falsy.watch(r.push.bind(r));

    ctrl.fire(3);
    assert.deepEqual(r, []);
    ctrl.fire(0);
    assert.deepEqual(r, [0]);

    r = [];
    var notGood = event.exclude({alignment: 'good'});
    notGood.watch(r.push.bind(r));

    ctrl.fire({name: 'Jenny', alignment: 'evil'});
    ctrl.fire({name: 'Bruce', alignment: 'good'});
    ctrl.fire({name: 'Boz', alignment: 'wonky'});
    assert.deepEqual(r, [
      {name: 'Jenny', alignment: 'evil'},
      {name: 'Boz', alignment: 'wonky'}
    ]);
  });

  test('fold', function() {
    var ctrl = Pipe();
    var event = ctrl.event;

    var initial = 1000;
    var op = function(a, b) { return a + b; };

    var items = [
      function() { return event.fold(initial, op); },
      function() { return Event.fold(event, initial, op); }
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

  test('reduce', function() {
    var ctrl = Pipe();
    var sig = ctrl.event;

    var out = sig.reduce(function(a, b) { return a + b; });

    var values = [];
    out.watch(values.push.bind(values));

    ctrl.fire(500);
    assert.deepEqual(values, []);

    ctrl.fire(30);
    assert.deepEqual(values, [530]);

    ctrl.fire(7);
    assert.deepEqual(values, [530, 537]);
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

  test('ref', function() {
    var ctrl = Pipe();
    var e = ctrl.event;

    var r = e.ref();

    var xs = [];
    r.map(function(x) { return x + 100; }).watch(xs.push.bind(xs));

    ctrl.fire(1);
    ctrl.fire(2);
    r.release();
    ctrl.fire(3);

    assert.deepEqual(xs, [101, 102]);
  });

  test('sum', function() {
    var a = Pipe();
    var q = a.sum();

    var r = [];
    q.map(r.push.bind(r));

    a.fire(1);
    a.fire(2);
    a.fire(4);

    assert.deepEqual(r, [1, 3, 7]);
  });

  test('product', function() {
    var a = Pipe();
    var q = a.product();

    var r = [];
    q.map(r.push.bind(r));

    a.fire(1);
    a.fire(2);
    a.fire(4);

    assert.deepEqual(r, [1, 2, 8]);
  });

  test('sync', function() {
    var a = Pipe();
    var b = Pipe();
    var q = a.sync(b);

    var r = [];
    q.watch(r.push.bind(r));

    a.fire(1);
    a.fire(2);
    a.fire(3);

    assert.deepEqual(r, []);

    b.fire('spoons');

    assert.deepEqual(r, [1, 2, 3]);

    b.fire('knives');

    assert.deepEqual(r, [1, 2, 3]);

    a.fire(4);
    a.fire(5);
    a.fire(6);

    assert.deepEqual(r, [1, 2, 3]);

    b.fire('forks');

    assert.deepEqual(r, [1, 2, 3, 4, 5, 6]);
  });

});
