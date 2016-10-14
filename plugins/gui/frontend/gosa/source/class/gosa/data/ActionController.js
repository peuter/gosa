/**
 * Controller for actions that can be done on the object (e.g. change password).
 */
qx.Class.define("gosa.data.ActionController", {

  extend : qx.core.Object,

  /**
   * @param objectEditController {gosa.data.ObjectEditController}
   */
  construct : function(objectEditController) {
    this.base(arguments);
    qx.core.Assert.assertInstance(objectEditController, gosa.data.ObjectEditController);
    this._obj = objectEditController.getObject();
  },

  members : {
    _obj : null,

    /**
     * Returns the dn of the object.
     *
     * @return {String | null}
     */
    getDn : function() {
      return this._obj.dn;
    },

    /**
     * Returns the uuid of the object.
     *
     * @return {String | null}
     */
    getUuid : function() {
      return this._obj.uuid;
    },

    /**
     * Returns the value of the attribute of the object.
     *
     * @param attributeName {String} Name of the desired attribute
     * @return {qx.data.Array | null}
     */
    getAttributeValue : function(attributeName) {
      qx.core.Assert.assertString(attributeName);

      if (qx.Class.hasProperty(this._obj.constructor, attributeName)) {
        return this._obj.get(attributeName);
      }
      return null;
    },

    /**
     * Returns the value of a property of the object.
     *
     * @param property {String} Name of the desired property
     * @return {Var | null} The value of the property; null if not found
     */
    getProperty : function(property) {
      qx.core.Assert.assertString(property);
      var result = this._obj[property];
      return result === undefined ? null : result;
    },

    /**
     * Calls the given method on the object.
     *
     * @param methodName {String} Name of the method
     * @param callback {Function} Callback function with the parameters result and error
     * @param context {Object ? null} Optional context for the callback function
     */
    callMethod : function(methodName, callback, context) {
      qx.core.Assert.assertString(methodName);
      qx.core.Assert.assertFunction(callback);
      this._obj.callMethod.apply(this._obj, arguments);
    },

    /**
     * Find the current password method saved in the object.
     *
     * @return {String | null} The current password method
     */
    getPasswordMethod : function() {
      if (!this._obj) {
        return null;
      }

      var methods = this._obj.getPasswordMethod();
      if (methods.getLength() > 0) {
        return methods.getItem(0);
      }
      return null;
    },

    /**
     * Set the new password.
     *
     * @param callback {Function} Callback function for the backend response (takes two possible args: result and error)
     * @param context {Object ? null} Optional context for the callback function
     * @param method {String} The method to store the password (e.g. "MD5")
     * @param password {String} The password to save (not encoded)
     */
    setPassword : function(callback, context, method, password) {
      qx.core.Assert.assertString(method);
      qx.core.Assert.assertString(password);
      qx.core.Assert.assertFunction(callback);
      this._obj.changePasswordMethod(callback, context, method, password);
    },

    /**
     * Sets a new samba password.
     *
     * @param callback {Function} Callback function for the backend response (takes two possible args: result and error)
     * @param context {Object ? null} Optional context for the callback function
     * @param password {String} The password to save (not encoded)
     */
    setSambaPassword : function(callback, context, password) {
      qx.core.Assert.assertFunction(callback);
      qx.core.Assert.assertString(password);
      this._obj.changeSambaPassword(callback, context, password);
    },

    /**
     * Requests the current two-factor authentification method from the backend.
     *
     * @param callback {Function} Callback function with the possible args 'result' and 'error'
     * @param context {Object ? null} Optional context for the callback
     */
    getTwoFactorMethod : function(callback, context) {
      qx.core.Assert.assertFunction(callback);
      this._obj.getTwoFactorMethod(callback, context);
    },

    /**
     * Saves a two-factor method.
     *
     * @param callback {Function} Callback function for the backend result/error
     * @param context {Object | null | undefined} Optional context for the callback
     * @param method {String} The method that shall be setPassword
     * @param password {String ? null} Optional password (only needed when two-factor was set before)
     */
    setTwoFactorMethod : function(callback, context, method, password) {
      qx.core.Assert.assertFunction(callback);
      qx.core.Assert.assertString(method);
      this._obj.changeTwoFactorMethod(callback, context, method, password);
    },

    /**
     * Finished the two-factor registration process.
     *
     * @param callback {Function} Callback function for the backend result/error
     * @param context {Object ? undefined} Optional context for the callback function
     * @param data {String ? undefined} Optional data; depends on the actual method
     */
    finishU2FRegistration : function(callback, context, data) {
      qx.core.Assert.assertFunction(callback);
      if (data) {
        qx.core.Assert.assertString(data);
      }
      this._obj.finishU2FRegistration(callback, context, data);
    },

    /**
     * Sends a message to the object.
     *
     * @param callback {Function} Callback function for the backend result/error
     * @param context {Object ? undefined} Optional context for the callback function
     * @param subject {String} Subject of the message
     * @param message {String} The actual message
     */
    sendMessage : function(callback, context, subject, message) {
      qx.core.Assert.assertFunction(callback);
      qx.core.Assert.assertString(subject);
      qx.core.Assert.assertString(message);
      this._obj.notify(callback, context, subject, message);
    }
  }
});