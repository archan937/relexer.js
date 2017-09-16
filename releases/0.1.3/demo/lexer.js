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
    conditionalExpression: [
      ':expression>expression&',
      ':space?', 'if|unless>operator', ':space?',
      ':expression>statement'
    ],
    encapsulation: [
      '(', ':space?', ':expression>expression&', ':space?', ')'
    ],
    expression: or(
      ':encapsulation',
      ':conditionalExpression/1',
      ':ternaryExpression/2',
      ':logicalExpression/3',
      ':comparisonExpression/4',
      ':addSubtractExpression/5',
      ':multiplyDivideExpression/6',
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
      var
        properties = path.split('.'),
        value = env,
        i, p;

      for (i = 0; i < properties.length; i++) {
        p = properties[i];
        if (value && value.hasOwnProperty(p))
          value = value[p];
        else
          return;
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
    multiplyDivideExpression: function(env, captures) {
      return binaryExpression(env, captures);
    },
    addSubtractExpression: function(env, captures) {
      return binaryExpression(env, captures);
    },
    comparisonExpression: function(env, captures) {
      return binaryExpression(env, captures);
    },
    logicalExpression: function(env, captures) {
      return binaryExpression(env, captures);
    },
    ternaryExpression: function(env, captures) {
      return captures.statement ? captures.true : captures.false;
    },
    conditionalExpression: function(env, captures) {
      var bool = captures.statement;
      if (captures.operator == 'unless')
        bool = !bool;
      if (bool)
        return captures.expression;
    },
    encapsulation: function(env, captures) {
      return captures.expression;
    }
  },
  lexer = new reLexer(rules, 'expression', actions);
