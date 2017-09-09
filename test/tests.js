var test = function(desc, func) {
  var assertions = [];

  func(function(expression, env) {
    var
      expected = (function() {
        for (var key in env) {
          eval('var ' + key + ' = env.' + key);
        }
        return (function() {
          var value;
          try {
            value = eval(expression);
          } catch(e) {}
          return value;
        })();
      })(env);
    assertions.push({
      desc: 'lexer.parse(' + JSON.stringify(expression) + (env ? ', ' + JSON.stringify(env).replace(/":/g, '": ') : '') + ')',
      expression: expression,
      env: env,
      expected: expected
    });
  });

  QUnit.test(desc, function(assert) {
    var i, assertion;
    for (i = 0; i < assertions.length; i++) {
      assertion = assertions[i];
      assert.strictEqual(
        lexer.parse(assertion.expression, assertion.env),
        assertion.expected,
        assertion.desc
      );
    }
  });
};

test('boolean', function(assert) {
  assert('true');
  assert('false');
});

test('number', function(assert) {
  assert('82');
  assert('1.8');
});

test('string', function(assert) {
  assert('"Paul Engel"');
});

test('object', function(assert) {
  assert('company.name');
  assert('company.name', {
    company: {
      name: 'Engel Inc.'
    }
  });
});

test('logical operator', function(assert) {
  assert('a || b', {
    a: 0,
    b: 2
  });
  assert('a || b', {
    a: 1,
    b: 2
  });
});

test('calculation', function(assert) {
  assert('19 + 82');
  assert('2 + 3 + 4');
  assert('(1 + 2) * 3');
  assert('1 + (2 * 3)');
  assert('1 + 2 * 3');
  assert('2 * 3 + 1');
  assert('1 + 2 * 3 + 1');
  assert('2 * 3 + 1 + 4');
  assert('(1 + 2 * 3)');
  assert('1 + (1 - 2) + 3');
});

test('ternary statement', function(assert) {
  assert('1 < 2 ? "Yes" : "No"');
  assert('1 > 2 ? "Yes" : "No"');
  assert('count >= 5 ? "Limit exceeded" : "You have " + (5 - count) + " credits left"', {
    count: 3
  });
  assert('count >= 5 ? "Limit exceeded" : "You have " + (5 - count) + " credits left"', {
    count: 5
  });
});
