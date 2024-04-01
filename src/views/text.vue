<!--
 * @Author: Coder Derek
 * @File: text.vue
 * @Software: WebStorm
 * @Description: descript
-->
<template>
  <div>123</div>
</template>

<script setup lang="ts">
import { reactive, ref, defineProps, computed } from "vue";

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false,
  },
});

const indexQ = ref(1);
const indexObj = reactive({
  name: "邓贤",
});

const getIndexObj = computed(() => {
  return indexObj;
});

const getIndexObjName = computed(() => {
  return indexObj.name;
});

function getIndexQ() {
  console.log(indexQ);
}
</script>

<style scoped></style>
