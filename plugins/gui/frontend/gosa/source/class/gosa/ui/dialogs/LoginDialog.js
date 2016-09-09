/*========================================================================

   This file is part of the GOsa project -  http://gosa-project.org
  
   Copyright:
      (C) 2010-2012 GONICUS GmbH, Germany, http://www.gonicus.de
  
   License:
      LGPL-2.1: http://www.gnu.org/licenses/lgpl-2.1.html
  
   See the LICENSE file in the project's top-level directory for details.

======================================================================== */

/**
 * @ignore(gosa.LocalConfig,gosa.LocalConfig.autologin,gosa.LocalConfig.user,gosa.LocalConfig.password,u2f.sign)
 */
qx.Class.define("gosa.ui.dialogs.LoginDialog",
{
  extend : gosa.ui.dialogs.Dialog,

  construct : function()
  {
    this.base(arguments, this.tr("Login"));
    this.__initLoginForm();
    this.__initOtpForm();

    var controller = new qx.data.controller.Form(null, this._form);
    this._model = controller.createModel();
  },

  events: {
    "login": "qx.event.type.Data"
  },

  members: {
    _uid : null,
    _password: null,
    _login: null,
    _info: null,
    _key: null,
    _mode: "login",

    __initLoginForm: function() {
      // Show Subject/Message pane
      var form = new qx.ui.form.Form();
      this._form = form;

      // Add the form items
      var uid = this._uid = new qx.ui.form.TextField();
      uid.setRequired(true);
      uid.setWidth(200);

      // Add the form items
      var password = this._password = new qx.ui.form.PasswordField();
      password.setRequired(true);
      password.setWidth(200);

      form.add(uid, this.tr("Login ID"), null, "uid");
      form.add(password, this.tr("Password"), null, "password");

      this.addElement(new gosa.ui.form.renderer.Single(form, false));

      // Add status label
      var info = this._info = new qx.ui.basic.Label();
      info.setRich(true);
      info.exclude();
      this.addElement(info);
      this.getLayout().setAlignX("center");

      var login = this._login = gosa.ui.base.Buttons.getButton(this.tr("Login"));
      this.addButton(login);

      login.addListener("execute", function(){
        if (this._form.validate()) {

          if (gosa.Config.notifications) {
            if (gosa.Config.notifications.checkPermission() != 0) {
              gosa.Config.notifications.requestPermission();
            }
          }

          var rpc = gosa.io.Rpc.getInstance();
          if (this._mode === "login") {
            rpc.callAsync(this._handleAuthentification.bind(this), "login", this._model.get("uid"), this._model.get("password"));
          } else if (this._mode === "verify") {
            rpc.callAsync(this._handleAuthentification.bind(this), "verify", this._model.get("key"));
          }
        }
      }, this);

      this.setFocusOrder([uid, password, login]);

      // Automatically fill in username and password if wanted
      if(gosa.LocalConfig && gosa.LocalConfig.autologin){
        uid.setValue(gosa.LocalConfig.user);
        password.setValue(gosa.LocalConfig.password);
        login.execute();
      }
    },

    __initOtpForm: function() {
      var key = this._key = new qx.ui.form.TextField();
      key.setWidth(200);
      key.exclude();

      this._form.add(key, this.tr("OTP-Passkey"), null, "key");
    },

    /**
     * Callback function for RPC login responses
     *
     * @param result {Number} One of gosa.Config.AUTH_*
     * @param error {Error}
     * @protected
     */
    _handleAuthentification: function(result, error) {
      var state = parseInt(result.state);
      switch (state) {
        case gosa.Config.AUTH_FAILED:
          this._info.setValue('<span style="color:red">' + this.tr("Invalid login...") + '</span>');
          this._info.show();
          this._password.setEnabled(false);
          this._uid.setEnabled(false);
          this._login.setEnabled(false);

          var timer = qx.util.TimerManager.getInstance();
          timer.start(function(userData, timerId) {
            this._uid.focus();
            this._uid.setValue("");
            this._password.setValue("");
            this._password.setEnabled(true);
            this._uid.setEnabled(true);
            this._login.setEnabled(true);
            this._info.setValue("");
            this._info.exclude();
          }, 0, this, null, 4000);
          break;

        case gosa.Config.AUTH_SUCCESS:
          this.fireDataEvent("login", { user : this._model.get("uid") });
          this.close();
          break;

        case gosa.Config.AUTH_OTP_REQUIRED:
          this._uid.exclude();
          this._password.exclude();
          this._key.show();
          this._info.setValue( this.tr("Two factor authentification:"));
          this._info.show();
          this._mode = "verify";
          break;

        case gosa.Config.AUTH_U2F_REQUIRED:
          var rpc = gosa.io.Rpc.getInstance();
          var data = qx.lang.Json.parse(result.u2f_data);
          u2f.sign(data.authenticateRequests[0]['appId'], data.registerRequests, data.authenticateRequests, function(deviceResponse) {
            if (deviceResponse.errorCode) {
              this._info.setValue('<span style="color:red">' + this.tr("Device responded with error '%1': %2", deviceResponse.errorCode, this.__getErrorMessage(deviceResponse.errorCode)) + '</span>');
              this._info.show();
            } else {
              rpc.callAsync(this._handleAuthentification.bind(this), "verify", qx.lang.Json.stringify(deviceResponse));
            }
          }.bind(this));
          break;

      }
    },

    /**
     * Get an error string to the given error code
     *
     * @see https://developers.yubico.com/U2F/Libraries/Client_error_codes.html
     * @param code
     * @private
     */
    __getErrorMessage: function(code) {
      switch(code) {
        case 1:
          return this.tr("Unkown error");
        case 2:
          return this.tr("Bad request");
        case 3:
          return this.tr("Client configuration is not supported");
        case 4:
          return this.tr("The presented device is not eligible for this request");
        case 5:
          return this.tr("Timeout reached before request could be satisfied");
      }
    },
  },

  destruct : function() {
    this._disposeObjects("_uid", "_password", "_login", "_info", "_key");
  }
});

