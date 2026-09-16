(function () {
  var config = globalThis.DSE2027_CONFIG;
  var math = globalThis.DSECountdown;
  if (!config || !math) return;

  var clockEl = document.getElementById("hk-clock");
  var gridEl = document.getElementById("subject-grid");
  var heroBook = document.querySelector(".hero-book");
  var subjects = config.subjects.slice();
  var hero = subjects.find(function (item) {
    return item.hero;
  });
  var others = subjects.filter(function (item) {
    return !item.hero;
  });

  var hkClockFmt = new Intl.DateTimeFormat("zh-Hant-HK", {
    timeZone: config.timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  var hkDateTimeFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: config.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  function subjectTarget(subject) {
    return math.examTimestamp(
      subject.date,
      subject.startTime || config.defaultStartTime
    );
  }

  function hongKongToday() {
    return hkDateTimeFmt.format(new Date());
  }

  function urgencyLabel(subject, parts) {
    if (parts.done) return "";
    if (subject.date === hongKongToday()) return "今日開考";
    if (parts.days === 0) return "今日開考";
    if (parts.days === 1) return "明日開考";
    return "";
  }

  function updateClock() {
    if (!clockEl) return;
    var now = new Date();
    clockEl.textContent = hkClockFmt.format(now);
    clockEl.setAttribute("datetime", now.toISOString());
  }

  function updateCountdown(root, parts) {
    var daysEl = root.querySelector(".js-days");
    var hoursEl = root.querySelector(".js-hours");
    var minutesEl = root.querySelector(".js-minutes");
    var secondsEl = root.querySelector(".js-seconds");
    var dayWidth = parts.days >= 100 ? 3 : 2;
    if (daysEl) daysEl.textContent = math.pad(parts.days, dayWidth);
    if (hoursEl) hoursEl.textContent = math.pad(parts.hours, 2);
    if (minutesEl) minutesEl.textContent = math.pad(parts.minutes, 2);
    if (secondsEl) secondsEl.textContent = math.pad(parts.seconds, 2);
  }

  function setDoneState(card, done) {
    card.classList.toggle("is-done", done);
    var doneEl = card.querySelector(".done-state");
    if (doneEl) doneEl.hidden = !done;
  }

  function nextUpcomingId(nowMs) {
    var upcoming = others
      .map(function (subject) {
        return { id: subject.id, t: subjectTarget(subject) };
      })
      .filter(function (item) {
        return item.t > nowMs;
      })
      .sort(function (a, b) {
        return a.t - b.t;
      });
    return upcoming.length ? upcoming[0].id : null;
  }

  function tick() {
    var now = Date.now();
    var nextId = nextUpcomingId(now);
    updateClock();

    document.querySelectorAll("[data-countdown]").forEach(function (node) {
      var id = node.getAttribute("data-countdown");
      var subject = subjects.find(function (item) {
        return item.id === id;
      });
      if (!subject) return;
      var parts = math.remaining(subjectTarget(subject), now);
      var card = node.closest(".card, .hero-book");
      updateCountdown(node, parts);
      if (card) {
        setDoneState(card, parts.done);
        card.classList.toggle("is-next", !subject.hero && id === nextId);
        card.classList.toggle(
          "is-today",
          !parts.done && (subject.date === hongKongToday() || parts.days === 0)
        );
        var badge = card.querySelector(".js-badge");
        if (badge) {
          var label = urgencyLabel(subject, parts);
          badge.textContent = label;
          badge.hidden = !label;
        }
      }
    });

    if (heroBook && hero) {
      var heroParts = math.remaining(subjectTarget(hero), now);
      var caption = heroBook.querySelector(".js-live-caption");
      if (caption && !heroParts.done) {
        caption.textContent = urgencyLabel(hero, heroParts) || "距離開考";
      }
    }
  }

  function countdownMarkup(id, extraClass) {
    return (
      '<div class="countdown ' +
      (extraClass || "") +
      '" data-countdown="' +
      id +
      '" role="timer" aria-live="off">' +
      '<div class="unit"><span class="unit-value js-days">--</span><span class="unit-label">天</span></div>' +
      '<div class="unit"><span class="unit-value js-hours">--</span><span class="unit-label">時</span></div>' +
      '<div class="unit"><span class="unit-value js-minutes">--</span><span class="unit-label">分</span></div>' +
      '<div class="unit"><span class="unit-value js-seconds">--</span><span class="unit-label">秒</span></div>' +
      "</div>"
    );
  }

  function renderHeroDetails() {
    if (!hero) return;
    var when = document.getElementById("hero-when");
    var sub = document.getElementById("hero-sub");
    var title = document.getElementById("hero-title");
    if (title) title.textContent = hero.name;
    if (when) {
      when.textContent =
        math.formatHongKongDate(hero.date) + "（" + hero.weekday + "）";
    }
    if (sub) {
      sub.textContent =
        hero.subtitle +
        " · " +
        math.formatStartTime(hero.startTime || config.defaultStartTime) +
        "開考";
    }
  }

  function renderCards() {
    if (!gridEl) return;
    gridEl.innerHTML = others
      .map(function (subject) {
        return (
          '<article class="card" data-subject-id="' +
          subject.id +
          '">' +
          '<div class="card-top">' +
          "<div>" +
          '<h3 class="card-name">' +
          subject.name +
          "</h3>" +
          '<p class="card-sub">' +
          subject.subtitle +
          '</p>' +
          '<p class="badge js-badge" hidden></p>' +
          "</div>" +
          '<span class="weekday">' +
          subject.weekday +
          "</span>" +
          "</div>" +
          '<p class="card-date">' +
          math.formatHongKongDate(subject.date) +
          " · " +
          math.formatStartTime(subject.startTime || config.defaultStartTime) +
          "</p>" +
          countdownMarkup(subject.id) +
          '<div class="done-state" hidden><p class="done-label">已考完</p></div>' +
          "</article>"
        );
      })
      .join("");
  }

  function scheduleTick() {
    tick();
    var delay = 1000 - (Date.now() % 1000);
    window.setTimeout(scheduleTick, delay);
  }

  renderHeroDetails();
  renderCards();
  scheduleTick();
})();
