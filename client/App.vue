<script setup>
import { reactive, onServerPrefetch, onMounted, inject } from "vue";
import { fetchData } from "./api";
import { SSRState } from "./utils/SSRState";

const show = reactive({ value: true });
const user = reactive({
  value: null,
});

const toggle = () => {
  show.value = !show.value;
};

const getData = async () => {
  const response = await fetchData("/api/user");
  const data = await response.json();
  return data;
};

onServerPrefetch(async () => {
  // 只能是去请求，赋值不到 user.value，所以赋值到 SSRState，客户端渲染的时候可以取值。
  const userData = await getData();
  SSRState.set("user.value", userData);
});

onMounted(async () => {
  if (!user.value) {
    user.value = SSRState.get("user.value") || (await getData());
  }
});
</script>

<template>
  <div>
    <h1 @click="toggle">toggle</h1>
    <h1>{{ user.value && user.value.name }}</h1>
    <a v-if="show.value" href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
