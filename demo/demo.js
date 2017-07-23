var
  rules = {
    space: /\s+/,
    boolean: /(true|false)/,
    path: /[a-zA-Z](\w+)\.?([\w+\.]*)/,
    number: /-?\d+(\.\d+)?/,
    string: /(["'])(?:(?=(\\?))\2.)*?\1/,
    primitive: ':boolean|:number|:string|:path',
    ternary: [
      ':expression>left',
      ':space?', '?', ':space?',
      ':expression>true',
      ':space?', ':', ':space?',
      ':expression>false'
    ],
    encapsulation: and(
      '(', ':space?', ':expression', ':space?', ')'
    ),
    binaryExpression: [
      ':expression>left',
      ':space?',
      '+|-|*|/|<|<=|==|!=|=>|>>operator',
      ':space?',
      ':expression>right'
    ],
    expression: or(
      ':space',
      ':binaryExpression',
      ':ternary',
      ':encapsulation',
      ':primitive'
    )
  },
  actions = {
    boolean: function(env, bool) {
      return bool == 'true';
    },
    number: function(env, number) {
      var type = number.match(/\./) ? 'Float' : 'Int';
      return Number['parse' + type](number);
    },
    string: function(env, string) {
      return JSON.parse(string);
    },
    path: function(env, path) {
      var properties = path.split('.'), i, value;
      for (i = 0; i < properties.length; i++) {
        value = (value || env)[properties[i]];
      }
      return value;
    },
    ternary: function(env, ternary, captures) {
      return captures.left ? captures.true : captures.false;
    }
  },
  lexer = new reLexer(
    rules, 'expression'
  );

RegExp.prototype.toJSON = function() {
  return 'REGEX:' + this.toString() + ':REGEX';
};

function demonstrate(expression, env) {
  var
    replace = function(json) {
      if (json) {
        return json.replace(/"REGEX:(.*?):REGEX"/g, function(m, regex) {
          return regex.replace(/\\\\/g, '\\');
        });
      }
    },
    ast = JSON.stringify(lexer.tokenize(expression), null, 2),
    result = JSON.stringify(lexer.parse(expression, actions, env));

  if (ast) {
    ast = ast.replace(/\[\{/, '[\n  {')
             .replace(/\n/g, '<br>')
             .replace(/\s/g, '&nbsp;');
  }

  document.write('Expression:<pre>' + JSON.stringify(expression, null, 2) + '</pre>');
  document.write('Environment:<pre>' + JSON.stringify(env || {}) + '</pre>');
  document.write('AST:<pre>' + replace(ast) + '</pre>');
  document.write('Result:<pre>' + result + '</pre>');
  document.write('<br><br>');
};
