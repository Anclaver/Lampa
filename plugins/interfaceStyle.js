(function () {
  'use strict';

  const manifest = {
    type: 'interface',
    version: '5.2.3',
    name: 'UI Style',
    component: 'ui_style'
  };
  Lampa.Manifest.plugins = manifest;

  // STYLES
  const style = document.createElement('style');
  style.textContent = `
    .full-start-new__buttons .full-start__button:not(.focus) span { display: unset; }
    .full-start-new__title-original { font-size: 1.6em; margin-bottom: 0em; }
    .source--name { display: none; }

    .time-line > div,
    .torrent-serial__progress,
    .player-panel__position,
    .player-panel__position > div:after { background-color: #3498DB }

    .loading-layer__box { width: 240px; }
    .loading-layer__text { font-size: 1.2em; line-height: 1.2; tab-size: 6; white-space: pre-wrap; }
  `;
  document.head.appendChild(style);

  // SIZE
  const originalLine = Lampa.Maker.map('Line').Items.onInit;
  Lampa.Maker.map('Line').Items.onInit = function () {
    originalLine.call(this);
    this.view = 12;
  };
  const originalCategory = Lampa.Maker.map('Category').Items.onInit;
  Lampa.Maker.map('Category').Items.onInit = function () {
    originalCategory.call(this);
    this.limit_view = 12;
  };

  Lampa.Params.select('interface_size', { '10': '10', '12': '12', '14': '14' }, '12');
  const getSize = () => Lampa.Platform.screen('mobile') ? 10 : parseInt(Lampa.Storage.field('interface_size')) || 12;
  const updateSize = () => $('body').css({ fontSize: getSize() + 'px' });
  updateSize();
  Lampa.Storage.listener.follow('change', (e) => {
    if (e.name == 'interface_size') updateSize();
  });

  // FULL
  Lampa.Listener.follow('full', (e) => {
    if (e.type !== 'complite') return;

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

    // TITLE
    const title = e.data.movie.title;
    const titleOriginal = e.data.movie.original_title;
    const titleElement = e.body.find('.full-start-new__title');

    if (title && titleOriginal && title !== titleOriginal) {
      titleElement.before($('<div class="full-start-new__title-original"></div>').text(titleOriginal));
    }
  });

})();
