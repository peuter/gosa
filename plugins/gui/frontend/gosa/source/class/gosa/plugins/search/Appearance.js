/*========================================================================

   This file is part of the GOsa project -  http://gosa-project.org
  
   Copyright:
      (C) 2010-2016 GONICUS GmbH, Germany, http://www.gonicus.de
  
   License:
      LGPL-2.1: http://www.gnu.org/licenses/lgpl-2.1.html
  
   See the LICENSE file in the project's top-level directory for details.

======================================================================== */

/**
* The activities plugin appearance definition
*/
qx.Theme.define("gosa.plugins.search.Appearance", {
  
  appearances: {
    "gosa-dashboard-widget-search": "gosa-dashboard-widget",
    "gosa-dashboard-widget-search/search-field": {
      include: "textfield",
      alias: "textfield",

      style: function() {
        return {
          marginRight: 10
        }
      }
    },
    "gosa-dashboard-widget-search/search-button/icon": {
      style: function() {
        return {
          width: 22,
          height: 22,
          scale: true
        }
      }
    }
  }
});