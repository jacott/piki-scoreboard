var path = Npm.require('path');
var htmlparser = Npm.require("htmlparser2");

BartCompiler = {
  Error: function (message, point) {
    this.message = message;
    this.point = point;
  },
  toJavascript: function (code) {
    var template;
    var result = '';
    try {
      var parser = new htmlparser.Parser({
        onopentag: function(name, attrs){
          if (name === 'template') {
            name = attrs.name;
            if (! name)
              throw new BartCompiler.Error("Template name is missing", parser.startIndex);
            if (! name.match(/^[A-Z]\w*/))
              throw new BartCompiler.Error("Template name must start match the format: /^[A-Z]\w*/  " + name, parser.startIndex);
            template = new Template(template, attrs.name);

          } else {
            if (! template)
              throw new BartCompiler.Error("Out most element must be a template", parser.startIndex);

            template.addNode(name, code.slice(parser.startIndex+2+name.length, parser.endIndex));
          }
        },
        ontext: function(text){
          template.addText(text.replace(/^\s+/, ' ').replace(/\s+$/, ' '));
        },
        onclosetag: function(name){
          if (name === 'template') {
            if (template.parent)
              template = template.parent;
            else
              result += template.toString();
          } else {
            template.endNode();
          }
        }
      });
      parser.write(code);
      parser.end();
      return result;
    } catch (e) {
      throw e;
    }
  }
};


function Template(parent, name) {
  this.nested = [];
  this.name = name;
  this.nodes = {children: []};
  this.parent = parent;
  if (parent) parent.add(this);
}

Template.prototype = {
  constructor: Template,

  addNode: function (name, attrs) {
    attrs = extractAttrs(attrs);
    var newNodes = {name: name, attrs: attrs, children: [], parent: this.nodes};

    this.nodes.children.push(newNodes);

    this.nodes = newNodes;
  },

  addText: function (text) {
    if (text === '' || text === ' ' || text === '  ') return null;
    var nodes = extractBraces(text);
    if (typeof nodes === 'string')
      return this.nodes.children.push(text);

    var chn = this.nodes.children;
    nodes.forEach(function (node) {
      if (typeof node === 'string')
        node && chn.push(node);
      else node.forEach(function (elm) {
        elm && chn.push(elm);
      });
    });
  },

  endNode: function () {
    this.nodes = this.nodes.parent;
  },

  toString: function () {
    return "Bart.newTemplate(" + JSON.stringify(this.toHash()) + ");";
  },

  toHash: function () {
    var content = {name: this.name};
    if (this.nested.length)
      content.nested = this.nested.map(function (row) {
        return row.toHash();
      });

    if (this.nodes.children.length)
      content.nodes = this.nodes.children.map(function (node) {
        return nodeToHash(node);
      });

    return content;
  },

  fullName: function () {
    return (this.parent ? this.parent.fullName() : '') + "['" + this.name + "']";
  },

  add: function (child) {
    this.nested.push(child);
    return this;
  },
};

function nodeToHash(node) {
  if (typeof node === 'string' || node.shift)
    return node;

  var result =  {name: node.name, attrs: node.attrs};
  if (node.children.length)
    result.children = node.children.map(function (node) {
      return nodeToHash(node);
    });

  return result;
}

function extractBraces(text) {
  var parts = text.split('{{');
  if (parts.length === 1) return text;
  if (parts[0] === '') parts.shift();

  for(var i=0; i < parts.length; ++i) {
    var m = /(.*)}}(.*)/.exec(parts[i]);
    if (m) {
      parts[i] = [compileBraceExpr(m[1]), m[2]];
    }
  }

  return parts;
}

function compileBraceExpr(bexpr) {
  if (bexpr.match(/^[!#>\/]/)) {
    var result = [bexpr[0]];
    bexpr = bexpr.slice(1).trim();
  } else {
    var result = [''];
  }
  tokenizeWithQuotes(bexpr, result);
  return result;
}


function extractAttrs(attrs) {
  var tokens = [];
  var result = [];
  tokenizeWithQuotes(attrs, tokens);
  tokens.forEach(function (token) {
    if (typeof token === 'string') {
      result.push(justOne(extractBraces(token[0] === '"' ? token.slice(1) : token)));
    } else {
      token[2] = justOne(extractBraces(token[2][0] === '"' ? token[2].slice(1) : token[2]));
      result.push(token);
    }
  });

  return result;
}


function justOne(nodes) {
  if (typeof nodes === 'string') return nodes;

  for(var i=0; i < nodes.length; ++i) {
    var row = nodes[i];
    if (row) return row[0];
  }
}


function tokenizeWithQuotes(bexpr, result) {
  // split by quoted strings
  while(bexpr !== '') {
    var m = /^([^'"]*)(.*)$/.exec(bexpr);
    if (m) {
      tokenizeSansQuotes(m[1], result);
      bexpr = m[2];
      if (m[2].length === 0) break;
      var res = '"';
      if (bexpr[0] === '"') {
        var re = /^"([^\\"]*)(.)(.)?/;
      } else {
        var re = /^'([^\\']*)(.)(.)?/;
      }

      while(m=re.exec(bexpr)) {
        res += m[1];
        bexpr = bexpr.slice(m[0].length);
        if (m[3]) {
          if (m[2] !== '\\') {
            bexpr = bexpr+m[3];
            break;
          } else {
            res += m[3];
          }
        }
      }
      if (typeof result[result.length-1] !== 'string')
        result[result.length-1][2] = res;
      else
        result.push(res);
    } else
      return tokenizeSansQuotes(bexpr, result);
  }
}

function tokenizeSansQuotes(bexpr, result) {
  bexpr = bexpr.split(/[\s]+/);
  for(var i=0; i < bexpr.length; ++i) {
    bexpr[i].length > 0 && addToken(bexpr[i], result);
  }
}

function addToken(token, result) {
  var m = /^([^=]+)=(.*)$/.exec(token);
  if (m) {
    result.push(['=', m[1], m[2]]);
  } else {
    result.push(token);
  }
}
