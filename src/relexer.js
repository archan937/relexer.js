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

reLexer = function(rules, root, defaultActions) {

  root || (root = Object.keys(rules).pop());

  var
    expression,
    actions,
    env,
    busy,
    patterns,

  matchPattern = function(pattern) {
    if (typeof(pattern) == 'string')
      pattern = new RegExp(pattern.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

    var
      match = expression.match(pattern);

    if (match && match.index == 0) {
      expression = expression.slice(match[0].length);
      return match[0];
    }
  },

  matchString = function(patternOrString, lazyParent) {
    var
      segments = patternOrString.match(/(.+?)(>(\w+))?(&)?(\?)?$/) || [],
      pattern = segments[1],
      name = segments[3],
      lazy = lazyParent || !!segments[4],
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
    array._conj_ || (array._conj_ = 'and');

    var
      initialExpression = expression,
      conjunction = array._conj_,
      i, pattern, identifier, match, matches = [];

    for (i = 0; i < array.length; i++) {
      pattern = array[i];
      identifier = expression + ' -> ' + pattern;

      if (busy.indexOf(identifier) == -1) {
        busy.push(identifier);
        match = matchExpression(pattern, null, lazy);
        busy.splice(busy.indexOf(identifier), 1);

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
      initialExpression = expression,
      isRootMatch = !ruleOrPattern,
      rule = ruleOrPattern || root,
      pattern = rules[rule],
      action = actions && actions[rule],
      match,
      parse;

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
      match = matchString(pattern, lazy);
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
          parse = function() {
            return action(env, this.captures, this);
          }.bind(match);
          match = lazy ? parse : parse();
        }
      }

      if (env && name) {
        match = [name, match];
        match._named_ = true;
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

    if (pattern._conj_)
      specs.conjunction = pattern._conj_;

    if (env && (match.constructor == Array)) {
      for (var i = 0; i < match.length; i++) {
        capture = match[i];
        if (capture && capture._named_) {
          object[capture[0]] = capture[1];
        }
      }
    }

    specs.captures = Object.keys(object).length ? newProxy(object) : match;

    return specs;
  },

  newProxy = function(captures) {
    return new Proxy(captures, {
      get: function(object, key) {
        var value = object[key];
        return (value && value.constructor == Function) ? value() : value;
      }
    });
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
      actions = definedActions || defaultActions;
      env = environment;
      busy ? busy.splice(0) : (busy = []);
      patterns ? patterns.splice(0) : (patterns = []);
      return scan();
    }
  };

  this.tokenize = function(expression) {
    return lex(expression);
  };

  this.parse = function(expression, env, actions) {
    return lex(expression, actions, env || {});
  };

};

or = reLexer.or = function() {
  var array = [].slice.call(arguments);
  array._conj_ = 'or';
  return array;
};

}
