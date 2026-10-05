/* Funciones del sitio: menú, carrito, filtros y formulario. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var CART_KEY = 'martina-cart';

  /* Utilidades */
  function money(n) {
    return '\u20A1' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  var toastTimer;
  function toast(message) {
    var box = document.getElementById('toast');
    if (!box) { return; }
    box.textContent = message;
    box.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('is-visible'); }, 2600);
  }

  /* Carrito */
  function readCart() {
    try {
      var data = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* localStorage no disponible */ }
    updateCount(cart);
  }

  function updateCount(cart) {
    var total = (cart || readCart()).reduce(function (sum, it) { return sum + it.qty; }, 0);
    var badges = document.querySelectorAll('[data-cart-count]');
    Array.prototype.forEach.call(badges, function (b) { b.textContent = total > 0 ? String(total) : ''; });
    var link = document.querySelector('.cart-link');
    if (link) {
      link.setAttribute('aria-label', 'Carrito de compras, ' + total + (total === 1 ? ' producto' : ' productos'));
    }
  }

  function addToCart(card) {
    var d = card.dataset;
    var cart = readCart();
    var found = cart.filter(function (it) { return it.id === d.id; })[0];
    if (found) {
      found.qty += 1;
    } else {
      cart.push({ id: d.id, nombre: d.nombre, precio: Number(d.precio), img: d.img || '', info: d.info || '', qty: 1 });
    }
    writeCart(cart);
    toast('\u201C' + d.nombre + '\u201D se agreg\u00F3 al carrito');
  }

  function initAddButtons() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-add]');
      if (!btn) { return; }
      var card = btn.closest('.product-card');
      if (!card) { return; }
      addToCart(card);
      var label = btn.textContent;
      btn.textContent = '\u00A1Agregado!';
      btn.disabled = true;
      setTimeout(function () { btn.textContent = label; btn.disabled = false; }, 1200);
    });
  }

  function renderCart() {
    var list = document.getElementById('cart-items');
    if (!list) { return; }
    var lines = document.getElementById('cart-lines');
    var totalEl = document.getElementById('cart-total');
    var buy = document.getElementById('cart-buy');
    var clear = document.getElementById('cart-clear');
    var cart = readCart();

    list.textContent = '';
    lines.textContent = '';

    if (cart.length === 0) {
      var empty = el('li', 'cart__empty');
      empty.appendChild(el('p', null, 'Tu carrito est\u00E1 vac\u00EDo. Explora el cat\u00E1logo y agrega las piezas que te gusten.'));
      var go = el('a', 'btn', 'Ver productos');
      go.href = 'productos.html';
      empty.appendChild(go);
      list.appendChild(empty);
    }

    cart.forEach(function (it) {
      var li = el('li', 'cart-item');

      var media = el('div', 'cart-item__media');
      if (it.img) {
        var img = el('img', 'cart-item__img');
        img.src = it.img;
        img.alt = it.nombre;
        img.width = 274;
        img.height = 284;
        media.appendChild(img);
      } else {
        media.appendChild(el('div', 'placeholder', 'Foto pr\u00F3ximamente'));
      }
      li.appendChild(media);

      var head = el('div', 'cart-item__head');
      head.appendChild(el('span', null, it.nombre));
      head.appendChild(el('span', null, money(it.precio * it.qty)));
      li.appendChild(head);
      if (it.info) { li.appendChild(el('p', 'cart-item__info', it.info)); }

      var controls = el('div', 'cart-item__controls');
      var qty = el('div', 'qty');
      var minus = el('button', 'qty__btn', '\u2212');
      minus.type = 'button';
      minus.dataset.action = 'dec';
      minus.dataset.id = it.id;
      minus.setAttribute('aria-label', 'Quitar una unidad de ' + it.nombre);
      var value = el('span', 'qty__value', String(it.qty));
      var plus = el('button', 'qty__btn', '+');
      plus.type = 'button';
      plus.dataset.action = 'inc';
      plus.dataset.id = it.id;
      plus.setAttribute('aria-label', 'Agregar una unidad de ' + it.nombre);
      qty.appendChild(minus);
      qty.appendChild(value);
      qty.appendChild(plus);
      controls.appendChild(qty);

      var remove = el('button', 'cart-item__remove', 'Quitar');
      remove.type = 'button';
      remove.dataset.action = 'remove';
      remove.dataset.id = it.id;
      remove.setAttribute('aria-label', 'Quitar ' + it.nombre + ' del carrito');
      controls.appendChild(remove);
      li.appendChild(controls);
      list.appendChild(li);

      var line = el('li', 'summary__line');
      line.appendChild(el('span', null, it.nombre + (it.qty > 1 ? ' \u00D7 ' + it.qty : '')));
      line.appendChild(el('span', null, money(it.precio * it.qty)));
      lines.appendChild(line);
    });

    var total = cart.reduce(function (sum, it) { return sum + it.precio * it.qty; }, 0);
    totalEl.textContent = money(total);
    buy.disabled = cart.length === 0;
    clear.hidden = cart.length === 0;
  }

  function initCartPage() {
    var list = document.getElementById('cart-items');
    if (!list) { return; }
    renderCart();

    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) { return; }
      var cart = readCart();
      var item = cart.filter(function (it) { return it.id === btn.dataset.id; })[0];
      if (!item) { return; }
      if (btn.dataset.action === 'inc') { item.qty += 1; }
      if (btn.dataset.action === 'dec') { item.qty -= 1; }
      if (btn.dataset.action === 'remove') { item.qty = 0; }
      writeCart(cart.filter(function (it) { return it.qty > 0; }));
      renderCart();
    });

    var clear = document.getElementById('cart-clear');
    clear.addEventListener('click', function () {
      writeCart([]);
      renderCart();
    });

    var dialog = document.getElementById('checkout');
    var buy = document.getElementById('cart-buy');
    var status = document.getElementById('cart-status');
    if (dialog && typeof dialog.showModal === 'function') {
      buy.addEventListener('click', function () {
        document.getElementById('checkout-total').textContent = document.getElementById('cart-total').textContent;
        dialog.showModal();
      });
      document.getElementById('checkout-cancel').addEventListener('click', function () { dialog.close(); });
      document.getElementById('checkout-confirm').addEventListener('click', function () {
        dialog.close();
        writeCart([]);
        renderCart();
        status.hidden = false;
        status.focus();
      });
    }
  }

  /* Navegación */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('menu-principal');
    var chev = document.querySelector('.nav__chev');
    var item = chev ? chev.closest('.nav__item') : null;

    function closeSub() {
      if (!item) { return; }
      item.classList.remove('is-open');
      chev.setAttribute('aria-expanded', 'false');
    }

    function closeMenu() {
      if (!nav) { return; }
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
    }

    if (chev && item) {
      chev.addEventListener('click', function () {
        var open = item.classList.toggle('is-open');
        chev.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function (e) {
        if (!item.contains(e.target)) { closeSub(); }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') { return; }
      var wasOpen = item && item.classList.contains('is-open');
      closeSub();
      closeMenu();
      if (wasOpen) { chev.focus(); }
    });
  }

  /* Catálogo */
  function initCatalog() {
    var grid = document.getElementById('catalogo');
    var form = document.getElementById('filtros');
    if (!grid || !form) { return; }

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.product-card'));
    var search = document.getElementById('buscar');
    var sort = document.getElementById('orden');
    var status = document.getElementById('resultados');
    var empty = document.getElementById('sin-resultados');
    var toggle = document.getElementById('filtros-toggle');
    var panel = document.getElementById('panel-filtros');
    var clearButtons = document.querySelectorAll('[data-clear-filters]');
    var keyMap = { precio: 'precioRango' };

    cards.forEach(function (card, i) { card.dataset.orden = String(i); });

    // Filtros que llegan por URL (p. ej. productos.html?tipo=silla desde el submenú)
    var params = new URLSearchParams(window.location.search);
    params.forEach(function (value, key) {
      Array.prototype.forEach.call(form.querySelectorAll('input[type="checkbox"]'), function (input) {
        if (input.name === key && input.value === value) {
          input.checked = true;
          var group = input.closest('details');
          if (group) { group.open = true; }
        }
      });
    });

    function apply() {
      var checked = {};
      var activeCount = 0;
      Array.prototype.forEach.call(form.querySelectorAll('input:checked'), function (input) {
        (checked[input.name] = checked[input.name] || []).push(input.value);
        activeCount += 1;
      });
      var query = normalize(search.value.trim());
      var visible = 0;

      cards.forEach(function (card) {
        var ok = Object.keys(checked).every(function (name) {
          var values = (card.dataset[keyMap[name] || name] || '').split(' ');
          return checked[name].some(function (v) { return values.indexOf(v) > -1; });
        });
        if (ok && query) { ok = normalize(card.dataset.busqueda).indexOf(query) > -1; }
        card.hidden = !ok;
        if (ok) { visible += 1; }
      });

      var ordered = cards.slice().sort(function (a, b) {
        if (sort.value === 'precio-asc') { return a.dataset.precio - b.dataset.precio; }
        if (sort.value === 'precio-desc') { return b.dataset.precio - a.dataset.precio; }
        return a.dataset.orden - b.dataset.orden;
      });
      ordered.forEach(function (card) { grid.appendChild(card); });

      status.textContent = visible + (visible === 1 ? ' producto' : ' productos');
      empty.hidden = visible !== 0;
      grid.hidden = visible === 0;
      if (toggle) {
        toggle.textContent = activeCount > 0 ? 'Filtros (' + activeCount + ')' : 'Filtros';
      }
    }

    form.addEventListener('change', apply);
    search.addEventListener('input', apply);
    sort.addEventListener('change', apply);
    document.getElementById('buscador').addEventListener('submit', function (e) { e.preventDefault(); });

    Array.prototype.forEach.call(clearButtons, function (btn) {
      btn.addEventListener('click', function () {
        form.reset();
        search.value = '';
        apply();
      });
    });

    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        var open = panel.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }

    apply();
  }

  /* Formulario de contacto */
  function initForm() {
    var form = document.getElementById('form-contacto');
    if (!form) { return; }
    form.noValidate = true; // los mensajes los gestionamos nosotros (en español, junto al campo)

    var fields = Array.prototype.slice.call(form.querySelectorAll('[data-validate]'));

    function messageFor(field) {
      var v = field.validity;
      if (v.valueMissing) {
        return field.type === 'checkbox' ? 'Debes aceptar para poder enviar el mensaje.' : 'Este campo es obligatorio.';
      }
      if (v.typeMismatch) { return 'Escribe un correo v\u00E1lido, por ejemplo nombre@correo.com.'; }
      if (v.tooShort) { return 'Escribe al menos ' + field.minLength + ' caracteres.'; }
      if (v.patternMismatch) { return 'Revisa el formato. Usa solo n\u00FAmeros, espacios, +, ( ) o guiones.'; }
      return 'Revisa este campo.';
    }

    function check(field) {
      var error = document.getElementById(field.id + '-error');
      var message = field.validity.valid ? '' : messageFor(field);
      error.textContent = message;
      field.setAttribute('aria-invalid', message ? 'true' : 'false');
      var wrapper = field.closest('.field');
      if (wrapper) { wrapper.classList.toggle('field--error', Boolean(message)); }
      return !message;
    }

    fields.forEach(function (field) {
      field.addEventListener('blur', function () { check(field); });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') { check(field); }
      });
      field.addEventListener('change', function () { check(field); });
    });

    var area = document.getElementById('mensaje');
    var counter = document.getElementById('mensaje-contador');
    if (area && counter) {
      var update = function () { counter.textContent = area.value.length + ' / ' + area.maxLength; };
      area.addEventListener('input', update);
      update();
    }

    form.addEventListener('submit', function (e) {
      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!check(field) && !firstInvalid) { firstInvalid = field; }
      });
      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
        var status = document.getElementById('form-status');
        status.textContent = 'Revisa los campos marcados antes de enviar.';
        status.hidden = false;
      }
    });
  }

  updateCount();
  initNav();
  initAddButtons();
  initCartPage();
  initCatalog();
  initForm();
})();
