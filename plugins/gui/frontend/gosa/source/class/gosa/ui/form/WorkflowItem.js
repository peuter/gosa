/*========================================================================

   This file is part of the GOsa project -  http://gosa-project.org

   Copyright:
      (C) 2010-2017 GONICUS GmbH, Germany, http://www.gonicus.de

   License:
      LGPL-2.1: http://www.gnu.org/licenses/lgpl-2.1.html

   See the LICENSE file in the project's top-level directory for details.

======================================================================== */

/**
* Display a workflow item with icon, label and description
*/
qx.Class.define("gosa.ui.form.WorkflowItem", {
  extend : qx.ui.core.Widget,
  implement : [qx.ui.form.IModel],
  include: [qx.ui.form.MModelProperty],
  
  construct : function(skipHover) {
    this.base(arguments);
    var layout = new qx.ui.layout.HBox(0);
    this._setLayout(layout);

    if (!skipHover) {
      this.addListener("mouseover", this._onMouseOver, this);
      this.addListener("mouseout", this._onMouseOut, this);
    }
  },
    
  properties : {

    appearance: {
      refine: true,
      init: "gosa-workflow-item"
    },

    id: {
      init : null,
      check: "String",
      apply: "_applyId"
    },

    icon: {
      check: "String",
      init: null,
      themeable: true,
      nullable: true,
      apply: "_applyIcon",
      event: "changeIcon"
    },

    label: {
      check: "String",
      nullable: true,
      apply: "_applyText",
      event: "changeLabel"
    },

    description: {
      check: "String",
      nullable: true,
      apply: "_applyText"
    },

    iconSize: {
      check: "Number",
      themeable: true,
      init: 64,
      apply: "_applyIconSize",
      event: "changeIconSize"
    },

    loading: {
      check: "Boolean",
      init: false,
      apply: "_applyLoading"
    },

    show: {
      check: ["both", "icon", "label"],
      init: "both",
      themeable: true,
      apply: "_applyShow"
    },

    iconPosition: {
      check: ["left", "top"],
      init: "left",
      themeable: true,
      apply: "_applyIconPosition"
    },

    /**
     * This is a dummy property to let this be usable as a selectbox listitem.
     */
    rich      : {
      check : "Boolean",
      init  : false
    },

    /**
     * How this list item should behave like group or normal ListItem
     */
    listItemType: {
      check: ['group', 'item'],
      init: 'item',
      apply: '_applyListItemType'
    }
  },
    
  members : {

    _onMouseOver : function() {
      this.addState("hovered");
    },

    _onMouseOut : function() {
      this.removeState("hovered");
    },

    // property apply
    _applyId : function()
    {
      if (this.getIcon()) {
        this._applyIcon(this.getIcon());
      }
    },

    // property apply
    _applyListItemType: function(value) {
      if (value === "group") {
        this.setLayoutProperties({lineBreak: true, stretch: true, newLine: true});
        this.setAppearance("gosa-workflow-category");
        this.setEnabled(false);
      } else {
        this.setLayoutProperties({});
        this.setAppearance("gosa-workflow-item");
        this.setEnabled(true);
      }
    },

    // property apply
    _applyLoading: function(value) {
      if (value) {
        this.getChildControl("throbber").show();
      } else {
        this.getChildControl("throbber").exclude();
      }
    },

    // property apply
    _applyIconPosition: function(value, old) {
      var icon = this.getChildControl("icon");
      var throbber = this.getChildControl("throbber");
      if (old === "left") {
        this._remove(icon);
        this._remove(throbber);
      } else {
        this.getChildControl("content").remove(icon);
        this.getChildControl("content").remove(throbber);
      }
      if (value === "left") {
        this._addAt(icon, 0);
        this._addAt(throbber, 1);
      } else {
        this.getChildControl("content").addAt(icon, 0);
        this.getChildControl("content").addAt(throbber, 1);
      }
    },

    // overridden
    _createChildControlImpl: function(id) {
      var control;

      switch(id) {

        case "icon":
          control = new qx.ui.basic.Image();
          control.setAnonymous(true);
          this._addAt(control, 0);
          break;

        case "throbber":
          control = new gosa.ui.Throbber();
          this.bind("iconSize", control, "size");
          control.exclude();
          control.bind("visibility", this.getChildControl("icon"), "visibility", {
            converter: function(value) {
              return ['hidden', 'excluded'].indexOf(value) >= 0 ? 'visible' : 'excluded';
            }
          });
          this._addAt(control, 1);
          break;

        case "content":
          control = new qx.ui.container.Composite(new qx.ui.layout.VBox());
          control.setAnonymous(true);
          this._addAt(control, 2);
          break;

        case "label":
          control = new qx.ui.basic.Label(this.getLabel());
          control.setRich(this.getRich());
          control.setAnonymous(true);
          this.getChildControl("content").addAt(control, 2);
          if (this.getLabel() == null) {
            control.exclude();
          }
          break;

        case "description":
          control = new qx.ui.basic.Label(this.getDescription());
          control.setAnonymous(true);
          control.setRich(true);
          control.setWrap(true);
          this.getChildControl("content").addAt(control, 3);
          if (!this.getDescription()) {
            control.exclude();
          }
          break;

      }

      return control || this.base(arguments, id);
    },

    // property apply
    _applyText: function(value, old, name) {
      var control = this.getChildControl(name);
      if (value) {
        control.setValue(value);
        control.show();
      } else {
        control.exclude();
      }
    },

    // property apply
    _applyIcon: function(value) {
      var control = this.getChildControl("icon");
      if (value && this.getId()) {
        if (value.startsWith("@")) {
          control.setSource(value);
        }
        else {
          control.setSource("/workflow/" + this.getId() + "/" + value);
        }
        control.show();
      } else {
        control.hide();
      }
    },

    // property apply
    _applyShow: function(value) {
      switch(value) {
        case "both":
          this.getChildControl("content").show();
          this.getChildControl("icon").show();
          break;
        case "label":
          this.getChildControl("content").show();
          this.getChildControl("icon").exclude();
          break;
        case "icon":
          this.getChildControl("content").exclude();
          this.getChildControl("icon").show();
          break;
      }
    },

    // property apply
    _applyIconSize: function(size) {
      this.getChildControl("icon").set({
        scale: true,
        width: size,
        height: size
      });
    }
  }
});