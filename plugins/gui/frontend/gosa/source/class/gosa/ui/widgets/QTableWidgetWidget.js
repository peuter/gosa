/*========================================================================

   This file is part of the GOsa project -  http://gosa-project.org

   Copyright:
      (C) 2010-2017 GONICUS GmbH, Germany, http://www.gonicus.de

   License:
      LGPL-2.1: http://www.gnu.org/licenses/lgpl-2.1.html

   See the LICENSE file in the project's top-level directory for details.

======================================================================== */

/* This class is a qooxdoo-widget representation of the cure-QtableWidget.
 *
 * Notice that this plugin can occur in two different forms.
 *
 * 1. The first form is a table like widget as used on the PosixUser-tab
 *    It allows to select multiple values for a single property.
 * 2. The other form is a single-select widget, which looks similar to a
 *    normal TextField. It only allows to select a single value.
 *    This is used for the User's manager attribute or the SambaUser's
 *    primaryGroupSID
 *
 * */
qx.Class.define("gosa.ui.widgets.QTableWidgetWidget", {

  extend: gosa.ui.widgets.Widget,

  construct: function() {
    this.base(arguments);
    this.contents.setLayout(new qx.ui.layout.Canvas());
    this.contents.add(new qx.ui.core.Spacer(1), {edge: 0});

    this.addListenerOnce("appear", this.__createWidget, this);
  },

  statics: {
    getMergeWidget: function(value){
      var container = new qx.ui.container.Composite(new qx.ui.layout.VBox());

      value.forEach(function(item) {
        var widget = new qx.ui.form.TextField(item);
        widget.setReadOnly(true);
        container.add(widget);
      });
      return(container);
    }
  },

  properties : {
    appearance : {
      refine : true,
      init : "gosa-table-widget"
    }
  },

  members: {

    __widget: null,

    setErrorMessage: function(message, id){
      this.__widget.setErrorMessage(message, id);
    },

    resetErrorMessage: function(){
      if (this.__widget) {
        this.__widget.resetErrorMessage();
      }
    },

    __createWidget : function() {
      if (this.isMultivalue()) {
        this.__createMultivalueWidget();
      }
      else {
        this.__createSingleValueWidget();
      }
      this.__widget.addListener("changeValue", this.__onWidgetChangeValue, this);
      this.__bindAttributesToWidget();
      this.contents.add(this.__widget, {left: 0, right: 0, bottom: 37, top: 0});
    },

    __createSingleValueWidget : function() {
      this.__widget = new gosa.ui.widgets.SingleSelector();
    },

    __createMultivalueWidget : function() {
      this.__widget = new gosa.ui.widgets.TableWithSelector();
      this._createChildControl("add-button");
      this._createChildControl("remove-button");
      this.__widget.bind("hasSelection", this.getChildControl("remove-button"), "enabled");
    },

    __onWidgetChangeValue : function(event) {
      this.fireDataEvent("changeValue", event.getData());
    },

    __bindAttributesToWidget: function() {
      var attrs = ["buddyOf", "attribute", "labelText", "extension", "guiProperties", "caseSensitive", "blockedBy",
        "defaultValue", "dependsOn", "mandatory", "type", "unique", "values", "readOnly", "multivalue", "initComplete",
        "enabled", "value", "required", "placeholder", "maxLength", "modified"];

      attrs.forEach(function(attributeName) {
        this.bind(attributeName, this.__widget, attributeName);
      }, this);
    },

    _createChildControlImpl : function(id, hash) {

      var control = null;

      switch(id) {
        case "control-bar":
          control = new qx.ui.container.Composite(new qx.ui.layout.HBox());
          this.contents.add(control, {left:0, right:0, bottom: 0});
          break;

        case "add-button":
          control = new qx.ui.form.Button(this.tr("Add"), "@Ligature/edit/22");
          control.addListener("execute", this.__widget.openSelector, this.__widget);
          this.getChildControl("control-bar").add(control);
          break;

        case "remove-button":
          control = new qx.ui.form.Button(this.tr("Remove"), "@Ligature/trash/22");
          control.addListener("execute", this.__widget.removeSelection, this.__widget);
          this.getChildControl("control-bar").add(control);
          break;
      }

      return control || this.base(arguments, id, hash);
    }
  },

  destruct: function(){

    // Remove all listeners and then set our values to null.
    qx.event.Registration.removeAllListeners(this);

    this._disposeObjects("__widget");
  }
});
