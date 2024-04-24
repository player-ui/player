!(function (e, t) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
      ? define([], t)
      : "object" == typeof exports
        ? (exports.TTOBeaconPlugin = t())
        : (e.TTOBeaconPlugin = t());
})(this, function () {
  return (function (e) {
    var t = {};
    function n(o) {
      if (t[o]) return t[o].exports;
      var r = (t[o] = { i: o, l: !1, exports: {} });
      return e[o].call(r.exports, r, r.exports, n), (r.l = !0), r.exports;
    }
    return (
      (n.m = e),
      (n.c = t),
      (n.d = function (e, t, o) {
        n.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: o });
      }),
      (n.r = function (e) {
        "undefined" != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
          Object.defineProperty(e, "__esModule", { value: !0 });
      }),
      (n.t = function (e, t) {
        if ((1 & t && (e = n(e)), 8 & t)) return e;
        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
        var o = Object.create(null);
        if (
          (n.r(o),
          Object.defineProperty(o, "default", { enumerable: !0, value: e }),
          2 & t && "string" != typeof e)
        )
          for (var r in e)
            n.d(
              o,
              r,
              function (t) {
                return e[t];
              }.bind(null, r),
            );
        return o;
      }),
      (n.n = function (e) {
        var t =
          e && e.__esModule
            ? function () {
                return e.default;
              }
            : function () {
                return e;
              };
        return n.d(t, "a", t), t;
      }),
      (n.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
      }),
      (n.p = ""),
      n((n.s = 2))
    );
  })([
    function (e, t) {
      e.exports = function (e, t) {
        if (!(e instanceof t))
          throw new TypeError("Cannot call a class as a function");
      };
    },
    function (e, t) {
      function n(e, t) {
        for (var n = 0; n < t.length; n++) {
          var o = t[n];
          (o.enumerable = o.enumerable || !1),
            (o.configurable = !0),
            "value" in o && (o.writable = !0),
            Object.defineProperty(e, o.key, o);
        }
      }
      e.exports = function (e, t, o) {
        return t && n(e.prototype, t), o && n(e, o), e;
      };
    },
    function (e, t, n) {
      "use strict";
      n.r(t),
        n.d(t, "BeaconElements", function () {
          return a;
        }),
        n.d(t, "BeaconActions", function () {
          return c;
        }),
        n.d(t, "default", function () {
          return l;
        });
      var o = n(0),
        r = n.n(o),
        i = n(1),
        u = n.n(i),
        a = [
          "button",
          "link",
          "tile",
          "radio_button",
          "drop_down",
          "expand",
          "check_box",
          "text_input",
          "search_input",
          "file_input",
          "video",
          "view",
        ],
        c = [
          "clicked",
          "opened",
          "closed",
          "selected",
          "unselected",
          "autocompleted",
          "added",
          "deleted",
          "modified",
          "played",
          "ended",
          "viewed",
        ],
        l = (function () {
          function e() {
            r()(this, e);
          }
          return (
            u()(e, [
              {
                key: "apply",
                value: function (e) {
                  e.hooks.buildBeacon.tap("TTOBeaconPlugin", function (e, t) {
                    var n,
                      o,
                      r = t.action,
                      i = t.data,
                      u = t.element,
                      a = t.asset,
                      c = t.view;
                    return {
                      timestamp: Date.now(),
                      action: r,
                      asset: a.id,
                      assetData:
                        i ||
                        (null === (n = a.metaData) || void 0 === n
                          ? void 0
                          : n.beacon),
                      assetElement: u,
                      assetType: a.type,
                      view: null == c ? void 0 : c.id,
                      viewData:
                        null == c || null === (o = c.metaData) || void 0 === o
                          ? void 0
                          : o.beacon,
                    };
                  });
                },
              },
            ]),
            e
          );
        })();
    },
  ]).default;
});
