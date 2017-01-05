/*========================================================================

   This file is part of the GOsa project -  http://gosa-project.org

   Copyright:
      (C) 2010-2017 GONICUS GmbH, Germany, http://www.gonicus.de

   License:
      LGPL-2.1: http://www.gnu.org/licenses/lgpl-2.1.html

   See the LICENSE file in the project's top-level directory for details.

======================================================================== */

/**
 * Customizable Dashboard view
 * 
 */
qx.Class.define("gosa.view.Dashboard", {
  extend : qx.ui.tabview.Page,
  type: "singleton",

  construct : function()
  {
    // Call super class and configure ourselfs
    this.base(arguments, "", "@Ligature/dashboard");
    this._setLayout(new qx.ui.layout.VBox());
    this.__layout = new qx.ui.layout.Grid(5, 5);
    this.__columns = 6;
    this.__patchedThemes = {};

    this.addListenerOnce("appear", this.draw, this);

    this.addListener("longtap", function() {
      this.setEditMode(true);
    }, this);
  },

  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {
    __registry: {},
    __parts: {},
    __loadedParts: {},
    __columns: null,

    /**
     * Register a loaded dashboard widget for usage
     *
     * @param widgetClass {Class} Main widget class
     * @param options {Map} additional configuration options
     */
    registerWidget: function(widgetClass, options) {
      qx.core.Assert.assertTrue(qx.Interface.classImplements(widgetClass, gosa.plugins.IPlugin),
                                widgetClass+" does not implement the gosa.plugins.IPlugin interface");
      qx.core.Assert.assertString(widgetClass.ID, widgetClass+" has no static ID constant");
      qx.core.Assert.assertString(options.displayName, "No 'displayName' property found in options");

      var entry = {
        clazz: widgetClass,
        options: options
      };

      var Env = qx.core.Environment;
      var sourceKey = gosa.util.Reflection.getPackageName(widgetClass)+".source";

      var sourceEnv = Env.get(sourceKey);
      if (!sourceEnv) {
        Env.add(sourceKey, "builtin");
      }

      var idParts = widgetClass.ID.split(":");

      if (idParts[0] === "part") {
        // plugin loaded from part
        this.__loadedParts[idParts[1]] = widgetClass.ID;
        delete this.__parts[idParts[1]];
      }

      this.__registry[widgetClass.ID] = entry;
    },

    getWidgetRegistry: function() {
      return this.__registry;
    },

    /**
     * Register an (unloaded) part that provides a dashboard widget
     * @param part {qx.ui.part.Part}
     */
    registerPart: function(part) {
      // generate the widget name from the part name
      var widgetName = qx.lang.String.firstUp(part.getName().replace("gosa.plugins.",""));
      qx.core.Environment.add(part.getName()+".source", "part");
      this.__parts[part.getName()] = widgetName;
    },

    getPartRegistry: function() {
      return this.__parts;
    },

    getLoadedPartWidgetId: function(part) {
      return this.__loadedParts[part];
    }
  },

  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */
  properties : {
    appearance: {
      refine: true,
      init: "gosa-tabview-page"
    },

    columns : {
      check: "Number",
      init: 2
    },

    editMode: {
      check: "Boolean",
      init: false,
      event: "changeEditMode",
      apply: "_applyEditMode"
    },

    /**
     * Flag to determine modifications during editing mode
     */
    modified: {
      check: "Boolean",
      init: false,
      event: "changeModified"
    },

    selectedWidget: {
      check: "gosa.plugins.AbstractDashboardWidget",
      nullable: true,
      apply: "_applySelectedWidget"
    }
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members : {
    __layout: null,
    __settings: null,
    __patchedThemes : null,
    __toolbarButtons: null,

    // property apply
    _applyEditMode: function(value) {
      if (value) {
        this.getChildControl("toolbar").show();
        this.getChildControl("board").addListener("tap", this._onTap, this);
        this.getChildControl("board").getChildren().forEach(function(child) {
          if (child instanceof gosa.plugins.AbstractDashboardWidget) {
            child.addListener("tap", this._onTap, this);
          }
        }, this);
      } else {
        this.getChildControl("toolbar").exclude();
        this.getChildControl("board").getChildren().forEach(function(child) {
          if (child instanceof gosa.plugins.AbstractDashboardWidget) {
            child.removeListener("tap", this._onTap, this);
          }
        }, this);
        this.getChildControl("board").removeListener("tap", this._onTap, this);
        this.setSelectedWidget(null);
        this.setModified(false);
      }
    },

    _onTap: function(ev) {
      if (ev.getCurrentTarget() instanceof gosa.plugins.AbstractDashboardWidget) {
        this.setSelectedWidget(ev.getCurrentTarget());
        ev.stopPropagation();
      } else {
        this.setSelectedWidget(null);
      }
    },

    _applySelectedWidget: function(value, old) {
      if (old) {
        old.removeState("selected");
      }
      if (value) {
        value.addState("selected");
        this.__toolbarButtons['delete'].setEnabled(true);
        this.__toolbarButtons['edit'].setEnabled(true);
      } else {
        this.__toolbarButtons['delete'].setEnabled(false);
        this.__toolbarButtons['edit'].setEnabled(false);
      }
    },

    // overridden
    _createChildControlImpl: function(id) {
      var control;

      switch(id) {

        case "toolbar":
          control = new qx.ui.container.Composite(new qx.ui.layout.HBox(5, "center"));
          control.exclude();
          this.__fillToolbar(control);
          this._addAt(control, 0);
          break;

        case "board":
          control = new qx.ui.container.Composite(this.__layout);
          this._addAt(control, 1);
          break;
      }

      return control || this.base(arguments, id);
    },

    /**
     * Add buttons to the toolbar for the editing mode
     * @param toolbar {qx.ui.container.Composite} the toolbar
     */
    __fillToolbar: function(toolbar) {
      this.__toolbarButtons = {};

      // widget creation menu
      var menu = new qx.ui.menu.Menu();
      var registry = gosa.view.Dashboard.getWidgetRegistry();
      Object.getOwnPropertyNames(registry).forEach(function(name) {
        var entry = registry[name];
        var button = new qx.ui.menu.Button(entry.options.displayName);
        button.setUserData("widget", name);
        menu.add(button);
        button.addListener("execute", this._createWidget, this);
      }, this);

      // add the unloaded parts (loaded parts are alredy in the registry
      var parts = gosa.view.Dashboard.getPartRegistry();
      Object.getOwnPropertyNames(parts).forEach(function(name) {
        var displayName = parts[name];
        var button = new qx.ui.menu.Button(displayName);
        button.setUserData("part", name);
        menu.add(button);
        button.addListener("execute", this._loadPart, this);
      }, this);

      // add button
      var widget = new qx.ui.form.MenuButton(this.tr("Add"), "@Ligature/plus", menu);
      widget.setAppearance("gosa-dashboard-edit-button");
      widget.addListener("execute", function() {

      }, this);
      toolbar.add(widget);
      this.__toolbarButtons["add"] = widget;

      // edit button
      widget = new qx.ui.form.Button(this.tr("Edit"), "@Ligature/gear");
      widget.setDroppable(true);
      widget.setEnabled(false);
      widget.setAppearance("gosa-dashboard-edit-button");
      widget.addListener("tap", function() {
        if (this.getSelectedWidget()) {
          // open edit dialog
          var dialog = new gosa.ui.dialogs.EditDashboardWidget(this.getSelectedWidget());
          dialog.addListenerOnce("modified", function() {
            this.setModified(true);
          }, this);
          dialog.open();
        }
      }, this);
      toolbar.add(widget);
      this.__toolbarButtons["edit"] = widget;

      // delete button
      widget = new qx.ui.form.Button(this.tr("Delete"), "@Ligature/trash");
      widget.setDroppable(true);
      widget.setEnabled(false);
      widget.setAppearance("gosa-dashboard-edit-button");
      widget.addListener("tap", function() {
        if (this.getSelectedWidget()) {
          this.__deleteWidget(this.getSelectedWidget());
        }
      }, this);
      widget.addListener("drop", function(ev) {
        this.__deleteWidget(ev.getRelatedTarget());
      }, this);
      widget.addListener("dragover", function(ev) {
        var spec = {
          duration: 200,
          timing: "ease-in-out",
          keep: 100,
          keyFrames : {
            0: {
              scale : [ "1", "1" ]
            },
            100: {
              scale : [ "1.2", "1.2" ]
            }
          }
        };
        qx.bom.element.Animation.animate(ev.getTarget().getContentElement().getDomElement(), spec);
      }, this);
      widget.addListener("dragleave", function(ev) {
        var spec = {
          duration: 200,
          timing: "ease-in-out",
          keep: 100,
          keyFrames : {
            0: {
              scale : [ "1.2", "1.2" ]
            },
            100: {
              scale : [ "1", "1" ]
            }
          }
        };
        qx.bom.element.Animation.animate(ev.getTarget().getContentElement().getDomElement(), spec);
      }, this);
      toolbar.add(widget);
      this.__toolbarButtons["delete"] = widget;


      // clear dashboard
      widget = new qx.ui.form.Button(this.tr("Clear"), "@Ligature/clear");
      widget.setAppearance("gosa-dashboard-edit-button");
      widget.addListener("execute", function() {
        this.getChildControl("board").removeAll();
        this.setModified(true);
      }, this);
      toolbar.add(widget);
      this.__toolbarButtons["clear"] = widget;

      // abort editing
      widget = new qx.ui.form.Button(this.tr("Abort"), "@Ligature/undo");
      widget.setAppearance("gosa-dashboard-edit-button");
      widget.addListener("execute", function() {
        this.setEditMode(false);
        this.refresh();
      }, this);
      toolbar.add(widget);
      this.__toolbarButtons["cancel"] = widget;

      // finish editing
      widget = new qx.ui.form.Button(this.tr("Save"), "@Ligature/check");
      widget.setEnabled(this.isModified());
      this.addListener("changeModified", function(ev) {
        this.__toolbarButtons['save'].setEnabled(ev.getData() === true);
      }, this);
      widget.setAppearance("gosa-dashboard-edit-button");
      widget.addListener("execute", function() {
        this.setEditMode(false);
        this.save();
      }, this);
      toolbar.add(widget);
      this.__toolbarButtons["save"] = widget;
    },

    __deleteWidget: function(widget) {
      var layoutProps = widget.getLayoutProperties();
      widget.destroy();
      this.setModified(true);
      // add spacer as replacement
      this.getChildControl("board").add(new qx.ui.core.Spacer(), layoutProps);
      if (this.getSelectedWidget() === widget) {
        this.setSelectedWidget(null);
      }
    },

    /**
     * Add a widget to the dashboard, triggered by the 'execute' event from an entry in the 'add' menu
     */
    _createWidget: function(ev) {
      var widgetName = "";
      if (qx.lang.Type.isString(ev)) {
        widgetName = ev.toLowerCase();
      } else {
        var button = ev.getTarget();
        widgetName = button.getUserData("widget");
      }
      var widgetData = gosa.view.Dashboard.getWidgetRegistry()[widgetName];
      var entry = {
        widget: widgetName
      };
      // find empty space in grid
      var placed = false;
      for(var row=0, l = this.__layout.getRowCount(); row < l; row++) {
        for(var col=0, k = this.__layout.getColumnCount(); col < k; col++) {
          if (col + widgetData.options.defaultColspan > this.__columns) {
            // not enough space in this row
            break;
          }
          var widget = this.__layout.getCellWidget(row, col);
          if (widget instanceof qx.ui.core.Spacer) {
            // replace spacer
            entry.layoutProperties = widget.getLayoutProperties();
            widget.destroy();
            // break the outer loop
            placed = true;
            break;
          }
          else if (!widget) {
            // empty cell
            entry.layoutProperties = {
              row: row,
              column: col
            };
            // break the outer loop
            placed = true;
            break;
          }
        }
        if (placed) {
          break;
        }
      }
      if (!placed) {
        // add at the end
        entry.layoutProperties = {
          row    : row,
          column : 0
        };
      }
      entry.layoutProperties.colSpan = widgetData.options.defaultColspan || 3;
      this.__addWidget(entry);
      this.setModified(true);
    },

    /**
     * Load a widget plugin part and create the widget afterwards
     * @param ev {Event} execute event from button
     */
    _loadPart: function(ev) {
      var button = ev.getTarget();
      var partName = button.getUserData("part");
      var part = qx.io.PartLoader.getInstance().getPart(partName);
      if (part.getReadyState() === "initialized") {
        // load part
        qx.Part.require(partName, function() {
          // part is loaded
          this._createWidget(gosa.view.Dashboard.getLoadedPartWidgetId(partName));
        }, this);
      }
    },

    /**
     * Loads the dashboard settings from the backend and creates it.
     */
    draw: function() {

      var board = this.getChildControl("board");
      // pre-filling with spacers to have a 12-col grid
      for(var i=0; i<this.__columns; i++) {
        board.add(new qx.ui.core.Spacer(), {row: 0, column: i});
        this.__layout.setColumnFlex(i, 1);
      }

      // load dashboard settings from backend
      gosa.io.Rpc.getInstance().cA("loadUserPreferences", "dashboard")
      .then(function(result) {
        if (result.length) {
          this.__settings = result;
          var partsToLoad = this.__extractPartsToLoad(result);
          if (partsToLoad.length > 0) {
            qx.Part.require(partsToLoad, function() {
              this.refresh(true);
            }, this);
          } else {
            this.refresh(true);
          }
        }
      }, this);
    },

    __extractPartsToLoad: function(settings) {
      var partsToLoad = [];
      var loader = qx.io.PartLoader.getInstance();
      settings.forEach(function(widgetEntry) {
        var idParts = widgetEntry.widget.split(":");
        if (idParts[0] === "part") {
          //check if part is already loaded
          var part = loader.getPart(idParts[1]);
          if (part.getReadyState() === "initialized") {
            partsToLoad.push(idParts[1]);
          }
        }
      }, this);
      return partsToLoad;
    },

    /**
     * Refresh the dashboard. Removes all existing widgets (if there are any) and create new ones according to the current
     * configuration.
     *
     * @param skipCleanup {Boolean?} if true skip the cleanup step before re-creating
     */
    refresh: function(skipCleanup) {
      if (!skipCleanup && this.getChildControl("board").getChildren().length > 0) {
        this.getChildControl("board").removeAll();
        // re-build in next animation frame
        qx.bom.AnimationFrame.request(qx.lang.Function.curry(this.refresh, true), this);
        return;
      }
      this.__settings.forEach(this.__addWidget, this);
    },

    __addWidget: function(entry) {
      var registry = gosa.view.Dashboard.getWidgetRegistry();
      var widgetName = entry.widget;
      if (widgetName === "qx.ui.core.Spacer") {
        var widget = new qx.ui.core.Spacer();
        this.getChildControl("board").add(widget, entry.layoutProperties);
        return widget;
      }
      else if (!registry[widgetName]) {
        this.warn(entry.widget+" dashboard widget not registered");
      }
      else {
        var options = registry[widgetName].options;
        if (options && options['theme'] && !this.__patchedThemes[widgetName]) {
          for (var key in options['theme']) {
            if (key === "meta") {
              this.debug("patching meta theme " + options['theme'][key]);
              qx.Theme.patch(gosa.theme.Theme, options['theme'][key]);
            }
            else {
              this.debug("patching theme " + options['theme'][key]);
              qx.Theme.patch(gosa.theme[qx.lang.String.firstUp(key)], options['theme'][key]);
            }
          }
          this.__patchedThemes[widgetName] = true;
        }
        var widget = new registry[widgetName].clazz();
        if (entry.settings) {
          widget.configure(entry.settings);
        }
        widget.draw();
        this.bind("editMode", widget, "editMode");
        widget.addListener("dragstart", this._onDragStart, this);
        widget.addListener("dragend", this._onDragEnd, this);
        if (this.isEditMode()) {
          widget.addListener("tap", this._onTap, this);
          this.setSelectedWidget(widget);
        }
        // remove spacers if there are any
        var colspan = entry.layoutProperties.colSpan||1;
        for(var c=entry.layoutProperties.column, l = c + colspan; c<l; c++) {
          var currentWidget = this.__layout.getCellWidget(entry.layoutProperties.row, c);
          if (currentWidget instanceof qx.ui.core.Spacer) {
            currentWidget.destroy();
          }
        }
        this.getChildControl("board").add(widget, entry.layoutProperties);
        return widget;
      }
    },

    _onDragStart: function() {
      var spec = {
        duration: 400,
        timing: "ease-in-out",
        keep: 100,
        keyFrames : {
          0: {
            scale : [ "1", "1" ]
          },
          50: {
            scale : [ "1.2", "1.2" ]
          },
          100: {
            scale : [ "1", "1" ]
          }
        }
      };
      qx.bom.element.Animation.animate(this.__toolbarButtons['delete'].getContentElement().getDomElement(), spec);
      this.__toolbarButtons['delete'].setEnabled(true);
    },

    _onDragEnd: function() {
      this.__toolbarButtons['delete'].setEnabled(false);
    },

    /**
     * Save the current dashboard settings to the backend
     */
    save: function() {
      // Save settings back to the user model
      if(gosa.Session.getInstance().getUser()) {
        // collect information
        var settings = [];
        this.getChildControl("board").getChildren().forEach(function(widget) {
          if (widget instanceof qx.ui.core.Spacer) {
            settings.push({
              widget           : "qx.ui.core.Spacer",
              layoutProperties : widget.getLayoutProperties()
            })
          } else {
            settings.push({
              widget           : widget.constructor.ID,
              source           : qx.core.Environment.get(gosa.util.Reflection.getPackageName(widget)+".source"),
              layoutProperties : widget.getLayoutProperties(),
              settings         : widget.getConfiguration()
            })
          }
        }, this);
        gosa.io.Rpc.getInstance().cA("saveUserPreferences", "dashboard", settings)
        .then(function() {
          this.__toolbarButtons['save'].setEnabled(false);
          this.__settings = settings;
        }, this)
        .catch(function(error) {
          new gosa.ui.dialogs.Error(error.message).open();
        });
      }
    }
  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
  destruct : function() {
    this.__layout = null;
    Object.getOwnPropertyNames(this.__toolbarButtons).forEach(function(name) {
      this.__toolbarButtons[name].dispose();
    }, this);
    this.__toolbarButtons = null;
  },

  defer: function(statics) {
    // load available plugin-parts
    var parts = qx.io.PartLoader.getInstance().getParts();
    Object.getOwnPropertyNames(parts).forEach(function(partName) {
      if (partName.startsWith("gosa.plugins.")) {
        statics.registerPart(parts[partName]);
      }
    }, this);
  }
});
