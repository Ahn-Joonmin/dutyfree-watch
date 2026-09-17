const fs = require("fs");
const path = require("path");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "shilla-whisky.json"), "utf8"));
const template = fs.readFileSync(process.argv[2], "utf8");
const scrapedAt = fs.statSync(path.join(__dirname, "..", "data", "shilla-whisky.json")).mtime
  .toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
const out = template
  .replace("__WHISKY_DATA__", JSON.stringify(data))
  .replace("__SCRAPED_AT__", scrapedAt);
fs.writeFileSync(process.argv[3], out);
console.log("built", process.argv[3], out.length, "chars");
