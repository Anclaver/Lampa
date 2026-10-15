(function () {
  'use strict';

  const manifest = {
    type: 'interface',
    version: '5.3.3',
    name: 'UI Style',
    component: 'ui_style'
  };
  Lampa.Manifest.plugins = manifest;

  // FULL
  function fullStart() {
    const style = document.createElement('style');
    style.textContent = `
      .full-start-new__title-original { font-size: 1.6em; margin-bottom: 0em; }
      .full-start-new__buttons .full-start__button:not(.focus) span { display: unset; }
      .source--name { display: none; }
    `;
    document.head.appendChild(style);

    Lampa.Listener.follow('full', (e) => {
      if (e.type !== 'complite') return;
      // TITLE
      const title = e.data.movie.title;
      const titleOriginal = e.data.movie.original_title;
      const titleElement = e.body.find('.full-start-new__title');
      if (title && titleOriginal && title !== titleOriginal) {
        titleElement.before($('<div class="full-start-new__title-original"></div>').text(titleOriginal));
      }

      // BUTTONS
      const buttonsContainer = e.body.find('.full-start-new__buttons');
      const buttonOnline = e.body.find('.view--online');
      const buttonTorrent = e.body.find('.view--torrent');
      const buttonBook = e.body.find('.button--book');
      buttonsContainer.children('.full-start__button')
        .not(buttonOnline).not(buttonTorrent).not(buttonBook)
        .remove();

      [buttonOnline, buttonTorrent, buttonBook].forEach((button) => {
        if (button.length) buttonsContainer.append(button);
      });
    });
  }

  // EXIT
  function exitStart() {
    let exiting = false;

    function exitItem(object) {
      return object && object.items ? object.items.find((item) => item.out === true) : null;
    }

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

  // MOBILE
  function mobileStart() {
    const BAR_ACTION = 'favorite';
    const barOrders = { main: 2, search: 4, settings: 5 };

    function barClick() {
      const item = document.querySelector('.menu__item[data-action="' + BAR_ACTION + '"]');
      if (!item) return;
      $(item).trigger('hover:enter');
      if (Lampa.Menu && Lampa.Menu.close) Lampa.Menu.close();
    }

    function barModify() {
      const bar = document.querySelector('.navigation-bar__body');
      if (!bar || bar.querySelector('.navigation-bar-favorite')) return;
      const back = document.querySelector('.navigation-bar__item[data-action="back"]');
      if (back) back.remove();

      const item = document.querySelector('.menu__item[data-action="' + BAR_ACTION + '"]');
      if (!item) return;
      const textEl = item.querySelector('.menu__text');
      const iconEl = item.querySelector('.menu__ico svg use');
      const title = textEl ? textEl.textContent.trim() : 'Избранное';
      const sprite = iconEl ? iconEl.getAttribute('xlink:href').replace('#sprite-', '') : BAR_ACTION;
      Object.keys(barOrders).forEach((action) => {
        const btn = bar.querySelector('[data-action="' + action + '"]');
        if (btn) btn.style.order = String(barOrders[action]);
      });

      const el = document.createElement('div');
      el.className = 'navigation-bar__item navigation-bar-favorite';
      el.setAttribute('data-action', BAR_ACTION);
      el.style.order = '3';
      el.innerHTML =
        '<div class="navigation-bar__icon"><svg><use xlink:href="#sprite-' + sprite + '"></use></svg></div>' +
        '<div class="navigation-bar__label">' + title + '</div>';
      el.addEventListener('click', barClick);

      bar.appendChild(el);
    }

    barModify();
  }

  // INIT
  function start() {
    if (window.ui_style) return;
    window.ui_style = true;

    fullStart();
    exitStart();
    if (Lampa.Platform.screen('mobile')) mobileStart();
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', (event) => { if (event.type === 'ready') start(); });

})();
