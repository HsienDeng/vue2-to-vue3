import Vue2ToCompositionApi from "./handler-script";

export function toVue3Code(codeText = "") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const vueTemplateCompiler = require("vue-template-compiler");

  const compiled = vueTemplateCompiler.parseComponent(codeText);

  const templateContent = compiled.template
    ? compiled.template.content
    : "No template found";

  let scriptContent = compiled.script
    ? compiled.script.content
    : "No script found";

  scriptContent = scriptContent.replace(
    /methods:\s*{([^}]+)}/g,
    (match: any, methodsContent: any) => {
      const methods = methodsContent
        .split(",")
        .map((method: any) => method.trim());

      const validMethods = methods.filter((method: any) =>
        method.includes("(")
      );

      return `methods: {${validMethods.join(", ")}}`;
    }
  );

  const importContent = scriptContent.split(/export\s+default\s+{(.+)/s)[0];
  const noImportContent =
    "export default {" + scriptContent.split(/export\s+default\s+{(.+)/s)[1];

  const compositionApi = Vue2ToCompositionApi(noImportContent);

  // 拼接外部标签
  const finalTemplateContent = `<template>
        ${templateContent}\n</template>\n`;

  const finalScriptContent = `<script setup>${
    importContent + compositionApi
  }\n</script>`;

  return finalTemplateContent + finalScriptContent;
}
