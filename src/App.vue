<template>
  <div class="container">
    <div class="title">Vue2 to Vue3 Setup</div>
    <div class="remark">
      仅提供export default 中的代码，导入的data或者method需要手动删除。
      <p>$refs使用的变量名请保持唯一!!!</p>
    </div>
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
      <a-col :span="2" class="flex-container">
        <a-button type="primary" @click="referenceClick">转换 -></a-button>
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
import Vue2ToCompositionApi from "./utils/vue2tovue3";

const finalCode: Ref<string> = ref(``);
// import { filterIndex } from '@/utils/index';

const code = ref(`

export default {
  mixins:[filterIndex],
  data() {
    return {
      index: 1,
      loginForm: {
        username: '',
        password: '',
        rememberMe: false,
        code: '',
        uuid: '',
        loginType: ''
      },
      loginRules: {
        username: [{
          required: true,
          trigger: 'blur',
          message: '手机号码不能为空'
        },
        {
          pattern: /^1[3|4|5|6|7|8|9][0-9]\\d{8}$/,
          message: '请输入正确的手机号码',
          trigger: 'blur'
        }
        ],
        password: [{
          required: true,
          trigger: 'blur',
          message: '密码不能为空'
        }],
        code: [{
          required: true,
          trigger: 'change',
          message: '验证码不能为空'
        }]
      },
    };
  },
  methods: {
    getCode() {
      console.log(index)
    },
    checkPhone() {
      this.loginRules.code[0].required = false;
      this.$nextTick(() => {
          this.index = 2
      })
    },
  }
};
`);
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
  finalCode.value = Vue2ToCompositionApi(code.value) as string;
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
