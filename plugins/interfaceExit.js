(function () {
  'use strict';

  const manifest = {
    type: 'interface',
    version: '5.0.0',
    name: 'UI Exit',
    component: 'ui_exit'
  };
  Lampa.Manifest.plugins = manifest;

  // EXIT
  let exiting = false;

  // PATCH
  function exitItem(object) {
    return object && object.items ? object.items.find((item) => item.out === true) : null;
  }

  // INIT
  function start() {
    if (window.ui_exit) return;
    window.ui_exit = true;

    const originalSelectShow = Lampa.Select.show;

    Lampa.Select.show = function (object) {
      const item = exitItem(object);

      if (item && typeof object.onSelect === 'function') {
        if (exiting) return;
        exiting = true;

        object.onSelect(item);

        setTimeout(() => { exiting = false; }, 1000);
        return;
      }

      return originalSelectShow.apply(this, arguments);
    };
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', (e) => { if (e.type === 'ready') start(); });

})();
