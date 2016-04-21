var RPNCalcLayout = Class.create({
  initialize: function(template, body, jsRPN) {
    this.jsRPN = jsRPN;
    this.template = $(template).clone(true);
    $(template).remove();

    this.body = $(body).update('').addClassName('jsRPN');
    this.process(this.template.childElements()).inject(this.body, Element.insert);

    this.jsRPN.updateAll();
  },

  process: function(templates, args) {
    if(! Object.isArray(templates))
      templates = [templates];

    var results = [];
    templates.each(function(template) {
      var processor = RPNCalcLayout.Processors[template.tagName.toLowerCase()];
      if(Object.isUndefined(args))
        results.push(processor(this, template));
      else
        results.push(processor(this, template, args));
    }.bind(this));

    return results;
  },

  modeClass: function(layout) {
    if(layout === 'any')
      return 'modeAny';
    else
      return 'mode' + layout;
  }
});

RPNCalcLayout.Processors = {
  rpnframe: function(layout, template) {
    var result = new Element('div', {'class': 'frame'});
    layout.process(template.childElements()).inject(result, Element.insert);

    return result;
  },

  buttongrid: function(layout, template) {
    var result = new Element('div', {'class': 'buttongrid'});
    layout.process(template.childElements()).inject(result, Element.insert);

    return result;
  },

  row: function(layout, template) {
    var result = new Element('div', {'class': 'row'});
    var numCols = 0;
    var childElements = template.childElements();
    childElements.each(function(childElement) {
      numCols += childElement.hasAttribute('colspan') ?
        parseInt(childElement.readAttribute('colspan')) :
        1;
    });
    result.addClassName('cols' + numCols);
    layout.process(childElements).inject(result, Element.insert);

    return result;
  },

  button: function(layout, template) {
    var buttonDisabled = template.hasAttribute('disabled');

    var result = new Element('a', {'class': 'button'});
    if(template.hasAttribute('colspan'))
      result.addClassName('colspan' + template.readAttribute('colspan'));
    if(buttonDisabled)
      result.addClassName('disabled');

    template.childElements().map(function(template, idx) {
      var actionComment = "<!-- action: " + template.readAttribute('action') + " -->";
      var actionLayout = template.hasAttribute('onLayout') ?
                           template.readAttribute('onLayout').toLowerCase() :
                           idx
      return new Element('div', {'class':'action'}).addClassName(layout.modeClass(actionLayout))
                                                 .update(actionComment + template.innerHTML);
    }).reverse().inject(result, Element.insert);

    var actions = template.childElements().map(function(template, idx) {
      return {
        layout: template.hasAttribute('onLayout') ?
                  template.readAttribute('onLayout').toLowerCase() :
                  idx,
        function: new Function(template.readAttribute('action'))
      };
    });
    result.store('actions', actions);
    result.addClassName('actions' + actions.length);
    layout.jsRPN.keyboard.expand(actions.length);

    result.on('click', 'a.button', function(event, element) {
      var jsRPN = layout.jsRPN;
      if(buttonDisabled) {
        jsRPN.keyboard.reset();

        return false;
      }

      var actions = element.retrieve('actions');
      if(Object.isUndefined(actions))
        return false;

      var actionIdx = jsRPN.keyboard.current();
      var actionResponse = true;
      var action = actions.find(a => a.layout === 'any' || a.layout === actionIdx);
      if(! Object.isUndefined(action)) {
        try {
          var execAction = action.function.bind(jsRPN);
          actionResponse = execAction();
        } catch(e) {
          throw e.toString() + " in action\n" + Object.toJSON(action);
        }
      }

      if(actionResponse !== false)
        jsRPN.keyboard.reset();

      return false;
    });

    $(document).on(Keyboard.onChange, function(event) {
      var keyboard = layout.jsRPN.keyboard;
      for(var i = 0; i < keyboard.numLayouts; i++)
        result.removeClassName(layout.modeClass(i));
      result.addClassName(layout.modeClass(keyboard.current()));
    });

    return result;
  },

  statusline: function(layout, template) {
    return new Element('div').update("STATUSLINE");
  },

  keybuffer: function(layout, template) {
    return new Element('div', {'class': 'keyBuffer'}).hide();
  },

  register: function(layout, template) {
    var idx = parseInt(template.readAttribute("idx"));
    var registerType = template.readAttribute("type");
    var label = new Element('span', {'class': 'label'}).update(jsRPN.registerName(idx));
    var value = new Element('span', {'class': 'value'});
    var result = new Element('div', {'class': 'register'}).addClassName(registerType)
                                                          .addClassName(layout.modeClass(idx))
                                                          .addClassName(registerType + idx)
                                                          .insert(label)
                                                          .insert(value);

    return result;
  },

  popuplist: function(layout, template) {
    var title = new Element('h2', {'class': 'title'});
    var list = new Element('ol', {'class': 'list'});
    var container = new Element('div', {'class': 'container'}).insert(title)
                                                              .insert(list);
    var result = new Element('div', {'class': 'popupList'}).insert(container);
    result.on('click', function() { result.hide(); });
    result.hide();

    return result;
  }
};
