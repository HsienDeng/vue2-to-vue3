import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";

import AntDesign from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

import { InstallCodemirro } from "codemirror-editor-vue3";

const app = createApp(App);
app.use(InstallCodemirro);
app.use(store);
app.use(AntDesign);
app.mount("#app");
