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
    parsed,
    result = JSON.stringify(parsed = lexer.parse(expression, env)),
    parse_tree = correctJSON(JSON.stringify(lexer.tokenize(expression), null, 2)),
    correct = (function() {
      for (var key in env) {
        eval('var ' + key + ' = env.' + key);
      }
      return (function() {
        var value;
        try {
          value = eval(expression);
        } catch(e) {}
        return value == parsed;
      })();
    })(env);

  expression = JSON.stringify(expression, null, 2);
  env = JSON.stringify(env || {})
            .replace(/":/g, '": ')
            .replace(/,"/g, ', "');

  document.write('<strong class="' + (correct ? 'green' : 'red') + '"># Expression</strong><pre>' + expression + '</pre>');
  document.write('# Environment<pre>' + env + '</pre>');
  document.write('# Result<pre>' + result + '</pre>');
  document.write('# Parse tree<pre>' + parse_tree + '</pre>');
};
