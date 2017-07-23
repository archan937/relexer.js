if (typeof(reLexer) == 'undefined') {

// *
// * reLexer.js {version} (Uncompressed)
// * A very simple lexer and parser library written in Javascript.
// *
// * (c) {year} Paul Engel
// * reLexer.js is licensed under MIT license
// *
// * $Date: {date} $
// *

reLexer = function(rules, root) {
  rules || (rules = {});

  var
    busy = [],
    patterns = [],
    state,
    actions,
    env,

  defaultRoot = function() {
    return Object.keys(rules).pop();
  },

  matchPattern = function(expression, pattern) {
    if (typeof(pattern) == 'string')
      pattern = new RegExp(pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

    var
      match = expression.match(pattern);

    if (match && match.index == 0)
      return {match: match[0]};
  },

  matchString = function(expression, patternOrString) {
    var
      segments = patternOrString.match(/(.+?)(>(\w+))?(\?)?$/) || [],
      pattern = segments[1],
      name = segments[3],
      optional = !!segments[4],
      rule = ((pattern || '').match(/:(\w+)/) || [])[1],
      match;

    if (name || optional || (rule && rules[rule])) {
      if (pattern.match(/\|/)) {
        pattern = pattern.split('|');
        pattern.conjunction = 'or';
      } else {
        pattern = pattern.replace(':', '');
      }

      match = matchExpression(expression, pattern);

      if (match) {
        if (name) {
          match.captures[name] = match.match;
        }
      } else if (optional) {
        match = {match: ''};
      }

    } else {
      match = matchPattern(expression, patternOrString);
    }

    return match;
  },

  matchConjunction = function(expression, array) {
    var
      conjunction = array.conjunction || 'and',
      i, m, pattern, key, match, captures = {};

    for (i = 0; i < array.length; i++) {
      pattern = array[i];

      if (busy.indexOf(pattern) == -1) {

        busy.push(pattern);
        m = matchExpression(expression, pattern);
        busy.splice(busy.indexOf(pattern), 1);

        if (m) {
          expression = expression.substring(m.match.length);
          match = (match || '') + m.match;

          for (key in m.captures) {
            if (m.captures.hasOwnProperty(key))
              captures[key] = m.captures[key];
          }

          if (conjunction == 'or')
            break;

        } else if (conjunction == 'and') {
          return;
        }
      }
    }

    if (match) {
      return {match: match, captures: captures};
    }
  },

  matchExpression = function(expression, ruleOrPattern) {
    var
      required = arguments.length == 1,
      rule = ruleOrPattern || root || defaultRoot(),
      pattern = rules[rule],
      match,
      action;

    if (!pattern) {
      rule = undefined;
      pattern = ruleOrPattern;
    }

    patterns.push(expression + ' (#' + patterns.length + ') ' + pattern.toString());

    switch (pattern.constructor) {
    case RegExp:
      match = matchPattern(expression, pattern);
      break;
    case String:
      match = matchString(expression, pattern);
      break;
    case Array:
      match = matchConjunction(expression, pattern);
      break;
    }

    if (match && (!required || match.match.length || !expression.length)) {
      match.captures || (match.captures = {});

      if (actions) {
        if (action = actions[rule] || actions['*']) {
          state = action(env, match.match, match.captures);
        }
      } else {
        var spec = {
          rule: rule,
          pattern: pattern
        };
        if (pattern.conjunction)
          spec.conjunction = pattern.conjunction;
        spec.match = match.match;
        spec.captures = match.captures;
        state.push(spec);
      }

      return match;

    } else if (required) {
      throw 'Unable to match expression: ' + JSON.stringify(expression) + ' (rule: ' + rule + ')';
    }
  },

  scan = function(expression) {
    try {
      var
        match = matchExpression(expression),
        index;

      expression = expression.substring(match.match.length);
      if (!expression.length)
        return state;
      else
        return scan(expression);

    } catch(e) {
      index = e.message && e.message.match('Maximum call stack size exceeded') ? -30 : -15;
      console.error(e);
      console.error('Expressions backtrace:\n' + patterns.slice(index).reverse().join('\n'));
    }
  },

  lex = function(expression, definedActions, environment) {
    if (expression) {
      busy.splice(0);
      patterns.splice(0);
      state = definedActions ? undefined : [];
      actions = definedActions;
      env = environment;
      return scan(expression);
    }
  };

  this.root = function(name) {
    if (arguments.length)
      root = name;
    else
      return root || defaultRoot();
  };

  this.tokenize = function(expression) {
    return lex(expression);
  };

  this.parse = function(expression, actions, env) {
    return lex(expression, actions || {}, env || {});
  };

  this.and = reLexer.and;
  this.or = reLexer.or;
};

and = reLexer.and = function() {
  var array = Array.prototype.slice.call(arguments);
  array.conjunction = 'and';
  return array;
};

or = reLexer.or = function() {
  var array = Array.prototype.slice.call(arguments);
  array.conjunction = 'or';
  return array;
};

}
