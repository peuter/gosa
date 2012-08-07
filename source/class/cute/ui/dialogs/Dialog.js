qx.Class.define("cute.ui.dialogs.Dialog",
{
  extend : qx.ui.window.Window,

  construct : function(caption, icon)
  {
    this.base(arguments, caption, icon);
    this.addListener("appear", function(){
        this.center(); 
      }, this);

    this.setMinWidth(300);
    this.setMinHeight(120);

    this.setModal(true);
    this.setShowClose(false);
    this.setShowMaximize(false);
    this.setShowMinimize(false);
    this.setAlwaysOnTop(true);
    this.setResizable(false, false, false, false);

    this.addListener("appear", this.__onAppear, this);
  },


  properties :
  {
    focusOrder :
    {
      check : "Array",
      apply : "__applyFocusOrder",
      init  : []
    }
  },


  members : {


    /**
     * Called whenever a window appears on the screen.
     * Sets the focus on first input field and registers the window 
     *  in the list of currenlty opened windows.
     * (Since a window is opened the GE plugin cannot appear.)
     *
     * @return {void} 
     */
    __onAppear : function()
    {
      this.setEnabled(true);
      this.setActive(true);

      try{
        if (this.getFocusOrder().length){
          var item = this.getFocusOrder()[0];
          if(item == null || !item.isFocusable()){
            this.debug("Could not set focus for " + item);
          }else{
            item.setEnabled(true);
            item.focus();
          }
        }
      }catch(e){
        this.debug("Failed to handle focus order, please check property 'focusOrder' for " + this + " --> " +e );
        this.debug(this.getFocusOrder());
      }
    },


    /**
     * Sets the order of the focus. 
     *
     * @param args {Array} An array, containing the widgets to set focus on.
     * @return {void} 
     */
    __applyFocusOrder : function(args)
    {
      // Set focus on next field
      try
      {
        for (var i=0; i<args.length; i++){
          args[i].addListener("keydown", this.checkInput, this);
        }
      }
      catch(e)
      {
        this.debug("Failed to handle focus order!");
        this.debug(args);
      }
    },


    /**
     * On each ENTER keypress we have to switch to the next input widget.
     *
     * @param e {Event} Key press event 
     * @return {void} 
     */
    checkInput : function(e)
    {
      // Set focus to next button
      if (e.getKeyIdentifier() == "Enter")
      {
        // Set focus on nect field, if next is a button then execute it
        var set = false;

        for (var i=0; i<this.getFocusOrder().length; i++)
        {
          var item = this.getFocusOrder()[i];

          if (set)
          {
            if (item instanceof qx.ui.form.Button)
            {
              item.focus();
              setTimeout(function() {
                item.focus();
              });

              item.execute();
            }
            else
            {
              setTimeout(function() {
                item.focus();
              });
              item.focus();
            }

            return;
          }

          // Found field that has currently the focus
          if (item.hasState("focused")) {
            if (item instanceof qx.ui.form.Button)
            {
              setTimeout(function() {
                item.focus();
              });
              item.focus();
              item.execute();
              return;
            }

            set = true;

          }
        }
      }
    }
  }
});