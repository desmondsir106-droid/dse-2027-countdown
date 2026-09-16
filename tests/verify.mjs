import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = { globalThis: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "js/config.js"), "utf8"), context);
vm.runInContext(
  fs.readFileSync(path.join(root, "js/countdown.js"), "utf8"),
  context
);

const config = context.DSE2027_CONFIG;
const math = context.DSECountdown;
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(config && Array.isArray(config.subjects), "config.subjects 必須存在");
assert(config.timezone === "Asia/Hong_Kong", "時區必須是 Asia/Hong_Kong");
assert(config.defaultStartTime === "08:30:00", "預設上午開考必須是 08:30:00");
assert(config.subjects.length === 21, "應有 21 個已確認科目，實際：" + config.subjects.length);

const names = config.subjects.map((item) => item.name);
const expected = [
  "視覺藝術",
  "中國文學",
  "中國語文",
  "英國語文（一）及（二）",
  "英國語文（三）（聆聽及綜合能力）",
  "數學必修部分",
  "公民與社會發展",
  "健康管理與社會關懷",
  "化學",
  "地理",
  "資訊及通訊科技",
  "生物",
  "設計與應用科技",
  "物理",
  "經濟",
  "數學延伸部分（單元一及二）",
  "中國歷史",
  "企業、會計與財務概論",
  "歷史",
  "旅遊與款待",
  "倫理與宗教",
];

expected.forEach((name) => {
  assert(names.includes(name), "缺少科目：" + name);
});

const omitted = ["英語文學", "科技與生活", "體育", "音樂", "後備"];
omitted.forEach((name) => {
  assert(
    names.every((item) => !item.includes(name)),
    "不應列出未確認科目：" + name
  );
});

const dates = config.subjects.map((item) => item.date);
assert(!dates.includes("2027-04-29"), "不應列出 4 月 29 日");
assert(!dates.includes("2027-05-03"), "不應列出 5 月 3 日");
assert(!dates.includes("2027-05-04"), "不應列出後備日 5 月 4 日");

const onApr7 = config.subjects.filter((item) => item.date === "2027-04-07");
assert(
  onApr7.length === 1 && onApr7[0].name === "中國文學",
  "4 月 7 日只應顯示中國文學"
);

const onApr20 = config.subjects.filter((item) => item.date === "2027-04-20");
assert(
  onApr20.length === 1 && onApr20[0].name === "設計與應用科技",
  "4 月 20 日只應顯示設計與應用科技"
);

const heroes = config.subjects.filter((item) => item.hero);
assert(heroes.length === 1, "只能有一個 hero 科目");
assert(heroes[0].name === "中國語文", "hero 必須是中國語文");
assert(heroes[0].date === "2027-04-08", "中國語文日期必須是 2027-04-08");
assert(heroes[0].startTime === "08:30:00", "中國語文必須是 08:30");

const chiTarget = math.examTimestamp("2027-04-08", "08:30:00");
assert(
  chiTarget === Date.parse("2027-04-08T00:30:00.000Z"),
  "中國語文目標必須等於 2027-04-08 08:30 HKT（UTC 00:30）"
);

const future = math.remaining(chiTarget, Date.parse("2027-04-01T00:30:00.000Z"));
assert(!future.done && future.days === 7 && future.hours === 0, "倒數日數計算錯誤");

const past = math.remaining(chiTarget, Date.parse("2027-04-08T00:30:00.000Z"));
assert(past.done, "到達開考時間應為已考完");
assert(
  past.days === 0 && past.hours === 0 && past.minutes === 0 && past.seconds === 0,
  "已考完不應出現負數"
);

const almost = math.remaining(chiTarget, Date.parse("2027-04-08T00:29:59.000Z"));
assert(
  !almost.done && almost.days === 0 && almost.hours === 0 && almost.minutes === 0 && almost.seconds === 1,
  "開考前 1 秒應顯示 1 秒"
);

assert(math.pad(3, 2) === "03", "pad 兩位數錯誤");
assert(math.pad(203, 3) === "203", "pad 三位數錯誤");
assert(math.formatHongKongDate("2027-04-08") === "2027年4月8日", "日期格式錯誤");
assert(math.formatStartTime("08:30:00") === "上午 8 時 30 分", "開考時間格式錯誤");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assert(html.includes("<title>2027 DSE 考試倒數</title>"), "頁面標題不正確");
assert(html.includes('lang="zh-Hant-HK"'), "html lang 必須是 zh-Hant-HK");
assert(
  html.includes("數據來自 HKEAA 2027 考試時間表；AM 以 08:30 香港時間計算"),
  "頁尾說明文字缺失"
);

const css = fs.readFileSync(path.join(root, "css/style.css"), "utf8");
assert(css.includes("prefers-reduced-motion"), "CSS 必須尊重 prefers-reduced-motion");

if (failures.length) {
  console.error("FAIL\n" + failures.map((item) => "- " + item).join("\n"));
  process.exit(1);
}

console.log("OK: 21 科已確認、中國語文 hero 08:30 HKT、未落實科目已省略、倒數不會變負數。");
