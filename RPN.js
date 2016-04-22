/**
 * TODO
 * - More functions
 * - Large integers
 * - Fractions
 * - statusline (registerFlag('id', {0: '', 1: 'SHIFT'}))
 */
Element.addMethods({
  copyDimensions: function(element, template) {
    var templateSize = $(template).getDimensions();
    templateSize.height += "px";
    templateSize.width += "px";
    element.setStyle(templateSize);

    return element;
  }
});

Object.extend(Number.prototype, {
  isInteger: function() {
    return this % 1 === 0;
  }
});

var MathX = {
  add: function(x, y) { return x + y; },
  divide: function(x, y) { return x/y; },
  reciprocal: function(x) { return 1/x; },
  percentage: function(x, y) { return [x, 100*x/y]; },
  multiply: function(x, y) { return x*y; },
  subtract: function(x, y) { return x - y; },
  root: function(x, y) { return Math.pow(x, 1/x); },
  cuberoot: function(x, y) { return Math.pow(x, 1/3); },
  square: function(x) { return x * x; },
  cube: function(x) { return x * x * x; },
  exp10: function(x) { return Math.pow(10, x); },
  div: function(x, y) { return (x - x % y) / y; },
  mod: function(x, y) { return x % y; },
  frac: function(x) { return x % 1; },

  faculty: function(n) {
    if(n < 0 || ! n.isInteger())
      return Number.NaN;


    var result = 1;
    while(n > 1)
      result *= n--;

    return result;
  },

  binomial: function(n, k) {
    if(n < 0 || ! n.isInteger() || k < 0 || k > n || ! k.isInteger() )
      return Number.NaN;

    if( k > n - k)
      k = n - k;

    var result = 1;
    for(var i = 1; i <= k; i++) {
      result *= n - k + i;
      result /= i;
    }

    return result;
  }
};
$w("E LN10 LN2 LOG2E LOG10E PI SQRT1_2 SQRT2 random abs acos asin atan ceil cos exp floor log log10 round sin sqrt tan atan2 pow max min").each(function(key) { MathX[key] = Math[key]; });

var InputStack = Class.create({
  initialize: function(InputRegister) {
    this.InputRegister = InputRegister;
    this.stack = new Array();
    this.inputRegister = new this.InputRegister();
    this._lastX = undefined;
  },

  onChange: function() {
    $(document).fire(InputStack.onChange);
  },

  clear: function() {
    this.stack = new Array();
    this.inputRegister = new this.InputRegister();

    this.onChange();
    return this;
  },

  peek: function(idx) {
    if(Object.isUndefined(idx) || idx === 0)
      return this.inputRegister.toReadOnly();
    else
      return this.stack[this.stack.length - idx];
  },

  pop: function(count) {
    if(Object.isNumber(count)) {
      var topElements = new Array(this.inputRegister);

      for(var i = 0; i < count - 1 && this.stack.length > 0; i++)
        topElements.push(this.stack.pop());

      if(this.stack.length > 0)
        this.inputRegister = this.stack.pop();
      else
        this.inputRegister = new this.InputRegister();

      this.onChange();
      return topElements
    } else {
      var top = this.inputRegister;

      if(this.stack.length > 0) {
        this.inputRegister = this.stack.last()
        this.stack.length -= 1;
      } else {
        this.inputRegister = new this.InputRegister();
      }

      this.onChange();
      return top;
    }
  },

  push: function(register_or_number) {
    if(this.inputRegister.isDirty) {
      this.stack.push(this.inputRegister.toReadOnly());
      this._lastX = this.stack.last();
    } if(Object.isNumber(register_or_number))
      this.inputRegister = new this.InputRegister(register_or_number);
    else if(register_or_number instanceof this.InputRegister)
      this.inputRegister = new this.InputRegister(register_or_number.toNumber());
    else
      this.inputRegister = this.inputRegister.toReadOnly();

    this.onChange();
    return this.stack.last();
  },

  swap: function() {
    if(this.size() < 2)
      return;

    var x = this.inputRegister.toReadOnly();
    this.inputRegister = this.stack.pop();
    this.stack.push(x);

    this.onChange();
  },

  lastX: function() {
    if(Object.isUndefined(this._lastX))
      return;

    this.push(this._lastX);
  },

  size: function() {
    return this.stack.size() + 1;
  },

  inspect: function() {
    return "{stack: #{stack}, inputRegister: #{inputRegister}}".interpolate(this);
  }
});
InputStack.onChange = "jsRPN:InputStack:onChange";

var Base10InputRegister = Class.create({
  initialize: function(value) {
    this.isDirty = ! Object.isUndefined(value);
    this.value = Object.isNumber(value) ? value.abs() : undefined;
    this.input = "";
    this.isNegative = Object.isNumber(value) && value < 0 ? true : false;
    this.isNegativeExponent = false;
  },

  toReadOnly: function() {
    return new Base10InputRegister(this.toNumber());
  },

  toHTML: function() {
    var parts = this.toString().split('e');

    if(parts.length === 1)
      return parts[0];
    else
      return "#{0}<span class='base'>×10</span><span class='exponent'>#{1}</span>".interpolate(parts);
  },

  toNumber: function() {
    if(Object.isNumber(this.value))
      return (this.isNegative ? -1 : 1) * this.value;
    else
      return new Number(this.toString());
  },

  toString: function() {
    if(Object.isNumber(this.value)) {
      return (this.isNegative ? '-' : '') + (this.value.toString().sub('+', ''));
    } else {
      var parts = this.input.split('e');
      if(this.input.empty())
        return '0';
      else if(parts.length === 1)
        return (this.isNegative ? '-' : '') + parts[0];
      else
        return (this.isNegative ? '-' : '') + parts[0] + 'e' +
               (this.isNegativeExponent ? '-' : '') + parts[1];
    }
  },

  zero: function() {
    if(Object.isNumber(this.value))
      return this.value === 0;
    else
      return this.input.search(/^(0*\.?0*)$/) >= 0;
  },

  'static': function() {
    return Object.isNumber(this.value);
  },

  hasDecimalPoint: function() {
    return this.input.search(/\./) >= 0;
  },

  hasExponent: function() {
    return this.input.search(/e/) >= 0;
  },

  onChange: function() {
    this.isDirty = true;
    $(document).fire(Base10InputRegister.onChange);
  },

  changeSign: function() {
    if(this.hasExponent())
      this.isNegativeExponent = ! this.isNegativeExponent;
    else
      this.isNegative = ! this.isNegative;
    this.onChange();

    return this;
  },

  beforeEnter: function() {
    if(! this.isDirty || Object.isNumber(this.value)) {
      this.value = undefined;
      this.input = "";
      this.isNegative = false;
      this.isNegativeExponent = false;
    }
  },

  enterDigit: function(digit) {
    this.beforeEnter();
    if(this.hasDecimalPoint() || digit !== 0 || ! this.zero())
      this.input += digit;
    this.onChange();
  },

  enterDecimalPoint: function() {
    this.beforeEnter();
    if(! this.hasDecimalPoint())
      this.input += (this.input.empty() ? '0' : '') + '.';
    this.onChange();
  },

  enterExponent: function() {
    this.beforeEnter();
    if(! this.hasExponent() && ! this.zero())
      this.input += 'e';
    this.onChange();
  },

  delete: function() {
    this.beforeEnter();
    this.input = this.input.substring(0, this.input.length - 1);
    if(this.zero())
      this.isNegative = false;
    if(! this.hasExponent())
      this.isNegativeExponent = false;
    this.onChange();
  }
});
Base10InputRegister.onChange = "jsRPN:Base10InputRegister:onChange";

var StackCalculator = Class.create({
  initialize: function(stack) {
    this._stack = stack;
  },

  extend: function(functions) {
    $H(functions).each(function (action) {
      var actionName = action.key;

      if(Object.isFunction(action.value)) {
        var func = action.value;

        this[actionName] = function() {
          if(this._stack.size() < func.length)
            return; // TODO indicate error

          var args = this._stack.pop(func.length).reverse().invoke("toNumber");
          var results = func.apply(null, args);
          if(! Object.isArray(results))
            results = [results];

          results.reverse().each(function(result) {
            this._stack.push(result);
          }.bind(this));
        }.bind(this);
      } else {
        this[actionName] = function() { this._stack.push(action.value); }.bind(this);
      }
    }.bind(this));

    return this;
  }
});

var StackMemory = Class.create({
  initialize: function(stack, keys) {
    this.stack = stack;
    this.storage = $H({});
    keys.each(function(key) { this.storage.set(key, new this.stack.InputRegister(0)); }.bind(this));
  },

  store: function(key) {
    this.storage.set(key, this.stack.peek());
  },

  recall: function(key) {
    if(Object.isUndefined(this.storage.get(key)))
      return;
    this.stack.push(this.storage.get(key));
  },

  addTo: function(key) {
    if(Object.isUndefined(this.storage.get(key))) {
      this.storage.set(key, this.stack.peek());
    } else {
      var newValue = this.storage.get(key).toNumber() + this.stack.peek().toNumber();
      this.storage.set(key, new this.stack.InputRegister(newValue));
    }
  },

  subtractFrom: function(key) {
    if(Object.isUndefined(this.storage.get(key))) {
      this.storage.set(key, this.stack.peek().changeSign());
    } else {
      var newValue = this.storage.get(key).toNumber() - this.stack.peek().toNumber();
      this.storage.set(key, new this.stack.InputRegister(newValue));
    }
  },

  size: function() {
    return this.storage.size();
  },
});

var Keyboard = Class.create({
  initialize: function() {
    this.currentLayout = 0;
    this.numLayouts = 1;
  },

  expand: function(num) {
    this.numLayouts = Math.max(this.numLayouts, num);
  },

  current: function() {
    return this.currentLayout;
  },

  onChange: function() {
    $(document).fire(Keyboard.onChange);
  },

  shift: function(steps) {
    steps = steps || 1;
    var oldLayout = this.currentLayout;
    this.currentLayout = (this.currentLayout + steps) % this.numLayouts;
    console.log("Keyboard: shift from #{from} to #{to}".interpolate({
      from: oldLayout, to: this.currentLayout}));
    this.onChange();
  },

  reset: function() {
    this.currentLayout = 0;
    this.onChange();
  }
});
Keyboard.onChange = "jsRPN:Keyboard:onChange"

var KeyboardListener = Class.create({
  initialize: function(rpn) {
    this.rpn = rpn;
    this.keyBuffer = '';
    this.keyBindings = this.getKeyBindings();
    this.commandMode = false;
    this.lastError = {hasError: false, message: undefined};

    $(document).on("keydown", this.onKeyDown.bind(this));
  },

  getKeyBindings: function() {
    kb = {normal: {}, command: {}};
    kb.normal['ArrowUp'] = (self => self.rpn.stack.swap());
    kb.normal['ArrowDown'] = (self => self.rpn.stack.pop());
    kb.normal['Backspace'] = (self => self.rpn.stack.inputRegister.delete());
    kb.normal['0'] = (self => self.rpn.stack.inputRegister.enterDigit(0));
    kb.normal['1'] = (self => self.rpn.stack.inputRegister.enterDigit(1));
    kb.normal['2'] = (self => self.rpn.stack.inputRegister.enterDigit(2));
    kb.normal['3'] = (self => self.rpn.stack.inputRegister.enterDigit(3));
    kb.normal['4'] = (self => self.rpn.stack.inputRegister.enterDigit(4));
    kb.normal['5'] = (self => self.rpn.stack.inputRegister.enterDigit(5));
    kb.normal['6'] = (self => self.rpn.stack.inputRegister.enterDigit(6));
    kb.normal['7'] = (self => self.rpn.stack.inputRegister.enterDigit(7));
    kb.normal['8'] = (self => self.rpn.stack.inputRegister.enterDigit(8));
    kb.normal['9'] = (self => self.rpn.stack.inputRegister.enterDigit(9));
    kb.normal['.'] = (self => self.rpn.stack.inputRegister.enterDecimalPoint());
    kb.normal[','] = (self => self.rpn.stack.inputRegister.enterDecimalPoint());
    kb.normal['e'] = (self => self.rpn.stack.inputRegister.enterExponent());
    kb.normal['s'] = (self => self.rpn.stack.inputRegister.changeSign());
    kb.normal['Enter'] = (self => self.rpn.stack.push());
    kb.normal['+'] = (self => self.rpn.calc.add());
    kb.normal['-'] = (self => self.rpn.calc.subtract());
    kb.normal['*'] = (self => self.rpn.calc.multiply());
    kb.normal['/'] = (self => self.rpn.calc.divide());
    kb.normal['²'] = (self => self.rpn.calc.square());
    kb.normal['³'] = (self => self.rpn.calc.cube());
    kb.normal['%'] = (self => self.rpn.calc.percentage());
    kb.normal['^'] = (self => self.rpn.calc.pow());
    kb.normal[' '] = (self => self.enterCommandMode());
    kb.command['Enter'] = function(self) {
      var execCommand = self.rpn.calc[self.keyBuffer];
      if(Object.isFunction(execCommand)) {
        execCommand();
        self.leaveCommandMode();
        self.clearKeyBuffer();
      } else {
        self.leaveCommandMode("<em>#{input}</em> unknown".interpolate({input: self.keyBuffer}));
      }
    };
    kb.command['Backspace'] = function(self) {
      if(self.keyBuffer.blank())
        self.leaveCommandMode();
      self.deleteLastCharFromKeyBuffer();
    }
    kb.command['Escape'] = function(self) {
      self.leaveCommandMode();
      self.clearKeyBuffer();
    }

    return kb;
  },

  onKeyDown: function(e) {
    var execAction = this.isCommandMode() ?
      this.keyBindings.command[e.key] :
      this.keyBindings.normal[e.key];

    if(Object.isFunction(execAction)) {
      execAction(this);
      e.stop();
    } else if(e.key.match(/^[a-zA-Z_0-9]$/)) {
      this.enterCommandMode();
      this.appendToKeyBuffer(e.key);
      e.stop();
    } else {
      console.log("Key down: '" + e.key + "'");
    }
  },

  appendToKeyBuffer: function(chr) {
    this.keyBuffer += chr;
    $(document).fire(KeyboardListener.onBufferChange);
  },

  deleteLastCharFromKeyBuffer: function() {
    if(this.keyBuffer.length > 0) {
      this.keyBuffer = this.keyBuffer.substr(0, this.keyBuffer.length - 1);
      $(document).fire(KeyboardListener.onBufferChange);
    }
  },

  clearKeyBuffer: function() {
    this.keyBuffer = '';
    $(document).fire(KeyboardListener.onBufferChange);
  },

  enterCommandMode: function() {
    if(! this.commandMode) {
      this.commandMode = true;
      this.clearKeyBuffer();
      console.log("Entering CommandMode");
      $(document).fire(KeyboardListener.onEnterCommandMode);
    }
  },

  leaveCommandMode: function(error) {
    if(this.lastError.hasError && Object.isUndefined(error))
      $(document).fire(KeyboardListener.onLeaveCommandMode);

    if(this.commandMode) {
      this.commandMode = false;
      this.lastError = {
        hasError: ! Object.isUndefined(error),
        message: error
      };
      console.log("Leaving CommandMode");
      $(document).fire(KeyboardListener.onLeaveCommandMode, this.lastError);
    }
  },

  isCommandMode: function() {
    return this.commandMode;
  }
});
KeyboardListener.onBufferChange = "jsRPN:KeyboardListener:onBufferChange"
KeyboardListener.onEnterCommandMode = "jsRPN:KeyboardListener:onEnterCommandMode"
KeyboardListener.onLeaveCommandMode = "jsRPN:KeyboardListener:onLeaveCommandMode"

var RPNClass = Class.create({
  initialize: function() {
    this.stack = new InputStack(Base10InputRegister);
    this.memory = new StackMemory(this.stack, $w('M 1 2 3 4 5 6 7 8 9'));
    this.calc = new StackCalculator(this.stack).extend(MathX);
    this.keyboard = new Keyboard();
    this.registerEventListeners();
  },

  registerEventListeners: function() {
    $(document).on(Base10InputRegister.onChange, function() {
      $$(".jsRPN .register.stack0 .value").invoke("update", this.stack.inputRegister.toHTML());
    }.bind(this));

    $(document).on(InputStack.onChange, function() {
      $$(".jsRPN .register.stack .value").invoke("update", "");
      for(var i = 0; i < this.stack.size(); i++) {
        $$(".jsRPN .register.stack" + i + " .value").invoke("update", this.stack.peek(i).toHTML());
      }
    }.bind(this));

    this.keyboardListener = new KeyboardListener(this);
    $(document).on(KeyboardListener.onBufferChange, function() {
      $$(".jsRPN .keyBuffer").invoke("removeClassName", "error")
                             .invoke("update", "> " + this.keyboardListener.keyBuffer + '<span class="cursor">▂</span>');
    }.bind(this));
    $(document).on(KeyboardListener.onEnterCommandMode, function() {
      $$(".jsRPN .keyBuffer").invoke("show");
    }.bind(this));
    $(document).on(KeyboardListener.onLeaveCommandMode, function(e) {
      if(e.memo.hasError) {
        $$(".jsRPN .keyBuffer").invoke("addClassName", "error")
                               .invoke("update", ">>> " + e.memo.message + " <<<");
      } else {
        $$(".jsRPN .keyBuffer").invoke("hide");
      }
    }.bind(this));
  },

  updateAll: function() {
    this.stack.onChange();
    this.keyboard.onChange();
  },

  registerName: function(idx) {
    if(idx === 0)
      return "X";
    else if(idx === 1)
      return "Y";
    else if(idx === 2)
      return "Z";
    else
      return (idx + 1).toString();
  },

  printStack: function() {
    this.showPopupList(
      "Stack",
      $R(0, this.stack.size(), true).map(function(i) {
        return {
          label: this.registerName(i),
          value: this.stack.peek(i).toHTML(),
          onClick: function() { this.stack.push(this.stack.peek(i)); }.bind(this)
        };
      }.bind(this))
    );
  },

  printStoreMemory: function() {
    this.showPopupList(
      "Store",
      this.memory.storage.keys().map(function(key) {
        return {
          label: key,
          value: this.memory.storage.get(key).toHTML(),
          onClick: function() { this.memory.store(key); }.bind(this)
        };
      }.bind(this))
    );
  },

  printRecallMemory: function() {
    this.showPopupList(
      "Recall",
      this.memory.storage.keys().map(function(key) {
        return {
          label: key,
          value: this.memory.storage.get(key).toHTML(),
          onClick: function() { this.memory.recall(key); }.bind(this)
        };
      }.bind(this))
    );
  },

  showPopupList: function(title, items) {
    $$(".jsRPN .popupList .title").each(function(displayElement) {
      displayElement.update(title);
    });
    $$(".jsRPN .popupList .list").each(function(displayElement) {
      displayElement.update("");
      items.each(function(item, idx) {
        displayElement.insert({top: RPNClass.registerItem(item, idx)});
      });
    });
    $$(".jsRPN .popupList").invoke("show");
  }
});
RPNClass.registerItem = function(options, idx) {
  var item = new Element('li', {'class': 'register ' +
                                         (idx % 2 === 0 ? 'even' : 'odd')}).
             insert(new Element('span', {'class': 'label'}).update(options.label)).
             insert(new Element('span', {'class': 'value'}).update(options.value));
  if(! Object.isUndefined(options.onClick))
    item.on('click', options.onClick);
  item.on('click', function() { $$(".jsRPN .popupList").invoke("hide"); });

  return item;
}

var jsRPN = new RPNClass();
