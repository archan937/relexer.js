# reLexer.js

A very simple Javascript lexer and parser.

## Installation

Just include relexer.js:

    <script src="path/to/relexer.js" type="text/javascript"></script>

**Note**: include `relexer.min.js` for the minified relexer.js library

## Live examples

Please visit [http://archan937.github.com/relexer.js](http://archan937.github.com/relexer.js) to see live examples.

## Usage

### Basic concepts

To define your grammar you need to define the `rules`. These rules will be used for **tokenizing** expressions into a concrete syntax tree / parse tree. You need to specify which rule is the `root rule` that reLexer will try to match first.

Once you have a parse tree, you are able to act on it using so called `actions` (the process of actually **parsing** expressions). Every action corresponds with a grammar rule.

An action is a function which receives information about captured values and it should return the evaluated value. Eventually you will get the result of the evaluated expression.

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

...

### Defining actions

...

### Contact me

For support, remarks and requests, please mail me at [pm_engel@icloud.com](mailto:pm_engel@icloud.com).

### License

Copyright (c) 2017 Paul Engel, released under the MIT license

[http://github.com/archan937](http://github.com/archan937) - [http://twitter.com/archan937](http://twitter.com/archan937) - [pm_engel@icloud.com](mailto:pm_engel@icloud.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
