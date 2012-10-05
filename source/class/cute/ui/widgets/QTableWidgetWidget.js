/* This class is a qooxdoo-widget representation of the cure-QtableWidget.
 *
 * Notice that this plugin can occure in two different forms.
 *
 * 1. The first form is a table like widget as used on the PosixUser-tab
 *    It allows to select multiple values for a single property.
 * 2. The other form is a single-select widget, which looks similar to a
 *    normal TextField. It only allows to select a single value. 
 *    This is used for the User's manager attribute or the SambaUser's 
 *    primaryGroupSID
 *
 * */
qx.Class.define("cute.ui.widgets.QTableWidgetWidget", {

  extend: cute.ui.widgets.Widget,

  construct: function(){

    this.base(arguments);
    this.setLayout(new qx.ui.layout.Canvas());
    var attrs = ["buddyOf","attribute",
          "labelText","extension","guiProperties","caseSensitive",
          "blockedBy","defaultValue","dependsOn","mandatory", 
          "type","unique","values","readOnly","multivalue",
          "value","required","placeholder","maxLength","modified"];

    /* Create the multi-select style widget or the single select
     * widget depending on the source-properties multivalue state.
     * */
    this.addListenerOnce("appear", function(){
        var widget = null;
        if(this.isMultivalue()){
          widget = new cute.ui.widgets.TableWithSelector();
        }else{
          widget = new cute.ui.widgets.SingleSelector();
        }
        widget.addListener("changeValue", function(e){
          this.fireDataEvent("changeValue", e.getData());
        }, this);

        for(var attr in attrs){
          this.bind(attrs[attr], widget, attrs[attr]);
        }

        this.add(widget, {left:0, right:0, bottom: 0, top:0});
        this._widget = widget;
      },this);
  },

  members: {

    _widget: null,

    /* Sets an error message for the widget given by id.
     */ 
    setErrorMessage: function(message, id){
      this._widget.setErrorMessage(message, id);
    },

    /* Resets error messages
     * */
    resetErrorMessage: function(){
      this._widget.resetErrorMessage();
    }
  }                      
});
