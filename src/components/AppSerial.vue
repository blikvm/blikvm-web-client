<template>
  <div
    ref="terminal"
    class="terminal-content"
    @contextmenu="handleContextMenu"
    @mouseenter="enableKeyboardEvents"
    @mouseleave="disableKeyboardEvents"
    @keydown="handleKeydown"
    @keyup="handleKeyup"
    tabindex="0"
  >
    <!-- Container for floating action buttons -->
    <div class="fab-container">
      <v-icon
        fab
        v-tooltip="'Clear terminal'"
        color="#76FF03"
        class="fab-button"
        @click="clearTerminal"
      >
        $clear
      </v-icon>
      <v-icon
        fab
        v-tooltip="'Copy to clipboard'"
        color="#76FF03"
        class="fab-button"
        @click="copyClipboardHandler"
      >
        mdi-content-copy
      </v-icon>
      <v-icon
        fab
        v-tooltip="'Paste from clipboard'"
        color="#76FF03"
        class="fab-button"
        @click="pasteClipboard"
      >
        mdi-content-paste
      </v-icon>
    </div>

    <div class="scroll-top-button">
      <v-icon fab v-tooltip="'Scroll to top'" color="#76FF03" class="fab-button" @click="scrollTop">
        mdi-arrow-up
      </v-icon>
    </div>

    <div class="scroll-bottom-button">
      <v-icon
        fab
        v-tooltip="'Scroll to bottom'"
        color="#76FF03"
        class="fab-button"
        @click="scrollBottom"
      >
        mdi-arrow-down
      </v-icon>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import '@xterm/xterm/css/xterm.css';
  import { debounce } from 'lodash';
  import Config from '@/config.js';
  import { useAlert } from '@/composables/useAlert.js';
  import { useClipboard } from '@/composables/useClipboard.js';
  import { useSerialPorts } from '@/composables/useSerialTerminal.js';

  const { sendAlert } = useAlert();
  const { copyClipboard } = useClipboard();
  const { setSerial } = useSerialPorts();

  // TODO this code is (at least) also used in websockets.js, needs to come from composable
  const wsProtocol = Config.http_protocol === 'https:' ? 'wss' : 'ws';
  const token = localStorage.getItem('token');
  const socketUrl = `${wsProtocol}://${Config.host_ip}${Config.host_port}/serial?token=${token}`;

  const packStdin = (data) => JSON.stringify({ Op: 'stdin', Data: data });
  const packResize = (cols, rows) => JSON.stringify({ Op: 'resize', Cols: cols, Rows: rows });

  const initText = ref('connecting...\r\n'); // TODO localize
  const first = ref(true);
  const term = ref(null);
  const fitAddon = ref(null);
  const ws = ref(null);
  const terminal = ref(null);

  const option = {
    lineHeight: 1.0,
    cursorBlink: true,
    wraparound: true,
    cursorStyle: 'block',
    fontSize: 14,
    fontFamily: "Monaco, Menlo, Consolas, 'Courier New', monospace",
    theme: {
      background: '#181d28',
    },
    cols: '100',
  };

  // TODO this code is (at least) also used in websockets.js, needs to come from composable
  //     if (ws && ws.readyState === WebSocket.OPEN) ??
  const isWsOpen = () => ws.value && ws.value.readyState === 1;

  const isKeyboardEventsEnabled = ref(false);

  const enableKeyboardEvents = () => {
    isKeyboardEventsEnabled.value = true;
    term.value?.focus(); // 鼠标进入时聚焦
  };

  const disableKeyboardEvents = () => {
    isKeyboardEventsEnabled.value = false;
    term.value?.blur(); // 鼠标离开时移除焦点
  };

  const handleKeydown = (event) => {
    if (isKeyboardEventsEnabled.value) {
      event.stopPropagation(); // 阻止事件冒泡
    }
  };

  const handleKeyup = (event) => {
    if (isKeyboardEventsEnabled.value) {
      event.stopPropagation(); // 阻止事件冒泡
    }
  };

  const initTerm = () => {
    term.value = new Terminal(option);
    fitAddon.value = new FitAddon();
    term.value.loadAddon(fitAddon.value);
    term.value.open(terminal.value);

    setTimeout(() => {
      fitAddon.value.fit();
    }, 500);
  };

  const onTerminalKeyPress = () => {
    term.value.onData((data) => {
      isWsOpen() && ws.value.send(packStdin(data));
    });
  };

  const resizeRemoteTerminal = () => {
    const { cols, rows } = term.value;
    isWsOpen() && ws.value.send(packResize(cols, rows));
  };

  const onResize = debounce(() => {
    fitAddon.value.fit();
  }, 500);

  const copyClipboardHandler = async () => {
    if (term.value) {
      const selection = term.value.getSelection();
      const textToCopy = selection || term.value.buffer.active.translateToString(false).trim();

      try {
        await copyClipboard(textToCopy);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  const pasteClipboard = async () => {
    if (term.value) {
      try {
        const clipboardText = await navigator.clipboard.readText();
        term.value.paste(clipboardText);
      } catch (err) {
        console.error('Clipboard paste failed:', err);
      }
    }
  };

  const clearTerminal = () => {
    if (isWsOpen()) {
      // Ctrl+U clears the current shell line
      // Then we send "clear" followed by Enter
      ws.value.send(packStdin('\x15clear\n'));
    }
  };

  const scrollTop = () => {
    if (term.value) {
      term.value.scrollToTop();
    }
  };

  const scrollBottom = () => {
    if (term.value) {
      term.value.scrollToBottom();
    }
  };

  const onTerminalResize = () => {
    window.addEventListener('resize', onResize);
    term.value.onResize(resizeRemoteTerminal);
  };

  const removeResizeListener = () => {
    window.removeEventListener('resize', onResize);
  };

  const initSocket = () => {
    term.value.write(initText.value);
    ws.value = new WebSocket(socketUrl, ['OK']);
    onOpenSocket();
    onCloseSocket();
    onErrorSocket();
    onMessageSocket();
  };

  const onOpenSocket = () => {
    ws.value.onopen = () => {
      term.value.reset();
      setTimeout(() => {
        resizeRemoteTerminal();
      }, 500);
    };
  };

  const onCloseSocket = () => {
    // ws.value.onclose = () => {
    //   term.value.write("Not connected, reconnect in 3 seconds...\r\n");
    //   setTimeout(() => {
    //     initSocket();
    //   }, 3000);
    // };
  };

  const onErrorSocket = () => {
    ws.value.onerror = () => {
      const title = '';
      const message = `websocket connection failed, please refresh`;

      sendAlert('error', title, message);
    };
  };

  const onMessageSocket = () => {
    ws.value.onmessage = (res) => {
      const data = res.data;
      if (first.value) {
        first.value = false;
        term.value.reset();
        term.value.element && term.value.focus();
        resizeRemoteTerminal();
      }
      term.value.write(data);
    };
  };

  const handleContextMenu = (event) => {
    event.preventDefault();
  };

  onMounted(async () => {
    await setSerial();
    initTerm();
    initSocket();
    onTerminalResize();
    onTerminalKeyPress();
  });

  onBeforeUnmount(() => {
    removeResizeListener();
  });
</script>

<style scoped lang="scss">
  body {
    margin: 0;
    padding: 0;
  }

  .terminal-content {
    position: relative;
    height: 100%;
    overflow: hidden; /* Hide the overall scrollbars */
  }

  .xterm {
    overflow: hidden; /* Prevent scrollbars inside the terminal itself */
  }

  .xterm .xterm-screen {
    overflow: hidden; /* Ensure the screen area is not showing scrollbars */
  }

  .xterm .xterm-rows {
    overflow: hidden; /* Hide any extra scrollbars from rows */
  }

  .terminal-content::-webkit-scrollbar {
    display: none; /* Hide scrollbars in WebKit browsers (Chrome, Safari, etc.) */
  }

  .terminal-content {
    -ms-overflow-style: none; /* Hide scrollbar for IE 10+ */
    scrollbar-width: none; /* Hide scrollbar for Firefox */
  }

  .fab-container {
    position: absolute;
    top: 10px;
    right: 30px;
    z-index: 1000; /* Ensure FABs are above other content */
    display: flex;
    flex-direction: column; /* Stack FABs vertically */
    align-items: flex-end; /* Align FABs to the right */
  }

  .fab-button {
    margin-bottom: 16px; /* Space between each FAB */
  }

  .scroll-top-button {
    position: absolute;
    bottom: -10px;
    right: 55px;
    z-index: 1000;
  }

  .scroll-bottom-button {
    position: absolute;
    bottom: -10px;
    right: 30px;
    z-index: 1000;
  }
</style>
