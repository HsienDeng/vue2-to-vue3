declare global {
  interface Window {
    Vue2ToCompositionApiVmBody: any;
    require: any;
  }
}

import {
  VmContent,
  VmKeys,
  IDataSource,
  VmOutput,
  VmSetContentMethods,
  UtilsMethods,
} from "./types";

import { getPrototype } from "../common/shared";

/**
 *
 * @param entryScriptContent 需要转换代码的字符串
 * @param options 配置项
 * @returns
 */
function Vue2ToCompositionApi(
  entryScriptContent = "",
  options: {
    isDebug?: boolean;
    indent_size: string;
  } = {
    isDebug: false,
    indent_size: "4",
  }
): string | undefined {
  // debugger;
  // 如果是非字符串类型，抛出错误
  if (getPrototype(entryScriptContent) !== "string") {
    throw new Error(
      `Vue2ToCompositionApi ${entryScriptContent} is not a string`
    );
  }
  // 如果是非对象类型，抛出错误
  if (getPrototype(options) !== "object") {
    throw new Error(`Vue2ToCompositionApi ${options} is not a object`);
  }
  try {
    // output script content init
    let outputScriptContent = "";

    // js-beautify init
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jsBeautify: any = require("js-beautify");
    const jsBeautifyOptions: any = {
      indent_size: options.indent_size,
      indent_char: "",
      indent_with_tabs: true,
      eol: "\n",
      brace_style: "collapse-preserve-inline",
    };

    // 用于匹配 JavaScript 中的对象字面量或代码块。
    const braceRegExp = /\{[\s\S]*\}/g;
    // 是匹配代码中的圆括号 ()，通常用于匹配 JavaScript 函数的参数列表或表达式的分组。
    const parenthesisRegExp = /\((.*)\)/g;

    // vm body init
    window.Vue2ToCompositionApiVmBody = {};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    window.require = function () {};
    // 先将代码进行格式化
    const beautifyScriptContent: string = jsBeautify(
      entryScriptContent,
      jsBeautifyOptions
    );

    // 去除 component，和mixins，导入的methods
    const modelScriptContent: string | undefined = (function () {
      const componentsRegExp = /components: ((\{\})|(\{[\s\S]+?\}))[,\n]/;
      const mixinsRegExp = /mixins: ((\[\])|(\[([\s\S]+?)\]))[,\n]/;

      return beautifyScriptContent
        .match(braceRegExp)?.[0]
        .replace(componentsRegExp, "")
        .replace(mixinsRegExp, "");
    })();

    if (modelScriptContent) {
      eval(`window.Vue2ToCompositionApiVmBody = ${modelScriptContent}`);
    } else {
      throw new Error(`Vue2ToCompositionApi 内容不是有效内容`);
    }

    // 初步处理后的结果
    const vmBody: any = window.Vue2ToCompositionApiVmBody;

    // 初始化content
    const vmContent: VmContent = {
      props: getPrototype(vmBody.props) === "object" ? vmBody.props : {},
      data:
        getPrototype(vmBody.data).indexOf("function") !== -1
          ? vmBody.data
          : () => ({}),
      dataOptions:
        getPrototype(vmBody.data).indexOf("function") !== -1
          ? vmBody.data()
          : {},
      computed:
        getPrototype(vmBody.computed) === "object" ? vmBody.computed : {},
      watch: getPrototype(vmBody.watch) === "object" ? vmBody.watch : {},
      methods: getPrototype(vmBody.methods) === "object" ? vmBody.methods : {},
      filters: getPrototype(vmBody.filters) === "object" ? vmBody.filters : {},
      hooks: {},
      emits: [],
      refs: [],
      use: {},
      import: { vue: [], "vue-router": [], vuex: [] },
    };

    /**
     * 根据 keyName 获取 dataOptions 中的 apiName
     * @param keyName
     */
    const getDataOptionsApiNameByKeyName = (keyName: string) => {
      const find = vmOutput.dataSource?.find(
        (item: IDataSource) => item.key === keyName
      );
      if (find) {
        return find.type;
      }
      return "";
    };

    // 将所有的生命周期函数放入 hooks 中, 方便后续处理
    for (const prop in vmBody) {
      if (
        [
          "beforeCreate",
          "created",
          "beforeMount",
          "mounted",
          "beforeUpdate",
          "updated",
          "beforeDestroy",
          "destroyed",
          "activated",
          "deactivated",
          "errorCaptured",
        ].includes(prop) &&
        getPrototype(vmBody[prop]).indexOf("function") !== -1
      ) {
        vmContent.hooks[prop] = vmBody[prop];
      }
    }

    // 获取所有的api中的key
    const vmKeys: VmKeys = {
      props: Object.keys(vmContent.props),
      data: Object.keys(vmContent.dataOptions),
      computed: Object.keys(vmContent.computed),
      watch: Object.keys(vmContent.watch),
      methods: Object.keys(vmContent.methods),
      filters: Object.keys(vmContent.filters),
      hooks: Object.keys(vmContent.hooks),
      use: (): any => Object.keys(vmContent.use),
      import: (): any => Object.keys(vmContent.import),
    };

    // 初始化 output
    const vmOutput: VmOutput = {
      import: "",
      use: "",
      props: "",
      emits: "",
      refs: "",
      data: "",
      dataSource: [],
      computed: "",
      watch: "",
      hooks: "",
      methods: "",
      filters: "",
    };

    // vm set content methods init
    const vmSetContentMethods: VmSetContentMethods = {
      props(): void {
        if (vmKeys.props.length > 0) {
          const propsContentStr: string = utilMethods.getContentStr(
            vmContent.props,
            null,
            {
              function: (params: any) => {
                const { type, content } = params;
                if (type === "custom") {
                  return content;
                }
              },
            }
          );
          if (propsContentStr) {
            vmOutput.props = `const props = defineProps(${propsContentStr})`;
            // 某些编辑器可能不识别 defineProps，所以还是需要引入
            utilMethods.addImport("vue", "defineProps");
          }
        }
      },
      data(): void {
        if (vmKeys.data.length > 0) {
          const dataFunctionStr: string = utilMethods.getContentStr(
            vmContent.data,
            true,
            {
              function: (params: any) => {
                const { type, body } = params;
                if (type === "custom") {
                  return body;
                }
              },
            }
          );
          if (dataFunctionStr) {
            const dataContentRegExp = /return ([\s\S]*)\}/;
            const dataContentStr: string =
              dataFunctionStr.match(dataContentRegExp)?.[1] || "{}";
            vmOutput.data = "";
            utilMethods.addImport("vue", "ref");

            const text = {};
            const dataObject = eval(
              `(function(props) {
                return ${dataContentStr};
              })`
            )(text);
            const codeLines: string[] = [];
            const dataSource: Array<IDataSource> = [];
            for (const key in dataObject) {
              if (Object.hasOwnProperty.call(dataObject, key)) {
                const value = dataObject[key];
                // object 处理为 reactive
                // if (getPrototype(value) === "object") {
                //   // 添加导出
                //   utilMethods.addImport("vue", "");
                //   // remove value quotes and push to codeLines
                //   codeLines.push(
                //     `const ${key} = reactive(${JSON.stringify(value, null, 2)
                //       .replace(/"([^"]+)":/g, "$1:")
                //       .replace(/"/g, "'")});`
                //   );

                //   dataSource.push({
                //     key,
                //     type: "reactive",
                //   });
                // } else {
                codeLines.push(`const ${key} = ref(${JSON.stringify(value)});`);
                dataSource.push({
                  key,
                  type: "ref",
                });
                // }
              }
            }
            vmOutput.dataSource = dataSource;
            vmOutput.data = codeLines.join("\n");
          }
        }
      },
      computed(): void {
        if (vmKeys.computed.length > 0) {
          const computedValues: string[] = [];
          for (const prop in vmContent.computed) {
            const computedContent: any = vmContent.computed[prop];
            if (
              computedContent &&
              ["object", "function", "asyncfunction"].includes(
                getPrototype(computedContent)
              )
            ) {
              const computedName: string =
                getPrototype(computedContent).indexOf("function") !== -1
                  ? computedContent.name
                  : prop;
              const computedFunctionStr: string =
                utilMethods.getContentStr(computedContent);
              if (computedName && computedFunctionStr) {
                computedValues.push(
                  `const ${computedName} = computed(${computedFunctionStr})`
                );
              }
            }
          }
          if (computedValues.length > 0) {
            vmOutput.computed = computedValues.join("\n\n");
            utilMethods.addImport("vue", "computed");
            // todo: 未来需要根据是否使用到了 store 来决定是否需要引入
            // utilMethods.addImport("vuex", "useStore");
          }
        }
      },
      watch(): void {
        if (vmKeys.watch.length > 0) {
          const watchValues: string[] = [];
          for (const prop in vmContent.watch) {
            const watchContent: any = vmContent.watch[prop];
            if (getPrototype(watchContent).indexOf("function") !== -1) {
              const watchName: string = utilMethods.replaceKey(
                watchContent.name
              );
              const watchFunctionStr: string =
                utilMethods.getContentStr(watchContent);
              if (watchName && watchFunctionStr) {
                watchValues.push(
                  `watch(() => ${watchName}, ${watchFunctionStr})`
                );
              }
            } else if (
              watchContent &&
              getPrototype(watchContent) === "object" &&
              getPrototype(watchContent.handler).indexOf("function") !== -1
            ) {
              const watchName: string = utilMethods.replaceKey(prop);
              const watchFunctionStr: string = utilMethods.getContentStr(
                watchContent.handler
              );
              const watchOptionsStr: string = utilMethods.getContentStr(
                watchContent,
                null,
                {
                  object: (params: any) => {
                    const { value, values } = params;
                    if (value.handler) {
                      const index = values.findIndex((item: string) =>
                        /^handler:/.test(item)
                      );
                      values.splice(index, 1);
                    }
                    return values.length > 0
                      ? `{\n${values.join(",\n")}\n}`
                      : "{}";
                  },
                }
              );
              if (watchName && watchFunctionStr && watchOptionsStr) {
                watchValues.push(
                  watchOptionsStr !== "{}"
                    ? `watch(() => ${watchName}, ${watchFunctionStr}, ${watchOptionsStr})`
                    : `watch(() => ${watchName}, ${watchFunctionStr})`
                );
              }
            }
          }
          if (watchValues.length > 0) {
            vmOutput.watch = watchValues.join("\n\n");
            utilMethods.addImport("vuex", "useStore");
          }
        }
      },
      hooks(): void {
        if (vmKeys.hooks.length > 0) {
          const hookValues: string[] = [];
          for (const prop in vmContent.hooks) {
            const hookContent: any = vmContent.hooks[prop];
            if (getPrototype(hookContent).indexOf("function") !== -1) {
              if (["beforeCreate", "created"].includes(hookContent.name)) {
                const hookName = `on${hookContent.name
                  .substring(0, 1)
                  .toUpperCase()}${hookContent.name.substring(1)}`;
                const hookFunctionStr: string = utilMethods.getContentStr(
                  hookContent,
                  null,
                  {
                    function: (params: any) => {
                      const { type, value, arg, body } = params;
                      if (type === "custom") {
                        return value.constructor.name === "AsyncFunction"
                          ? `async function ${hookName} ${arg} ${body}\n${hookName}()`
                          : `function ${hookName} ${arg} ${body}\n${hookName}()`;
                      }
                    },
                  }
                );
                if (hookName && hookFunctionStr) {
                  hookValues.push(hookFunctionStr);
                }
              } else if (
                [
                  "beforeMount",
                  "mounted",
                  "beforeUpdate",
                  "updated",
                  "beforeDestroy",
                  "destroyed",
                  "activated",
                  "deactivated",
                  "errorCaptured",
                ].includes(hookContent.name)
              ) {
                const v3HooksNameDist: any = {
                  beforeMount: "onBeforeMount",
                  mounted: "onMounted",
                  beforeUpdate: "onBeforeUpdate",
                  updated: "onUpdated",
                  beforeDestroy: "onBeforeUnmount",
                  destroyed: "onUnmounted",
                  activated: "onActivated",
                  deactivated: "onDeactivated",
                  errorCaptured: "onErrorCaptured",
                };
                const hookName: string =
                  v3HooksNameDist[hookContent.name as string];
                const hookFunctionStr: string = utilMethods.getContentStr(
                  hookContent,
                  null,
                  {
                    function: (params: any) => {
                      const { type, value, arg, body } = params;
                      if (type === "custom") {
                        return value.constructor.name === "AsyncFunction"
                          ? `${hookName} (async ${arg} => ${body})`
                          : `${hookName} (${arg} => ${body})`;
                      }
                    },
                  }
                );
                if (hookName && hookFunctionStr) {
                  hookValues.push(hookFunctionStr);
                  utilMethods.addImport("vuex", "useStore");
                }
              }
            }
          }
          if (hookValues.length > 0) {
            vmOutput.hooks = hookValues.join("\n\n");
          }
        }
      },
      methods(): void {
        if (vmKeys.methods.length > 0) {
          const methodValues: string[] = [];
          for (const prop in vmContent.methods) {
            const methodContent: any = vmContent.methods[prop];
            if (getPrototype(methodContent).indexOf("function") !== -1) {
              const methodName: string = methodContent.name;
              const methodFunctionStr: string = utilMethods.getContentStr(
                methodContent,
                null,
                {
                  function: (params: any) => {
                    const { type, value, arg, body } = params;
                    if (type === "custom") {
                      return value.constructor.name === "AsyncFunction"
                        ? `async function ${methodName} ${arg} ${body}`
                        : `function ${methodName} ${arg} ${body}`;
                    }
                  },
                }
              );
              if (methodName && methodFunctionStr) {
                methodValues.push(methodFunctionStr);
              }
            } else {
              console.log("not in function ");
            }
          }
          if (methodValues.length > 0) {
            vmOutput.methods = methodValues.join("\n\n");
          }
        }
      },
      filters(): void {
        if (vmKeys.filters.length > 0) {
          const filterValues: string[] = [];
          for (const prop in vmContent.filters) {
            const filterContent: any = vmContent.filters[prop];
            if (getPrototype(filterContent).indexOf("function") !== -1) {
              const filterName: string = filterContent.name;
              const filterFunctionStr: string = utilMethods.getContentStr(
                filterContent,
                null,
                {
                  function: (params: any) => {
                    const { type, value, arg, body } = params;
                    if (type === "custom") {
                      return value.constructor.name === "AsyncFunction"
                        ? `async function ${filterName} ${arg} ${body}`
                        : `function ${filterName} ${arg} ${body}`;
                    }
                  },
                }
              );
              if (filterName && filterFunctionStr) {
                filterValues.push(filterFunctionStr);
              }
            }
          }
          if (filterValues.length > 0) {
            vmOutput.filters = filterValues.join("\n\n");
          }
        }
      },
      emits(): void {
        if (vmContent.emits.length > 0) {
          const emitValues: string[] = [];
          for (const emit of vmContent.emits) {
            if (emit) {
              emitValues.push(`'${emit}'`);
            }
          }
          if (emitValues.length > 0) {
            vmOutput.emits = `const emit = defineEmits([${emitValues.join(
              ", "
            )}])`;
          }
        }
      },
      refs(): void {
        if (vmContent.refs.length > 0) {
          const refValues: string[] = [];
          for (const ref of vmContent.refs) {
            if (ref) {
              refValues.push(`const ${ref} = ref(null)`);
            }
          }
          if (refValues.length > 0) {
            vmOutput.refs = refValues.join("\n");
            utilMethods.addImport("vuex", "useStore");
          }
        }
      },
      use(): void {
        if (vmKeys.use().length > 0) {
          const useValues: string[] = [];
          for (const prop in vmContent.use) {
            const useContent: string = vmContent.use[prop];
            if (useContent) {
              useValues.push(useContent);
            }
          }
          if (useValues.length > 0) {
            vmOutput.use = useValues.sort().join("\n");
          }
        }
      },
      import(): void {
        if (vmKeys.import().length > 0) {
          const importValues: string[] = [];
          for (const prop in vmContent.import) {
            const importContent: string[] = vmContent.import[prop];
            if (importContent.length > 0) {
              importValues.push(
                `import { ${importContent.sort().join(", ")} } from '${prop}'`
              );
            }
          }
          if (importValues.length > 0) {
            vmOutput.import = importValues.join("\n");
          }
        }
      },
      output(): void {
        const outputValues: string[] = [];
        for (const prop in vmOutput) {
          if (getPrototype(prop) !== "array") {
            const outputContent: any = vmOutput[prop as keyof VmOutput];
            if (outputContent && getPrototype(outputContent) !== "array") {
              outputValues.push(outputContent);
            }
          }
        }
        if (outputValues.length > 0) {
          outputScriptContent = outputValues.join("\n\n");
        }
      },
    };

    // util methods init
    const utilMethods: UtilsMethods = {
      /**
       * 获取特定数据类型的字符串表示形式的实用方法
       * @param value 符串表示形式的值
       * @param replaceDataKeyToUseData 是否替换数据键以使用数据
       * @param resultCallbackContent 不同数据类型的回调函数的对象
       */
      getContentStr(
        value: any,
        replaceDataKeyToUseData = false,
        resultCallbackContent: {
          string?: (a: any) => any;
          object?: (a: any) => any;
          array?: (a: any) => any;
          function?: (a: any) => any;
          other?: (a: any) => any;
        } = {
          string: undefined,
          object: undefined,
          array: undefined,
          function: undefined,
          other: undefined,
        }
      ): string | undefined {
        let result = "";
        if (getPrototype(value) === "string") {
          result = `'${value}'`;
          if (resultCallbackContent.string) {
            result = resultCallbackContent.string({ value, result });
          }
        }
        // object prototype
        else if (getPrototype(value) === "object") {
          const values: string[] = [];
          for (const prop in value) {
            const content: string = utilMethods.getContentStr(
              value[prop],
              replaceDataKeyToUseData,
              resultCallbackContent
            );
            values.push(`${prop}: ${content}`);
          }
          result = values.length > 0 ? `{\n${values.join(",\n")}\n}` : "{}";
          if (resultCallbackContent.object) {
            result =
              resultCallbackContent.object({ value, values, result }) || result;
          }
        }
        // array prototype
        else if (getPrototype(value) === "array") {
          const values: string[] = [];
          for (const item of value) {
            const content: string = utilMethods.getContentStr(
              item,
              replaceDataKeyToUseData,
              resultCallbackContent
            );
            values.push(content);
          }
          result = values.length > 0 ? `[${values.join(", ")}]` : "[]";
          if (resultCallbackContent.array) {
            result =
              resultCallbackContent.array({ value, values, result }) || result;
          }
        }
        // function prototype
        else if (getPrototype(value).indexOf("function") !== -1) {
          let content: string = value.toString();
          // native code
          if (
            [
              "String",
              "Number",
              "Boolean",
              "Array",
              "Object",
              "Date",
              "Function",
              "Symbol",
            ].includes(value.name) &&
            content.match(braceRegExp)?.[0] === "{ [native code] }"
          ) {
            result = `${value.name}`;
            if (resultCallbackContent.function) {
              result =
                resultCallbackContent.function({
                  type: "native",
                  value,
                  content,
                  result,
                }) || result;
            }
          }
          // custom code
          else {
            content = utilMethods.replaceValue(
              content,
              replaceDataKeyToUseData
            );
            const arg: string = content.match(parenthesisRegExp)?.[0] || "()";
            const body: string =
              content
                .substring(content.indexOf(arg) + arg.length)
                .match(braceRegExp)?.[0] || "{}";
            result =
              value.constructor.name === "AsyncFunction"
                ? `async ${arg} => ${body}`
                : `${arg} => ${body}`;
            if (resultCallbackContent.function) {
              result =
                resultCallbackContent.function({
                  type: "custom",
                  value,
                  content,
                  arg,
                  body,
                  result,
                }) || result;
            }
          }
        }
        // other prototype
        else {
          result = `${value}`;
          if (resultCallbackContent.other) {
            result = resultCallbackContent.other({ value, result }) || result;
          }
        }
        return result;
      },
      replaceKey(key: string, dataKeyToUseData = false): string | void {
        let result = "";
        // props key
        if (vmKeys.props.includes(key)) {
          result = "props." + key;
        }
        // computed key
        else if (vmKeys.computed.includes(key)) {
          result = key + ".value";
        }
        // methods key
        else if (vmKeys.methods.includes(key)) {
          result = key;
        }
        // data key
        else if (vmKeys.data.includes(key) && !dataKeyToUseData) {
          result = key + ".value";
        }
        // useData key
        else if (vmKeys.data.includes(key) && dataKeyToUseData) {
          utilMethods.addUse("store");
          result = "useData()." + key;
        }
        // unknown key
        else if (key) {
          utilMethods.addImport("vuex", "useStore");
          utilMethods.addUse("store");
          result = `/* Warn: Unknown source: ${key} */ $vm.${key}`;
        }
        return result;
      },
      replaceValue(value: string, dataKeyToUseData = false): string {
        let result = "";
        const thisKeyRegExp = /this(\.{1})([$a-zA-Z0-9_]+)/g;
        const refKeyRegExp = /\$REFS_KEY(\.|\?\.)([$a-zA-Z0-9_]+)/g;
        result = value
          .replace(
            thisKeyRegExp,
            function (
              str: string,
              separator: string,
              key: string,
              index: number,
              content: string
            ): string {
              // props key
              if (vmKeys.props.includes(key)) {
                return "props." + key;
              }
              // computed key
              else if (vmKeys.computed.includes(key)) {
                return key + ".value";
              }
              // methods key
              else if (vmKeys.methods.includes(key)) {
                return key;
              }
              // data key
              else if (vmKeys.data.includes(key) && !dataKeyToUseData) {
                const type = getDataOptionsApiNameByKeyName(key);
                if (type === "reactive") {
                  return key;
                }
                return key + ".value";
              }
              // useData key
              else if (vmKeys.data.includes(key) && dataKeyToUseData) {
                utilMethods.addUse("data");
                return "useData()." + key;
              }
              // attrs key
              else if (key === "$attrs") {
                utilMethods.addImport("vue", "useAttrs");
                utilMethods.addUse("attrs");
                return key.substring(1);
              }
              // slots key
              else if (key === "$slots") {
                utilMethods.addImport("vue", "useSlots");
                utilMethods.addUse("slots");
                return key.substring(1);
              }
              // router key
              else if (key === "$router") {
                utilMethods.addImport("vue-router", "useRouter");
                utilMethods.addUse("router");
                return key.substring(1);
              }
              // route key
              else if (key === "$route") {
                utilMethods.addImport("vue-router", "useRoute");
                utilMethods.addUse("route");
                return key.substring(1);
              }
              // store key
              else if (key === "$store") {
                utilMethods.addImport("vuex", "useStore");
                utilMethods.addUse("store");
                return key.substring(1);
              }
              // nextTick key
              else if (key === "$nextTick") {
                utilMethods.addImport("vue", "nextTick");
                return key.substring(1);
              }
              // set key
              else if (key === "$set") {
                utilMethods.addImport("vue", "set");
                return key.substring(1);
              }
              // delete key
              else if (key === "$delete") {
                utilMethods.addImport("vue", "del");
                return key.substring(1);
              }
              // emit key
              else if (key === "$emit") {
                const nameRegExp =
                  /^\(['"`](update:){0,1}([$a-zA-Z0-9_-]+)['"`]/;
                const name: string =
                  content
                    .substring(index + str.length)
                    .match(nameRegExp)?.[2] || "";
                if (name) {
                  !vmContent.emits.includes(name) && vmContent.emits.push(name);
                } else {
                  utilMethods.addImport("vue", "getCurrentInstance");
                  utilMethods.addUse("vm");
                }
                return name
                  ? key.substring(1)
                  : `/* Warn: Cannot find emit name */ $vm.$emit`;
              }
              // refs key
              else if (key === "$refs") {
                const nameRegExp = /(^\.|^\?\.)([$a-zA-Z0-9_]+)/;
                const name: string =
                  content
                    .substring(index + str.length)
                    .match(nameRegExp)?.[2] || "";
                if (name) {
                  !vmContent.refs.includes(name) && vmContent.refs.push(name);
                } else {
                  utilMethods.addImport("vue", "getCurrentInstance");
                  utilMethods.addUse("vm");
                }
                return name
                  ? "$REFS_KEY"
                  : `/* Warn: Cannot find refs name */ $vm.$refs`;
              }
              // other key
              else if (
                [
                  "$data",
                  "$props",
                  "$el",
                  "$options",
                  "$parent",
                  "$root",
                  "$children",
                  "$isServer",
                  "$listeners",
                  "$watch",
                  "$on",
                  "$once",
                  "$off",
                  "$mount",
                  "$forceUpdate",
                  "$destroy",
                ].includes(key)
              ) {
                utilMethods.addImport("vue", "getCurrentInstance");
                utilMethods.addUse("vm");
                return "$vm." + key;
              }
              // unknown key
              else if (key) {
                utilMethods.addImport("vue", "getCurrentInstance");
                utilMethods.addUse("vm");
                return `/* Warn: Unknown source: ${key} */ $vm.${key}`;
              }
              // nonexistent key
              else {
                utilMethods.addImport("vue", "getCurrentInstance");
                utilMethods.addUse("vm");
                return `/* Warn: Cannot find key */ $vm${separator}`;
              }
            }
          )
          .replace(
            refKeyRegExp,
            function (str: string, separator: string, name: string): string {
              // reset refs key
              return name + ".value";
            }
          );
        return result;
      },
      /**
       * 添加导入
       * @param type
       * @param value
       */
      addImport(type: string, value: string): void {
        if (["vue", "vue-router", "vuex"].includes(type)) {
          const importContent: string[] = vmContent.import[type];
          if (!importContent?.includes(value)) {
            importContent.push(value);
          }
        }
      },
      addUse(type: string): void {
        if (
          ["data", "vm", "attrs", "slots", "router", "route", "store"].includes(
            type
          )
        ) {
          const contentDist: any = {
            vm: "const { proxy: $vm } = getCurrentInstance()",
            data: "const useData = () => data",
            attrs: "const attrs = useAttrs()",
            slots: "const slots = useSlots()",
            router: "const router = useRouter()",
            route: "const route = useRoute()",
            store: "const store = useStore()",
          };
          const useContent: string = contentDist[type];
          if (useContent) {
            vmContent.use[type] = useContent;
          }
        }
      },
    };

    // vm set content methods runing
    for (const prop in vmSetContentMethods) {
      const vmSetContentMethod: () => void =
        vmSetContentMethods[prop as keyof VmSetContentMethods];
      if (getPrototype(vmSetContentMethod).indexOf("function") !== -1) {
        vmSetContentMethod();
      }
    }

    outputScriptContent = jsBeautify(outputScriptContent, jsBeautifyOptions);

    // done
    return outputScriptContent;
  } catch (err: any) {
    throw new Error(err);
  }
}

export default Vue2ToCompositionApi;
