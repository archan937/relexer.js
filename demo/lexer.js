var
  rules = {
    space: /\s+/,
    path: /[a-zA-Z](\w*)\.?([\w+\.]+)?/,
    string: /(["'])(?:(?=(\\?))\2.)*?\1/,
    number: /-?\d+(\.\d+)?/,
    boolean: /(true|false)/,
    primitive: ':boolean|:number|:string|:path',
    multiplyDivideExpression: [
      ':expression>left',
      ':space?',
      '*|/>operator',
      ':space?',
      ':expression>right'
    ],
    addSubtractExpression: [
      ':expression>left',
      ':space?',
      '+|->operator',
      ':space?',
      ':expression>right'
    ],
    comparisonExpression: [
      ':expression>left',
      ':space?',
      '<|<=|==|!=|>=|>>operator',
      ':space?',
      ':expression>right'
    ],
    logicalOperator: or(
      '&&',
      '||'
    ),
    logicalExpression: [
      ':expression>left',
      ':space?',
      ':logicalOperator>operator',
      ':space?',
      ':expression>right'
    ],
    ternaryExpression: [
      ':expression>statement',
      ':space?', '?', ':space?',
      ':expression>true&',
      ':space?', ':', ':space?',
      ':expression>false&'
    ],
    encapsulation: [
      '(', ':space?', ':expression>expression&', ':space?', ')'
    ],
    expression: or(
      ':encapsulation',
      ':ternaryExpression/1',
      ':logicalExpression/2',
      ':comparisonExpression/3',
      ':addSubtractExpression/4',
      ':multiplyDivideExpression/5',
      ':primitive'
    )
  },
  binaryExpression = function(env, captures) {
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
    ternaryExpression: function(env, captures) {
      return captures.statement ? captures.true : captures.false;
    },
    logicalExpression: function(env, captures) {
      return binaryExpression(env, captures);
    },
    comparisonExpression: function(env, captures) {
      return binaryExpression(env, captures);
    },
    multiplyDivideExpression: function(env, captures) {
      return binaryExpression(env, captures);
    },
    addSubtractExpression: function(env, captures) {
      return binaryExpression(env, captures);
    },
    encapsulation: function(env, captures) {
      return captures.expression;
    }
  },
  lexer = new reLexer(rules, 'expression', actions);
