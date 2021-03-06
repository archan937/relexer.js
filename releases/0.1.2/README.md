# reLexer.js

A very simple Javascript lexer and parser.

## Installation

Just include relexer.js:

```html
<script src="path/to/relexer.js" type="text/javascript"></script>
```

**Note**: include `relexer.min.js` for the minified relexer.js library

## Live examples

Please visit [http://archan937.github.com/relexer.js](http://archan937.github.com/relexer.js) to try out `reLexer.js` yourself and see live examples.

### Testing reLexer.js with QUnit

The `reLexer.js` library is tested with [QUnit](http://qunitjs.com). Check out the test results at [https://archan937.github.io/relexer.js/test](https://archan937.github.io/relexer.js/test).

## Usage

### Basic concepts

To define your grammar you need to define the grammar `rules`. These rules will be used for **tokenizing** expressions into a concrete syntax tree / parse tree. You need to specify which rule is the `root rule` that reLexer will try to match first.

Once you have a parse tree, you are able to act on it using so called `actions` (the process of actually **parsing** expressions). Every action corresponds with a grammar rule.

An action is a function which receives information about captured values and it should return the evaluated value. Eventually you will get the result of the evaluated expression.

We will continue using the [demo page](https://archan937.github.io/relexer.js/#setup) as an example for the rest of this README.

### Tokenizing and parsing

To define a lexer use the `reLexer` constructor. Specify the rules and root rule.

```javascript
lexer = new reLexer(rules, '<root rule>');
```

Optionally, you can immediately define its actions as a third argument.

```javascript
lexer = new reLexer(rules, '<root rule>', actions);
```

Tokenizing an expression is as easy as follows.

```javascript
lexer.tokenize('"Company " + company.name');
```

To parse an expression, you need to specify the expression and an optional environment available during parsing. You can specify (or override) actions as a third argument.

```javascript
lexer.parse('"Company " + company.name', {company: {name: 'Engel Inc.'}}, actions);
```

### Grammar rules

As already said, your grammar is defined by its rules. They are bundled in an object of which the keys are the name of the rules and the values are `patterns` which is either one of the following:

* `regular expression` - Matching a portion of the tokenized or parsed expression
* `string` - Which is either a simple "static" string or a "grammar rule expression" (explained later)
* `array` - A set of regular expressions, static strings or grammar rule expressions of which one or all of the patterns should match to pass

#### Regular expressions

It is as straightforward as you expect it to be. The `number` grammar rule used on the demo page for instance is as follows:

```javascript
number: /-?\d+(\.\d+)?/,
```

#### Grammar rule expressions

Grammar rule expressions consists of the following:

1. `pattern` - Which refers to another rule or either one of a set of possible rules
2. `name` - Resulting in a "named capture" for actions (**optional**)
3. `lazy marker` - Indicating whether or not the capture should be evaluated immediately or only when accessing the capture value (**optional**)
4. `optional marker` - Indicating whether or not the capture is optional and thus is not necessarily required (**optional**)

To refer to another rule within a `pattern`, use the name of the rule prefixed with `:` (colon). So grammar rule `boolean` becomes `:boolean` for instance.

Grammar rule `primitive` matches either `boolean`, `number`, `string` or `path`. Please notice that you need to separate the rules with a `|` (pipe).

```javascript
primitive: ':boolean|:number|:string|:path',
```

You can give a pattern a name (resulting in a named capture) by postfixing the pattern with a `>` (greater than) following by the name. As an example, the `binaryExpression` rule defines the named capture `left` which implies to *"match an expression and name it 'left'"*.

```javascript
binaryExpression: [
  ':expression>left',
```

To mark a capture as lazy, postfix the pattern with an `&` (ampersand). Looking at the `ternary` grammar rule, it marks the `true` and `false` capture as lazy which implies to *"match an expression and name it 'true' and only evaluate the capture when accessing it"*.

```javascript
ternary: [
  ':expression>statement',
  ':space?', '?', ':space?',
  ':expression>true&',
  ':space?', ':', ':space?',
  ':expression>false&'
```

And of course, the optional marker `?` (question mark) implies that the pattern / rule is optional (it does not necessarily have to be matched to pass). For instance, `:space?` which implies to *"match a space but it is not required"*.

#### Arrays

To imply that a rule only passes when an expression matches a set of successive patterns, put them in an array. The `encapsulation` grammar rule is a good example:

```javascript
encapsulation: [
  '(', ':space?', ':expression>expression&', ':space?', ')'
],
```

Aside from using a grammar rule expression containing rules delimited with a `|` (pipe), you can also use the `or()` (also defined as `reLexer.or()`) to imply that a rule passes when an expression matches either one of the set of rules.

```javascript
logicalOperator: or(
  '&&',
  '||'
),
```

#### Precedence

The order of matching grammar rules can be very important. Not only is the actual order of the rules with an array decisive, you can also provide the precedence for certain grammar rules.

To do so, just add `/` (slash) followed by a number (the precedence) at the end of a grammar rule expression.

```javascript
expression: or(
  ':encapsulation',
  ':ternaryExpression/1',
  ':logicalExpression/2',
  ':comparisonExpression/3',
  ':addSubtractExpression/4',
  ':multiplyDivideExpression/5',
  ':primitive'
)
```

### Defining actions

Like grammar rules, actions are defined in a simple object of which the keys are names of corresponding grammar rules and the values are functions which return values based on (optionally named) captures.

The action function will be invoked with the following arguments:

1. `env` - An object containing variables available during parsing (the second argument passed to `lexer.parse()`)
2. `captures` - Depending on the rule, a string or an object containing named captures, and either lazy or eagerly evaluated also dependending on the rule
3. `match` - Information about the match made for the grammar rule (also contain captures by the way)

#### Unnamed captures

For the `boolean` grammar rule, the conditions are as follows:

- The first argument (`env`) is not important for use so we will just ignore it
- The second argument (`captures`) on the other hand is the **captured string portion** of the parsed expression which is based on the boolean grammar rule (`/(true|false)/`). It is either `'true'` or `'false'`. So the value it should return is quite simple: the capture has to equal `'true'` and otherwise it should return `false`

```javascript
boolean: function (env, bool) {
  return bool == 'true';
},
```

#### Named captures

Looking at the action for the `binaryExpression` grammar rule, the `captures` argument is an object instead of simple string because the grammar rule defines three named captures:

1. `left` - which is the result of an evaluated `:expression` grammar rule
2. `operator` - which is either `'&&'`, `'||'`, `'+'`, `'-'`, `'*'`, `'/'`, et cetera
3. `right` - which is also the result of an evaluated `:expression` grammar rule

Based on the captured `operator`, the action should apply the actual binary operation. The function should look something like:

```javascript
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
  // et cetera ...
  }
},
```

#### Lazy captures

Until now we only dealt with captures which contain a string portion of the expression or the result of an evaluated grammar rule action. But it is also possible to have so called **lazy captures** which make it possible to only evaluate the captured grammar rule on access.

This is perfect for the `ternary` grammar rule as you only want to evaluate either the `true` or `false` capture based on the result of the `statement` capture. So whether it is either truthy or falsy.

And conveniently, as a developer, you do not have to think whether the capture is lazy or not because you access the result of the lazy capture the same way as you would access a "non-lazy" capture. Nice huh?

```javascript
ternary: function(env, captures) {
  return captures.statement ? captures.true : captures.false;
},
```

#### Environment dependent captures

Finally, you have captures of which the resulting value depends on the environment available during parsing. An example is the `path` grammar rule action because besides requiring the path it should also use the environment which contains the value.

```javascript
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
```

### Why not give reLexer.js a try?

Hopefully, reLexer.js can help you out with your lexer / parser problems. It is meant to be easy and clear in its use. Best of luck! ;)

### Contact me

For support, remarks and requests, please mail me at [pm_engel@icloud.com](mailto:pm_engel@icloud.com).

### License

Copyright (c) 2017 Paul Engel, released under the MIT license

[http://github.com/archan937](http://github.com/archan937) - [http://twitter.com/archan937](http://twitter.com/archan937) - [pm_engel@icloud.com](mailto:pm_engel@icloud.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
