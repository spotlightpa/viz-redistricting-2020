// Polyfill String.raw for Android Webview
let raw =
  String?.raw ||
  function raw(strs, ...substs) {
    let result = [];
    let i = 0;
    for (let subst of substs) {
      result.push(strs.raw[i]);
      result.push(subst);
      i++;
    }
    result.push(strs.raw[i]);
    return result.join("");
  };

export function urlStr(strs, ...substs) {
  return raw(strs, ...substs.map((s) => encodeURIComponent(s)));
}

const htmlEscapeRegex = /[&<>'"]/g;
const htmlEscapeReplacements = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
};

function htmlEscape(s) {
  return String(s).replace(htmlEscapeRegex, (m) => htmlEscapeReplacements[m]);
}

export function htmlStr(strs, ...substs) {
  console.log(raw(strs, ...substs.map(htmlEscape)))
  return raw(strs, ...substs.map(htmlEscape));
}
