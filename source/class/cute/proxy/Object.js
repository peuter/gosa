qx.Class.define("cute.proxy.Object", {

  extend: qx.core.Object,

  construct: function(data){

    // Call parent contructor
    this.base(arguments);

    // Initialize object values
    this.initialized = false;
    this.uuid = data["__jsonclass__"][1][1];
    for(var item in this.attributes){
      if(this.attributes[item] in data){
        this.set(this.attributes[item], data[this.attributes[item]]);
      }
    }

    // Add more translations to the qx.locale.Manager
    var lm = qx.locale.Manager.getInstance();
    console.log(this.translations);
    lm.addTranslation("de", this.translations);
    
    // Initialization is done (Start sending attribute modifications to the backend)
    this.initialized = true;
  },

  events: {
    "propertyUpdateOnServer": "qx.event.type.Data"
  },

  members: {
    initialized: null,

    /* Setter method for object values
     * */
    setAttribute: function(name, value){
      if(this.initialized){
        var that = this;
        var rpc = cute.io.Rpc.getInstance();
        rpc.cA(function(result, error) {
          this.fireDataEvent("propertyUpdateOnServer", {success: !error, error: error, property: name});

          if(!error){
            that.debug("update property value " + name + ": "+ value);
          }else{
            that.error("failed to update property value for " + name + "(" + error.message + ")");
          }
        }, this ,"setObjectProperty", this.uuid, name, value);
      }
    },

    /* Closes the current object
     * */
    close: function(func, context){
      var rpc = cute.io.Rpc.getInstance();
      var args = ["closeObject", this.uuid];
      rpc.cA.apply(rpc, [function(result, error){
          if(func){
            func.apply(context, [result, error]);
          }
        }, this].concat(args));
    },

    /* Wrapper method for object calls
     * */
    callMethod: function(method, func, context){
      var rpc = cute.io.Rpc.getInstance();
      var args = ["dispatchObjectMethod", this.uuid, method].concat(Array.prototype.slice.call(arguments, 3));
      rpc.cA.apply(rpc, [function(result, error){
          if(func){
            func.apply(context, [result, error]);
          }
        }, this].concat(args));
    }
  }
});
