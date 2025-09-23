<template>
  <div>
    <h1>Your publishing widget will be added here.</h1>
    <button @click="showAlert">Click me!</button>
    <First-Component></First-Component>
  </div>
</template>

<script>
import FirstComponent from './components/FirstComponent';

export default {
  data() {
    return {};
  },
  components: {
    FirstComponent
  },
  methods: {
    showAlert() {
      alert('Hello World!');
    }
  }
};
</script>
