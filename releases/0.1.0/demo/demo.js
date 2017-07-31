var
  rules = {
    space: /\s+/,
    path: /[a-zA-Z](\w*)\.?([\w+\.]+)?/,
    string: /(["'])(?:(?=(\\?))\2.)*?\1/,
    number: /-?\d+(\.\d+)?/,
    boolean: /(true|false)/,
    primitive: ':boolean|:number|:string|:path',
    operator: or(
      '&&',
      '||',
      '+',
      '-',
      '*',
      '/',
      '<',
      '<=',
      '==',
      '!=',
      '>=',
      '>'
    ),
    encapsulation: [
      '(', ':space?', ':expression>expression&', ':space?', ')'
    ],
    ternary: [
      ':expression>statement',
      ':space?', '?', ':space?',
      ':expression>true&',
      ':space?', ':', ':space?',
      ':expression>false&'
    ],
    binaryExpression: [
      ':expression>left',
      ':space?',
      ':operator>operator',
      ':space?',
      ':expression>right'
    ],
    expression: or(
      ':binaryExpression',
      ':ternary',
      ':encapsulation',
      ':primitive'
    )
  },
  actions = {
    path: function(env, path) {
      var properties = path.split('.'), i, value;
      for (i = 0; i < properties.length; i++) {
        value = (value || env)[properties[i]];
      }
      return value;
    },
    string: function(env, string) {
      return JSON.parse(string);
    },
    number: function(env, number) {
      var type = number.match(/\./) ? 'Float' : 'Int';
      return Number['parse' + type](number);
    },
    boolean: function(env, bool) {
      return bool == 'true';
    },
    encapsulation: function(env, captures) {
      return captures.expression;
    },
    ternary: function(env, captures) {
      return captures.statement ? captures.true : captures.false;
    },
    binaryExpression: function(env, captures) {
      var
        left = captures.left,
        operator = captures.operator,
        right = captures.right;

      switch(operator) {
      case '&&':
        return left && right;
      case '||':
        return left || right;
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '*':
        return left * right;
      case '/':
        return left / right;
      case '<':
        return left < right;
      case '<=':
        return left <= right;
      case '==':
        return left == right;
      case '!=':
        return left != right;
      case '>':
        return left > right;
      case '>=':
        return left >= right;
      }
    }
  },
  lexer = new reLexer(rules, 'expression', actions);

RegExp.prototype.toJSON = function() {
  return 'REGEX:' + this.toString() + ':REGEX';
};

Function.prototype.toJSON = function() {
  return 'FUNC:' + this.toString() + ':FUNC';
};

function correctJSON(json) {
  if (json) {
    return json.replace(/\[\{/, '[\n  {')
               .replace(/\n/g, '<br>')
               .replace(/\s/g, '&nbsp;')
               .replace(/"REGEX:(.*?):REGEX"/g, function(m, regex) {
                 return regex.replace(/\\\\/g, '\\');
               })
               .replace(/"FUNC:(.*?):FUNC"/g, function(m, func) {
                 return func.replace(/\\\\/g, '\\')
                            .replace(/\\n(&nbsp;&nbsp;)?/g, '<br>');
               });
  }
}

function demonstrate(expression, env) {
  var
    result = JSON.stringify(lexer.parse(expression, env)),
    parse_tree = correctJSON(JSON.stringify(lexer.tokenize(expression), null, 2));

  expression = JSON.stringify(expression, null, 2);
  env = JSON.stringify(env || {})
            .replace(/":/g, '": ')
            .replace(/,"/g, ', "');

  document.write('<strong># Expression</strong><pre>' + expression + '</pre>');
  document.write('# Environment<pre>' + env + '</pre>');
  document.write('# Result<pre>' + result + '</pre>');
  document.write('# Parse tree<pre>' + parse_tree + '</pre>');
};
