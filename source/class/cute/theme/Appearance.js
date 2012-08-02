/* ************************************************************************

   Copyright:

   License:

   Authors:

************************************************************************ */

qx.Theme.define("cute.theme.Appearance",
{
  extend : qx.theme.indigo.Appearance,

  appearances :
  {
    "arrow" :
    {
      include : "image",

      style : function(states)
      {
        return {
          source : states.selected ? "decoration/arrows/down-invert.gif" : "decoration/arrows/down.gif",
          alignY : "middle"
        };
      }
    },

    "SearchList" :
    {
      alias : "scrollarea"
      //,include : "textfield"
    },

    "SearchListItem-Icon" : 
    {
      style : function(states)
      {
        return {};
      }
    },

    "SearchLIstItem-Dn" :
    {
      style : function(states)
      {
        return {
          textColor : "green",
          cursor: "default"
        };
      }
    },

    "SearchLIstItem-Title" :
    {
      style : function(states)
      {
        return {
          textColor : "blue",
          cursor: "pointer",
          font : "SearchResultTitle"
        };
      }
    },

    "SearchLIstItem-Description" :
    {
      style : function(states)
      {
        return {
          textColor : "black"
        };
      }
    },


    "SearchListItem":
    {
      alias : "atom",

      style : function(states)
      {
        var padding = [3, 5, 3, 5];
        if (states.lead) {
          padding = [ 2, 4 , 2, 4];
        }
        if (states.dragover) {
          padding[2] -= 2;
        }

        var backgroundColor = states.hovered ? 'light-background' : undefined;
        
        return {
          gap : 4,
          padding : padding,
          backgroundColor : backgroundColor,
          textColor : states.selected ? "text-selected" : undefined,
          decorator : states.lead ? "lead-item" : states.dragover ? "dragover" : undefined
        };
      }
    }

  }
});
