/**
 * 純倒數邏輯，不依賴 DOM，方便本機測試。
 * 目標時間以 ISO「日期T時間+08:00」解析，即香港時間（無夏令時間）。
 */
(function (global) {
  function pad(n, width) {
    var w = width == null ? 2 : width;
    return String(Math.max(0, Math.floor(Number(n) || 0))).padStart(w, "0");
  }

  function examTimestamp(date, time) {
    return Date.parse(String(date) + "T" + String(time) + "+08:00");
  }

  function remaining(targetMs, nowMs) {
    var now = nowMs == null ? Date.now() : nowMs;
    var diff = targetMs - now;
    if (!Number.isFinite(targetMs) || diff <= 0) {
      return {
        done: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalMs: 0,
      };
    }
    var totalSeconds = Math.floor(diff / 1000);
    return {
      done: false,
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      totalMs: diff,
    };
  }

  function formatHongKongDate(date) {
    return (
      String(date).replace(
        /^(\d{4})-(\d{2})-(\d{2})$/,
        function (_, y, m, d) {
          return y + "年" + Number(m) + "月" + Number(d) + "日";
        }
      ) || date
    );
  }

  function formatStartTime(time) {
    var parts = String(time).split(":");
    var hour = Number(parts[0]);
    var minute = parts[1] || "00";
    return "上午 " + hour + " 時 " + Number(minute) + " 分";
  }

  global.DSECountdown = {
    pad: pad,
    examTimestamp: examTimestamp,
    remaining: remaining,
    formatHongKongDate: formatHongKongDate,
    formatStartTime: formatStartTime,
  };
})(typeof window !== "undefined" ? window : globalThis);
