/*========================================================================

   This file is part of the GOsa project -  http://gosa-project.org

   Copyright:
      (C) 2010-2017 GONICUS GmbH, Germany, http://www.gonicus.de

   License:
      LGPL-2.1: http://www.gnu.org/licenses/lgpl-2.1.html

   See the LICENSE file in the project's top-level directory for details.

======================================================================== */
qx.Class.define("gosa.ui.dialogs.Error", {

  extend: gosa.ui.dialogs.Dialog,

  construct: function(error) {
    var title = this.tr("Error");
    var msg = error;
    if (error instanceof gosa.core.RpcError) {
      msg = error.getData().message;
    }
    else if (error instanceof Error) {
      msg = error.message;
    }
    this.base(arguments, title);

    var message = new qx.ui.basic.Label(msg);
    this.addElement(message);

    var ok = gosa.ui.base.Buttons.getOkButton();
    ok.setAppearance("button-danger");
    ok.addListener("execute", this.close, this);
    this.addButton(ok);
  },

  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */
  statics : {

    /**
     * Convenience function to show an error, can be used to show Promise rejections.
     *
     * <pre>
     *   .catch(gosa.ui.dialogs.Error.show)
     * </pre>
     *
     * @param error {Error} Promise rejection exception
     * @return {gosa.ui.dialogs.Error} The opened dialog
     */
    show: function(error) {
      qx.log.Logger.error(error);
      var dialog = new gosa.ui.dialogs.Error(error);
      dialog.open();
      return dialog;
    }

  },

  properties : {
    //overridden
    appearance : {
      refine : true,
      init : "window-error"
    }
  }
});
