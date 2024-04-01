import jsBeautify from "js-beautify";

/**
 * 获取给定值的原型类型名称
 * @param value
 * @returns
 */
export function getPrototype(value: any): string {
  return Object.prototype.toString
    .call(value)
    .replace(/^\[object (\S+)\]$/, "$1")
    .toLowerCase();
}

/**
 *
 * @param entryScriptContent
 * @param options
 */
// export function beautifyCode(
//   entryScriptContent: any,
//   options: { indent_size: any }
// ) {
//   const jsBeautify: any = require("js-beautify");
//   const jsBeautifyOptions: any = {
//     indent_size: options.indent_size,
//     indent_char: "",
//     indent_with_tabs: true,
//     eol: "\n",
//     brace_style: "collapse-preserve-inline",
//   };
//
//   // 用于匹配 JavaScript 中的对象字面量或代码块。
//   const braceRegExp = /\{[\s\S]*\}/g;
//   // 是匹配代码中的圆括号 ()，通常用于匹配 JavaScript 函数的参数列表或表达式的分组。
//   const parenthesisRegExp = /\((.*)\)/g;
//
//   // vm body init
//   window.Vue2ToCompositionApiVmBody = {};
//   // eslint-disable-next-line @typescript-eslint/no-empty-function
//   window.require = function () {};
//   // 先将代码进行格式化
//   const beautifyScriptContent: string = jsBeautify(
//     entryScriptContent,
//     jsBeautifyOptions
//   );
//   // 去除 component，和mixins
//   const modelScriptContent: string | undefined = (function () {
//     const componentsRegExp = /components: ((\{\})|(\{[\s\S]+?\}))[,\n]/;
//     const mixinsRegExp = /mixins: ((\[\])|(\[([\s\S]+?)\]))[,\n]/;
//     return beautifyScriptContent
//       .match(braceRegExp)?.[0]
//       .replace(componentsRegExp, "")
//       .replace(mixinsRegExp, "");
//   })();
//   if (modelScriptContent) {
//     eval(`window.Vue2ToCompositionApiVmBody = ${modelScriptContent}`);
//   } else {
//     throw new Error(`Vue2ToCompositionApi 内容不是有效内容`);
//   }
// }
