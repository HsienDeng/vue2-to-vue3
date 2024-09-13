<template>
  <div class="container">
    <div class="title">Vue2 to Vue3 Setup</div>
    <div style="display: flex; justify-content: center">
      <a
        href="https://github.com/CoderHyun/vue2ToVue3"
        target="_blank"
        style="font-size: 26px"
      >
        GitHub
      </a>
    </div>
    <div>
      <h4>直接复制Vue2代码即可</h4>
      注意：
      <ol>
        <li>ref 命名请勿和 data 中的变量冲突</li>
        <li>style 代码不会拼接。</li>
      </ol>
    </div>
    <a-affix :offset-top="20">
      <a-button type="primary" @click="referenceClick">转换</a-button>
    </a-affix>

    <a-row flex>
      <a-col :span="11">
        <Codemirror
          v-model:value="code"
          :options="cmOptions"
          border
          ref="cmRef"
          placeholder=""
          style="min-height: 200px"
        />
      </a-col>
      <a-col :span="11">
        <Codemirror
          v-model:value="finalCode"
          :options="cmOptions"
          disabled
          border
          ref="cmfFinalRef"
        />
      </a-col>
    </a-row>
  </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted, Ref } from "vue";
import "codemirror/mode/javascript/javascript.js";
import Codemirror from "codemirror-editor-vue3";
import type { CmComponentRef } from "codemirror-editor-vue3";
import type { EditorConfiguration } from "codemirror";
import { toVue3Code } from "./utils/to-v3";

const finalCode: Ref<string> = ref("");

const code = ref("");

const cmRef = ref<CmComponentRef>();
const cmOptions: EditorConfiguration = {
  mode: "text/javascript",
};

onMounted(() => {
  setTimeout(() => {
    cmRef.value?.refresh();
  }, 1000);

  setTimeout(() => {
    cmRef.value?.cminstance.isClean();
  }, 3000);
});

function referenceClick() {
  finalCode.value = toVue3Code(code.value);
}

onUnmounted(() => {
  cmRef.value?.destroy();
});
</script>

<style scoped>
.container {
  padding: 40px;
}

.title {
  font-weight: bold;
  font-size: 28px;
}

.remark {
  margin-bottom: 20px;
}

.title,
.remark {
  text-align: center;
}

.flex-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
