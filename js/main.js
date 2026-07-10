/* ═══════════════════════════════════════════════════════
   MYATA MEDIA — интерактив
   reveal · счётчики · ТВ-эфир · путь гостя · карта · форма
   ═══════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── NAV: фон при скролле + мобильное меню ── */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  var navLinks = document.getElementById("navLinks");

  function onNavScroll() {
    if (window.scrollY > 30) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  document.addEventListener("scroll", onNavScroll, { passive: true });
  onNavScroll();

  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    document.documentElement.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  }
  if (burger) {
    burger.addEventListener("click", function () {
      setMenu(!document.body.classList.contains("menu-open"));
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && document.body.classList.contains("menu-open")) {
        setMenu(false);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (!document.body.classList.contains("menu-open")) return;
      if (e.key === "Escape") {
        setMenu(false);
        burger.focus();
      } else if (e.key === "Tab") {
        // держим фокус внутри оверлея: бургер + ссылки меню
        var items = [burger].concat(Array.prototype.slice.call(navLinks.querySelectorAll("a")));
        var i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          items[items.length - 1].focus();
        } else if (!e.shiftKey && (i === items.length - 1 || i === -1)) {
          e.preventDefault();
          items[0].focus();
        }
      }
    });
  }

  /* ── REVEAL при появлении в вьюпорте ── */
  var revealEls = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            revealIO.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ── СЧЁТЧИКИ ── */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1600;
    var t0 = null;
    if (reduceMotion) {
      el.textContent = target.toLocaleString("ru-RU") + suffix;
      return;
    }
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString("ru-RU") + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var countEls = document.querySelectorAll("[data-count]");
  if (!reduceMotion) {
    // в разметке стоят финальные значения (для no-JS) — перед анимацией обнуляем
    countEls.forEach(function (el) { el.textContent = "0"; });
  }
  if ("IntersectionObserver" in window) {
    var countIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            animateCount(en.target);
            countIO.unobserve(en.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    countEls.forEach(function (el) { countIO.observe(el); });
  } else {
    countEls.forEach(animateCount);
  }

  /* ── ГРАФИК ДАШБОРДА ── */
  var chart = document.getElementById("dashChart");
  if (chart && "IntersectionObserver" in window) {
    var chartIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            chart.classList.add("is-in");
            chartIO.unobserve(chart);
          }
        });
      },
      { threshold: 0.35 }
    );
    chartIO.observe(chart);
  } else if (chart) {
    chart.classList.add("is-in");
  }

  /* ── ТВ-ЭФИР: ротация слайдов ── */
  var tv = document.getElementById("tvMock");
  if (tv) {
    var slides = tv.querySelectorAll(".tv__slide");
    var dots = tv.querySelectorAll(".tv__dot");
    var cur = 0;
    var tvTimer = null;

    function tvNext() {
      slides[cur].classList.remove("is-on");
      dots[cur].classList.remove("is-on");
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add("is-on");
      dots[cur].classList.add("is-on");
    }
    function tvStart() {
      if (!tvTimer && !reduceMotion) tvTimer = setInterval(tvNext, 3400);
    }
    function tvStop() {
      if (tvTimer) { clearInterval(tvTimer); tvTimer = null; }
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) tvStart();
            else tvStop();
          });
        },
        { threshold: 0.25 }
      ).observe(tv);
    } else {
      tvStart();
    }
  }

  /* ── ПУТЬ ГОСТЯ: прогресс по скроллу sticky-сцены ── */
  var jWrap = document.getElementById("journeyWrap");
  var jProgress = document.getElementById("journeyProgress");
  var jSteps = document.querySelectorAll(".jstep");
  var isMobileJourney = window.matchMedia("(max-width: 760px)");

  function journeyTick() {
    if (!jWrap || isMobileJourney.matches) return;
    var rect = jWrap.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return;
    var passed = Math.min(Math.max(-rect.top, 0), total);
    var p = passed / total;
    if (jProgress) jProgress.style.width = (p * 100) + "%";
    jSteps.forEach(function (step, i) {
      var threshold = i / jSteps.length + 0.06;
      step.classList.toggle("is-on", p >= threshold);
    });
  }
  if (jWrap && !reduceMotion) {
    document.addEventListener("scroll", journeyTick, { passive: true });
    window.addEventListener("resize", journeyTick);
    journeyTick();
  } else {
    jSteps.forEach(function (s) { s.classList.add("is-on"); });
    if (jProgress) jProgress.style.width = "100%";
  }

  /* ── ЛЁГКИЙ ПАРАЛЛАКС ФОТО ── */
  var parallaxImgs = document.querySelectorAll(".aphoto img, .strip__item img, .channel__photo img");
  var pTicking = false;
  function parallaxTick() {
    parallaxImgs.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      img.style.transform = "translateY(" + (p * -7).toFixed(2) + "%)";
    });
    pTicking = false;
  }
  if (parallaxImgs.length && !reduceMotion) {
    document.addEventListener("scroll", function () {
      if (!pTicking) {
        pTicking = true;
        requestAnimationFrame(parallaxTick);
      }
    }, { passive: true });
    parallaxTick();
  }

  /* ── КАРТА ПОКРЫТИЯ: констелляция городов ── */
  var canvas = document.getElementById("mapCanvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    // города: нормированные координаты по силуэту России (x слева-направо, y сверху-вниз)
    var cities = [
      { n: "Калининград", x: 0.025, y: 0.36 },
      { n: "Санкт-Петербург", x: 0.115, y: 0.24, big: true },
      { n: "Мурманск", x: 0.155, y: 0.06 },
      { n: "Москва", x: 0.155, y: 0.38, big: true },
      { n: "Воронеж", x: 0.16, y: 0.5 },
      { n: "Ростов-на-Дону", x: 0.148, y: 0.62 },
      { n: "Краснодар", x: 0.13, y: 0.7 },
      { n: "Сочи", x: 0.155, y: 0.78, big: true },
      { n: "Нижний Новгород", x: 0.21, y: 0.37 },
      { n: "Казань", x: 0.255, y: 0.4, big: true },
      { n: "Самара", x: 0.252, y: 0.51 },
      { n: "Уфа", x: 0.3, y: 0.47 },
      { n: "Пермь", x: 0.3, y: 0.33 },
      { n: "Екатеринбург", x: 0.34, y: 0.38, big: true },
      { n: "Челябинск", x: 0.342, y: 0.47 },
      { n: "Тюмень", x: 0.385, y: 0.37 },
      { n: "Сургут", x: 0.42, y: 0.25 },
      { n: "Омск", x: 0.445, y: 0.48 },
      { n: "Новосибирск", x: 0.5, y: 0.52, big: true },
      { n: "Кемерово", x: 0.545, y: 0.49 },
      { n: "Красноярск", x: 0.575, y: 0.41, big: true },
      { n: "Норильск", x: 0.55, y: 0.1 },
      { n: "Иркутск", x: 0.645, y: 0.55 },
      { n: "Улан-Удэ", x: 0.685, y: 0.56 },
      { n: "Якутск", x: 0.755, y: 0.26 },
      { n: "Хабаровск", x: 0.875, y: 0.55 },
      { n: "Владивосток", x: 0.895, y: 0.68, big: true }
    ];
    // связи между узлами (индексы) — «маршруты сети»
    var links = [
      [0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6], [6, 7],
      [3, 8], [8, 9], [9, 10], [10, 11], [9, 12], [12, 13], [13, 14],
      [13, 15], [15, 16], [15, 17], [17, 18], [18, 19], [19, 20],
      [20, 21], [20, 22], [22, 23], [23, 25], [20, 24], [24, 25], [25, 26]
    ];
    var mapW = 0, mapH = 0, mapT = 0;
    var mapVisible = false;
    var mapRAF = null;

    function resizeMap() {
      DPR = Math.min(window.devicePixelRatio || 1, 2); // может меняться: зум, другой монитор
      var r = canvas.getBoundingClientRect();
      mapW = r.width;
      mapH = r.height;
      canvas.width = Math.round(mapW * DPR);
      canvas.height = Math.round(mapH * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      drawMap(mapT);
    }

    function cx(c) { return 40 + c.x * (mapW - 80); }
    function cy(c) { return 30 + c.y * (mapH - 90); }

    function drawMap(t) {
      ctx.clearRect(0, 0, mapW, mapH);

      // связи
      ctx.lineWidth = 1;
      links.forEach(function (l, i) {
        var a = cities[l[0]], b = cities[l[1]];
        ctx.strokeStyle = "rgba(9,186,129,0.16)";
        ctx.beginPath();
        ctx.moveTo(cx(a), cy(a));
        ctx.lineTo(cx(b), cy(b));
        ctx.stroke();

        // бегущий импульс по линии
        var phase = (t * 0.00022 + i * 0.13) % 1;
        var px = cx(a) + (cx(b) - cx(a)) * phase;
        var py = cy(a) + (cy(b) - cy(a)) * phase;
        ctx.fillStyle = "rgba(35,227,166,0.55)";
        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // узлы
      var fontSize = mapW < 700 ? 9 : 11;
      ctx.font = "500 " + fontSize + "px 'SF Mono', Consolas, monospace";
      cities.forEach(function (c, i) {
        var x = cx(c), y = cy(c);
        var r = c.big ? 4 : 2.4;
        var pulse = c.big ? 1 + 0.25 * Math.sin(t * 0.0016 + i) : 1;

        if (c.big) {
          var g = ctx.createRadialGradient(x, y, 0, x, y, 20 * pulse);
          g.addColorStop(0, "rgba(9,186,129,0.35)");
          g.addColorStop(1, "rgba(9,186,129,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, 20 * pulse, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = c.big ? "#23e3a6" : "rgba(154,163,158,0.75)";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        if (c.big && (mapW > 560 || ["Москва", "Новосибирск", "Владивосток"].indexOf(c.n) !== -1)) {
          ctx.fillStyle = "rgba(241,244,242,0.82)";
          // правые города подписываем влево от точки, чтобы текст не резался краем canvas
          if (c.x > 0.8) {
            ctx.textAlign = "right";
            ctx.fillText(c.n, x - 9, y - 8);
          } else {
            ctx.textAlign = "left";
            ctx.fillText(c.n, x + 9, y - 8);
          }
        }
      });
    }

    function mapLoop(t) {
      mapT = t;
      drawMap(t);
      if (mapVisible && !reduceMotion) mapRAF = requestAnimationFrame(mapLoop);
      else mapRAF = null;
    }

    resizeMap();
    window.addEventListener("resize", resizeMap);

    if ("IntersectionObserver" in window && !reduceMotion) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            mapVisible = en.isIntersecting;
            if (mapVisible && !mapRAF) mapRAF = requestAnimationFrame(mapLoop);
          });
        },
        { threshold: 0.1 }
      ).observe(canvas);
    }
  }

  /* ── ФОРМА ЗАЯВКИ ── */
  // TODO: заменить на реальный адрес отдела продаж / подключить веб-хук
  var LEAD_EMAIL = "media@myata.com";
  var form = document.getElementById("leadForm");
  var note = document.getElementById("formNote");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      note.classList.remove("is-err");

      // honeypot: боту — тихий «успех»
      if (form.website.value) {
        note.textContent = "Заявка отправлена. Свяжемся с вами в течение рабочего дня.";
        form.reset();
        return;
      }

      var badFields = [];
      var labels = { company: "Компания", name: "Контактное лицо", contact: "Телефон или email" };
      ["company", "name", "contact"].forEach(function (name) {
        var input = form[name];
        var ok = input.value.trim().length >= 2;
        input.classList.toggle("is-bad", !ok);
        if (ok) input.removeAttribute("aria-invalid");
        else {
          input.setAttribute("aria-invalid", "true");
          badFields.push({ input: input, label: labels[name] });
        }
      });
      if (badFields.length) {
        note.textContent = "Заполните, пожалуйста: " + badFields.map(function (f) { return f.label; }).join(", ") + ".";
        note.classList.add("is-err");
        badFields[0].input.focus();
        return;
      }

      var subject = "Заявка на рекламу в MYATA MEDIA — " + form.company.value.trim();
      var body =
        "Компания: " + form.company.value.trim() +
        "\nКонтактное лицо: " + form.name.value.trim() +
        "\nКонтакт: " + form.contact.value.trim() +
        "\nИнтересует: " + form.channel.value +
        (form.message.value.trim() ? "\nКомментарий: " + form.message.value.trim() : "");

      window.location.href =
        "mailto:" + LEAD_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      note.textContent = "Сейчас откроется письмо с вашей заявкой — проверьте и нажмите «Отправить» в почтовом клиенте.";
    });

    form.addEventListener("input", function (e) {
      if (e.target.classList) {
        e.target.classList.remove("is-bad");
        e.target.removeAttribute("aria-invalid");
      }
    });
  }

  /* ── ТИКЕР: собираем бесшовную ленту ──
     половина трека должна быть шире вьюпорта (иначе на широких экранах в конце
     цикла виден разрыв); анимация -50% совпадает с периодом, т.к. отступы
     сделаны margin-right (каждая копия несёт свой хвостовой отступ) */
  var tickerTrack = document.getElementById("tickerTrack");
  if (tickerTrack) {
    var tickerBase = tickerTrack.innerHTML;
    var guard = 0;
    while (tickerTrack.scrollWidth < window.innerWidth + 120 && guard < 6) {
      tickerTrack.innerHTML += tickerBase;
      guard++;
    }
    tickerTrack.innerHTML += tickerTrack.innerHTML;
  }
})();
