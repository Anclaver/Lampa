(function () {
  'use strict';

  const manifest = {
    type: 'other',
    version: '5.0.7',
    name: 'Favorite Refresh',
    component: 'favorite_refresh'
  };
  Lampa.Manifest.plugins = manifest;

  // STORAGE
  const DELAY_START = 10 * 1000;
  const DELAY_REFRESH = 24 * 60 * 60 * 1000;
  const REFRESH_TIME_KEY = 'favorite_refresh_time';

  const cardType = (card) => card.original_name ? 'tv' : 'movie';
  const isTmdb = (card) => card && card.id && card.poster_path && (!card.source || card.source === 'tmdb');

  function collect() {
    const fav = Lampa.Storage.get('favorite', {});
    const plus = Lampa.Storage.get('favorite_plus', {});

    return [
      { key: 'favorite', cards: (fav.card || []).filter(isTmdb) },
      { key: 'favorite_plus', cards: ((plus.plusTypes && plus.plusTypes.card) || []).filter(isTmdb) }
    ];
  }

  function server(path, options) {
    let url = window.location.origin + path;

    const email = Lampa.Storage.get('account_email');
    if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));

    const uid = Lampa.Storage.get('lampac_unic_id', '');
    if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));

    return fetch(url, options).then((res) => res.json());
  }

  // TMDB
  function tmdbData(card) {
    return new Promise((resolve) => {
      Lampa.Api.sources.tmdb.get(cardType(card) + '/' + card.id, {}, (data) => {
        resolve(data || null);
      }, () => resolve(null));
    });
  }

  function applyTitles(card, data) {
    let changed = false;

    const assign = (field, value) => {
      if (typeof value === 'undefined' || value === card[field]) return;
      card[field] = value;
      changed = true;
    };

    assign('title', data.title || data.name);
    assign('name', data.name);
    assign('original_title', data.original_title || data.original_name);
    assign('original_name', data.original_name);

    return changed;
  }

  // SYNC
  function pushFavorite(cards) {
    server('/bookmark/dump').then((dump) => {
      const rows = (dump && dump.rows) || [];
      const payload = cards.map((card) => {
        const row = rows.filter((r) => String(r.id) === String(card.id))[0];
        return {
          id: card.id,
          card: Lampa.Utils.clearCard(card),
          categories: (row && row.categories) || {}
        };
      });
      return server('/bookmark/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        body: JSON.stringify(payload)
      });
    }).catch(() => {});
  }

  function apply(cards, key, fetched) {
    const changed = cards.filter((card) => {
      const data = fetched[card.id];
      if (!data) return false;

      let touched = applyTitles(card, data);
      if (data.poster_path && data.poster_path !== card.poster_path) {
        card.poster_path = data.poster_path;
        card.img = Lampa.Api.img(data.poster_path, 'w300');
        touched = true;
      }

      return touched;
    });

    if (!changed.length) return [];

    Lampa.Storage.set(key, Lampa.Storage.get(key, {}));
    if (key === 'favorite') pushFavorite(changed);
    return changed;
  }

  function run() {
    const groups = collect();

    const queue = [];
    const seen = {};
    groups.forEach((group) => group.cards.forEach((card) => {
      if (!seen[card.id]) { seen[card.id] = true; queue.push(card); }
    }));

    const fetched = {};
    Promise.all(queue.map((card, i) => new Promise((resolve) => {
      setTimeout(() => tmdbData(card).then((data) => {
        fetched[card.id] = data;
        resolve();
      }), i * 250);
    }))).then(() => {
      const updated = new Map();
      groups.forEach((group) => apply(group.cards, group.key, fetched).forEach((card) => updated.set(card.id, card)));

      const list = [...updated.values()];
      console.log('Favorite Refresh', list.map((card) => card.id + ': ' + (card.title || card.name)));

      if (!queue.length || queue.some((card) => fetched[card.id])) Lampa.Storage.set(REFRESH_TIME_KEY, Date.now());
    });
  }

  // INIT
  function start() {
    if (window.favorite_refresh) return;
    window.favorite_refresh = true;

    window.favoriteRefreshNow = () => run();

    const check = () => {
      if (Date.now() - Lampa.Storage.get(REFRESH_TIME_KEY, 0) < DELAY_REFRESH) return;
      run();
    };

    setTimeout(check, DELAY_START);
  }

  if (window.appready) start();
  else Lampa.Listener.follow('app', (event) => { if (event.type === 'ready') start(); });

})();
