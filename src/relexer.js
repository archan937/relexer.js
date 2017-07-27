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
    actions,
    expression,
    env,
    busy,
    patterns,

  defaultRoot = function() {
    return Object.keys(rules).pop();
  },

  matchPattern = function(pattern) {
    if (typeof(pattern) == 'string')
      pattern = new RegExp(pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

    var
      match = expression.match(pattern);

    if (match && match.index == 0) {
      expression = expression.substring(match[0].length);
      return match[0];
    }
  },

  matchString = function(patternOrString) {
    var
      segments = patternOrString.match(/(.+?)(>(\w+))?(&)?(\?)?$/) || [],
      pattern = segments[1],
      name = segments[3],
      lazy = !!segments[4],
      optional = !!segments[5],
      rule = ((pattern || '').match(/:(\w+)/) || [])[1],
      match;

    if (name || optional || (rule && rules[rule])) {

      if (pattern.match(/\|/)) {
        pattern = reLexer.or.apply(null, pattern.split('|'));
      } else {
        pattern = pattern.replace(':', '');
      }

      match = matchExpression(pattern, name, lazy);

      if ((match == undefined) && optional) {
        match = '';
      }

    } else {
      match = matchPattern(patternOrString);
    }

    return match;
  },

  matchConjunction = function(array, lazy) {
    array.__conjunction__ || (array.__conjunction__ = 'and');

    var
      initialExpression = expression,
      conjunction = array.__conjunction__,
      i, pattern, match, matches = [];

    for (i = 0; i < array.length; i++) {
      pattern = array[i];

      if (busy.indexOf(pattern) == -1) {
        busy.push(pattern);
        match = matchExpression(pattern, null, lazy);
        busy.splice(busy.indexOf(pattern), 1);

        if (match != undefined) {
          if (conjunction == 'and') {
            matches.push(match);
          } else {
            return match;
          }
        } else if (conjunction == 'and') {
          expression = initialExpression;
          return;
        }
      }
    }

    if (matches.length)
      return matches;
  },

  matchExpression = function(ruleOrPattern, name, lazy) {
    var
      isRootMatch = arguments.length == 0,
      initialExpression = expression,
      rule = ruleOrPattern || root || defaultRoot(),
      pattern = rules[rule],
      action = actions && actions[rule],
      match,
      func;

    if (!pattern) {
      rule = undefined;
      pattern = ruleOrPattern;
    }

    patterns.push(expression + ' (#' + patterns.length + ') ' + pattern.toString());

    switch (pattern.constructor) {
    case RegExp:
      match = matchPattern(pattern);
      break;
    case String:
      match = matchString(pattern);
      break;
    case Array:
      match = matchConjunction(pattern, lazy);
      break;
    }

    if ((match != undefined) || (initialExpression != expression)) {
      if (rule || name) {
        if (!env || action)
          match = normalizeMatch(name, lazy, rule, pattern, match);
        if (env && action) {
          func = function() {
            return action(env, match.captures, match);
          };
          match = lazy ? func : func();
        }
      }

      if (env && name) {
        match = [name, match];
        match.__named__ = true;
      }

      return match;

    } else if (isRootMatch) {
      throw 'Unable to match expression: ' + JSON.stringify(expression) + ' (rule: ' + rule + ')';
    }
  },

  normalizeMatch = function(name, lazy, rule, pattern, match) {
    var
      specs = {},
      object = {},
      capture;

    if (name)
      specs.name = name;

    if (lazy)
      specs.lazy = lazy;

    if (rule)
      specs.rule = rule;

    specs.pattern = pattern;

    if (pattern.__conjunction__)
      specs.conjunction = pattern.__conjunction__;

    if (env && (match.constructor == Array)) {
      for (var i = 0; i < match.length; i++) {
        capture = match[i];
        if (capture && capture.__named__) {
          object[capture[0]] = capture[1];
        }
      }
    }

    specs.captures = Object.keys(object).length ? object : match;

    return specs;
  },

  scan = function() {
    var match, index;

    try {
      match = matchExpression();
      return expression.length ? scan() : match;

    } catch(e) {
      index = e.message && e.message.match('Maximum call stack size exceeded') ? -30 : -15;
      console.error(e);
      console.error('Expressions backtrace:\n' + patterns.slice(index).reverse().join('\n'));
    }
  },

  lex = function(lexExpression, definedActions, environment) {
    lexExpression = lexExpression.trim();
    if (lexExpression) {
      expression = lexExpression;
      actions = definedActions;
      env = environment;
      busy ? busy.splice(0) : (busy = []);
      patterns ? patterns.splice(0) : (patterns = []);
      return scan();
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
};

and = reLexer.and = function() {
  var array = Array.prototype.slice.call(arguments);
  array.__conjunction__ = 'and';
  return array;
};

or = reLexer.or = function() {
  var array = Array.prototype.slice.call(arguments);
  array.__conjunction__ = 'or';
  return array;
};

}
