<template>
  <div id="app">
    <input
      :value="input"
      class="input"
      @input="onInputChange"
      placeholder="Tap on the virtual keyboard to start"
    />
    <SimpleKeyboard2 @onChange="onChange" @onKeyPress="onKeyPress" :input="input" :theme="theme" />
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import SimpleKeyboard2 from '@/components/MySimpleKeyboard2';
  //import "./App.css";
  const input = ref(''),
    theme = 'hg-theme-default myTheme1';

  const onChange = (input) => {
    input.value = input;
  };

  const onKeyPress = (button) => {
    console.log('button', button);
  };

  const onInputChange = (input) => {
    input.value = input.target.value;
  };
</script>

<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /*
.simple-keyboard {
  max-width: 850px;
}
*/

  input {
    width: 100%;
    height: 100px;
    padding: 20px;
    font-size: 20px;
    border: none;
    box-sizing: border-box;
  }

  .keyboardContainer {
    display: flex;
    background-color: black;
    justify-content: center;
    width: 512px;
    margin: 0 auto;
    border-radius: 5px;
  }

  /*
  Theme: myTheme1
*/
  .simple-keyboard.myTheme1 {
    background-color: rgba(0, 0, 0, 0.8);
    border-radius: 0;
    border-bottom-right-radius: 5px;
    border-bottom-left-radius: 5px;
  }

  .simple-keyboard.myTheme1 .hg-button {
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    /*  color: white; */
    color: rgb(231, 124, 124);
  }

  .hg-theme-default .hg-button {
    /* key color */
    /* nothing = white */
    border-top: 1px solid rgb(241, 60, 60);
    border-bottom: 1px solid rgb(241, 60, 60);
    border-left: 1px solid rgb(241, 60, 60);
    border-right: 1px solid rgb(241, 60, 60);
  }

  .simple-keyboard.myTheme1 .hg-button:active {
    /* active keypress */
    background: rgba(0, 0, 0, 0.5);
    color: rgb(255, 255, 255);
    border-bottom: 1px solid black;
    border-bottom: 1px solid black;
    border-left: 1px solid black;
    border-right: 1px solid black;
  }

  #root .simple-keyboard.myTheme1 + .simple-keyboard-preview {
    /*  background: #1c4995; */
  }

  /* .simple-keyboard-arrows */
  .simple-keyboard-arrows .hg-row {
    justify-content: center;
  }

  .simple-keyboard-arrows .hg-button {
    width: 50px;
    flex-grow: 0;
    justify-content: center;
    display: flex;
    align-items: center;
  }

  .controlArrows {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-flow: column;
  }

  /* arrows end */
  .simple-keyboard-control.simple-keyboard {
    /* 
  background-color: transparent;
  */
  }

  .simple-keyboard-control.simple-keyboard .hg-row:first-child {
    margin-bottom: 10px;
  }

  .simple-keyboard-control .hg-button {
    width: 50px;
    flex-grow: 0;
    justify-content: center;
    display: flex;
    align-items: center;
  }

  .numPad {
    display: flex;
    align-items: flex-end;
  }

  .simple-keyboard-numpad.simple-keyboard {
    /* background-color: transparent;
 */
  }

  .simple-keyboard-numpad.simple-keyboard {
    width: 160px;
  }

  .simple-keyboard-numpad.simple-keyboard .hg-button {
    width: 50px;
    justify-content: center;
    display: flex;
    align-items: center;
  }

  .simple-keyboard-numpadEnd.simple-keyboard {
    width: 50px;
    /*  background: transparent; */
    margin: 0;
    padding: 5px 5px 5px 0;
  }

  .simple-keyboard-numpadEnd.simple-keyboard .hg-button {
    align-items: center;
    justify-content: center;
    display: flex;
  }

  .simple-keyboard-numpadEnd .hg-button.hg-standardBtn.hg-button-plus {
    height: 85px;
  }

  .simple-keyboard-numpadEnd.simple-keyboard .hg-button.hg-button-enter {
    height: 85px;
  }

  .simple-keyboard.hg-theme-default .hg-button.hg-selectedButton {
    background: rgba(5, 25, 70, 0.53);
    color: rgb(0, 255, 149);
  }

  .hg-button.hg-functionBtn.hg-button-space {
    width: 350px;
  }
</style>
