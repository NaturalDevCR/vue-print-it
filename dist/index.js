'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vue = require('vue');

/* vue-print-it - A Vue 3 printing plugin */

async function injectPageStyles(win) {
  const styleElements = document.querySelectorAll("style");
  styleElements.forEach((style) => {
    const newStyle = win.document.createElement("style");
    newStyle.textContent = style.textContent;
    win.document.head.appendChild(newStyle);
  });
  const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
  linkElements.forEach((link) => {
    const newLink = win.document.createElement("link");
    newLink.rel = "stylesheet";
    newLink.href = link.href;
    win.document.head.appendChild(newLink);
  });
  try {
    const cssRules = [];
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach((rule) => {
            cssRules.push(rule.cssText);
          });
        }
      } catch (e) {
      }
    });
    if (cssRules.length > 0) {
      const styleElement = win.document.createElement("style");
      styleElement.textContent = cssRules.join("\n");
      win.document.head.appendChild(styleElement);
    }
  } catch (e) {
  }
}
async function injectCustomStyles(win, styles) {
  styles.forEach((style) => {
    if (style.startsWith("http") || style.startsWith("/") || style.startsWith("./")) {
      const link = win.document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = style;
      win.document.head.appendChild(link);
    } else {
      const styleElement = win.document.createElement("style");
      styleElement.textContent = style;
      win.document.head.appendChild(styleElement);
    }
  });
}
function getBridgeClient() {
  if (typeof window === "undefined") return null;
  const instance = vue.getCurrentInstance();
  if (instance) {
    const injectedBridge = vue.inject("vuePrintItBridge", null);
    if (injectedBridge) return injectedBridge;
    const globalBridge = instance.appContext.config.globalProperties.$printBridge;
    if (globalBridge) return globalBridge;
  }
  return null;
}
function resolveElement(element) {
  if (typeof element === "string") {
    const found = document.getElementById(element);
    if (!found) {
      throw new Error(`Element with ID '${element}' not found`);
    }
    return found;
  }
  return element;
}
function buildPrintHtml(targetElement, options, globalOptions) {
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.windowTitle}</title>
  `;
  if (options.preserveStyles) {
    const styleElements = document.querySelectorAll("style");
    styleElements.forEach((style) => {
      htmlContent += `<style>${style.textContent}</style>`;
    });
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    linkElements.forEach((link) => {
      htmlContent += `<link rel="stylesheet" href="${link.href}">`;
    });
  }
  const allStyles = [...globalOptions.styles || [], ...options.styles || []];
  allStyles.forEach((style) => {
    if (style.startsWith("http") || style.startsWith("/") || style.startsWith("./")) {
      htmlContent += `<link rel="stylesheet" href="${style}">`;
    } else {
      htmlContent += `<style>${style}</style>`;
    }
  });
  htmlContent += `
      </head>
      <body>
        ${targetElement.innerHTML}
      </body>
    </html>
  `;
  return htmlContent;
}
async function printWithBridge(element, options, globalOptions, bridgeClient) {
  const targetElement = resolveElement(element);
  const htmlContent = buildPrintHtml(targetElement, options, globalOptions);
  const base64Content = bridgeClient.htmlToBase64(htmlContent);
  let printerName = options.printerName;
  if (!printerName) {
    printerName = bridgeClient.getDefaultPrinter ? bridgeClient.getDefaultPrinter() : null;
    if (!printerName && bridgeClient.updatePrinters) {
      await bridgeClient.updatePrinters();
      printerName = bridgeClient.getDefaultPrinter();
    }
  }
  const printRequest = {
    printer_name: printerName,
    content: base64Content,
    content_type: options.contentType || "html",
    copies: options.copies || 1
  };
  const result = await bridgeClient.print(printRequest);
  if (!result.success) {
    throw new Error(`Print error: ${result.message}`);
  }
  console.log(`Print successful. Job ID: ${result.job_id}`);
}
async function printWithBrowser(element, options, globalOptions) {
  const targetElement = resolveElement(element);
  let specsString = "";
  if (Array.isArray(options.specs)) {
    specsString = options.specs.join(",");
  } else if (typeof options.specs === "object") {
    const specsArray = [];
    if (options.specs.width) specsArray.push(`width=${options.specs.width}`);
    if (options.specs.height) specsArray.push(`height=${options.specs.height}`);
    specsString = specsArray.join(",");
  }
  const win = window.open("", options.name, specsString);
  if (!win) {
    throw new Error("Could not open print window");
  }
  win.document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.windowTitle}</title>
      </head>
      <body>
        ${targetElement.innerHTML}
      </body>
    </html>
  `;
  if (options.preserveStyles) {
    await injectPageStyles(win);
  }
  const allStyles = [...globalOptions.styles || [], ...options.styles || []];
  if (allStyles.length > 0) {
    await injectCustomStyles(win, allStyles);
  }
  await new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        win.focus();
        win.print();
        if (options.autoClose) {
          win.close();
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    }, options.timeout);
  });
}
function createPrintFunction(globalOptions = {}) {
  const defaultOptions = {
    name: "_blank",
    specs: ["fullscreen=yes", "titlebar=yes", "scrollbars=yes"],
    styles: [],
    timeout: 1e3,
    autoClose: true,
    windowTitle: typeof window !== "undefined" ? window.document.title : "Document",
    preserveStyles: true
  };
  async function print(element, localOptions = {}) {
    const options = {
      ...defaultOptions,
      ...globalOptions,
      ...localOptions,
      onBeforePrint: localOptions.onBeforePrint || (() => {
      }),
      onAfterPrint: localOptions.onAfterPrint || (() => {
      }),
      onPrintError: localOptions.onPrintError || (() => {
      })
    };
    try {
      await options.onBeforePrint();
      const bridgeClient = getBridgeClient();
      const shouldUseBridge = options.useBridge && bridgeClient && await bridgeClient.checkAvailability();
      if (shouldUseBridge) {
        await printWithBridge(element, options, globalOptions, bridgeClient);
      } else {
        await printWithBrowser(element, options, globalOptions);
      }
      await options.onAfterPrint();
    } catch (error) {
      options.onPrintError(error);
      throw error;
    }
  }
  async function getBridgeStatus() {
    const bridgeClient = getBridgeClient();
    return bridgeClient ? await bridgeClient.getHealth() : null;
  }
  async function getAvailablePrinters() {
    const bridgeClient = getBridgeClient();
    if (!bridgeClient) return [];
    const isAvailable = await bridgeClient.checkAvailability();
    return isAvailable ? await bridgeClient.getPrinters() : [];
  }
  async function printDirect(content, options = {}) {
    const bridgeClient = getBridgeClient();
    if (!bridgeClient) {
      throw new Error("Bridge plugin not installed. Please install vue-print-it bridge plugin.");
    }
    const isAvailable = await bridgeClient.checkAvailability();
    if (!isAvailable) {
      throw new Error("Bridge not available");
    }
    const request = {
      content: bridgeClient.htmlToBase64(content),
      content_type: "html",
      copies: 1,
      ...options
    };
    return await bridgeClient.print(request);
  }
  return {
    print,
    getBridgeStatus,
    getAvailablePrinters,
    printDirect
  };
}
function usePrint() {
  const instance = vue.getCurrentInstance();
  if (instance == null ? void 0 : instance.appContext.config.globalProperties.$print) {
    return {
      print: instance.appContext.config.globalProperties.$print,
      getBridgeStatus: instance.appContext.config.globalProperties.$print.getBridgeStatus,
      getAvailablePrinters: instance.appContext.config.globalProperties.$print.getAvailablePrinters,
      printDirect: instance.appContext.config.globalProperties.$print.printDirect
    };
  }
  const printFunctions = createPrintFunction();
  return printFunctions;
}

// src/plugin.ts
function createVuePrintIt(options = {}) {
  return {
    install(app) {
      const printFunctions = createPrintFunction(options);
      const methodName = options.globalMethodName || "$print";
      app.config.globalProperties[methodName] = printFunctions.print;
      const bridgeClient = app.config.globalProperties.$printBridge;
      if (bridgeClient) {
        app.config.globalProperties[methodName].getBridgeStatus = printFunctions.getBridgeStatus;
        app.config.globalProperties[methodName].getAvailablePrinters = printFunctions.getAvailablePrinters;
        app.config.globalProperties[methodName].printDirect = printFunctions.printDirect;
      }
    }
  };
}

// src/utils/bridge-client.ts
var BridgeClient = class {
  /**
   * Creates a new BridgeClient instance
   * @param baseUrl - Base URL of the bridge service (default: 'http://localhost:8765')
   */
  constructor(baseUrl = "http://localhost:8765") {
    this.isAvailable = null;
    this.baseUrl = baseUrl;
  }
  /**
   * Checks if the bridge service is available and responding
   * @returns Promise that resolves to true if bridge is available
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(2e3)
        // Timeout de 2 segundos
      });
      if (response.ok) {
        this.isAvailable = true;
        return true;
      }
    } catch (error) {
      console.debug("Bridge no disponible:", error);
    }
    this.isAvailable = false;
    return false;
  }
  /**
   * Gets the health status of the bridge service
   * @returns Promise that resolves to bridge health information or null if unavailable
   */
  async getHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug("Error obteniendo estado del bridge:", error);
    }
    return null;
  }
  /**
   * Gets list of available printers from the bridge
   * @returns Promise that resolves to array of available printers
   */
  async getPrinters() {
    try {
      const response = await fetch(`${this.baseUrl}/api/printers`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug("Error obteniendo impresoras:", error);
    }
    return [];
  }
  /**
   * Sends content directly to a printer via the bridge
   * @param request - Print request configuration
   * @returns Promise that resolves to print response with job information
   */
  async print(request) {
    try {
      const response = await fetch(`${this.baseUrl}/api/print`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });
      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.text();
        throw new Error(`Error del bridge: ${error}`);
      }
    } catch (error) {
      throw new Error(`Error comunic\xE1ndose con el bridge: ${error}`);
    }
  }
  /**
   * Converts HTML string to Base64 encoding for bridge transmission
   * @param html - HTML string to encode
   * @returns Base64 encoded string
   */
  htmlToBase64(html) {
    return btoa(unescape(encodeURIComponent(html)));
  }
  /**
   * Getter para saber si el bridge está disponible
   */
  get available() {
    return this.isAvailable;
  }
};

// src/plugins/bridge-plugin.ts
function createVuePrintItBridge(options = {}) {
  const bridgeOptions = {
    baseUrl: "http://localhost:8765",
    autoConnect: false,
    autoSelectDefault: true,
    timeout: 2e3,
    retryAttempts: 3,
    ...options
  };
  const bridgeState = vue.reactive({
    availablePrinters: [],
    defaultPrinter: bridgeOptions.defaultPrinter || null,
    isConnected: false,
    lastUpdated: null
  });
  return {
    install(app) {
      const bridgeClient = new BridgeClient(bridgeOptions.baseUrl);
      const updatePrinters = async () => {
        try {
          const isAvailable = await bridgeClient.checkAvailability();
          bridgeState.isConnected = isAvailable;
          if (isAvailable) {
            const printers = await bridgeClient.getPrinters();
            bridgeState.availablePrinters = printers;
            bridgeState.lastUpdated = /* @__PURE__ */ new Date();
            if (!bridgeState.defaultPrinter && printers.length > 0) {
              if (bridgeOptions.autoSelectDefault) {
                const defaultPrinter = printers.find((p) => p.is_default);
                if (defaultPrinter) {
                  bridgeState.defaultPrinter = defaultPrinter.name;
                } else {
                  bridgeState.defaultPrinter = printers[0].name;
                }
                console.log(`Auto-selected default printer: ${bridgeState.defaultPrinter}`);
              }
            }
          }
        } catch (error) {
          console.warn("Failed to update printers:", error);
          bridgeState.isConnected = false;
        }
      };
      const setDefaultPrinter = (printerName) => {
        const printer = bridgeState.availablePrinters.find((p) => p.name === printerName);
        if (printer) {
          bridgeState.defaultPrinter = printerName;
          console.log(`Default printer changed to: ${printerName}`);
          return true;
        }
        console.warn(`Printer '${printerName}' not found in available printers`);
        return false;
      };
      const getDefaultPrinter = () => {
        return bridgeState.defaultPrinter;
      };
      const enhancedBridgeClient = {
        ...bridgeClient,
        updatePrinters,
        setDefaultPrinter,
        getDefaultPrinter,
        getState: () => ({ ...bridgeState })
      };
      app.provide("vuePrintItBridge", enhancedBridgeClient);
      app.provide("vuePrintItBridgeOptions", bridgeOptions);
      app.provide("vuePrintItBridgeState", bridgeState);
      app.config.globalProperties.$printBridge = enhancedBridgeClient;
      app.config.globalProperties.$printBridgeState = bridgeState;
      if (bridgeOptions.autoConnect) {
        updatePrinters().catch(() => {
          console.debug("Bridge auto-connect failed - will retry on first use");
        });
      }
    }
  };
}
function usePrintBridge() {
  const instance = vue.getCurrentInstance();
  const bridgeClient = vue.inject("vuePrintItBridge") || (instance == null ? void 0 : instance.appContext.config.globalProperties.$printBridge);
  const bridgeOptions = vue.inject("vuePrintItBridgeOptions");
  const bridgeState = vue.inject("vuePrintItBridgeState") || (instance == null ? void 0 : instance.appContext.config.globalProperties.$printBridgeState);
  const isAvailable = vue.ref(null);
  vue.onMounted(async () => {
    if (bridgeClient) {
      isAvailable.value = await bridgeClient.checkAvailability();
      if (isAvailable.value && (bridgeState == null ? void 0 : bridgeState.availablePrinters.length) === 0) {
        await bridgeClient.updatePrinters();
      }
    }
  });
  return {
    bridgeClient,
    bridgeOptions,
    bridgeState,
    isAvailable,
    /**
     * Refreshes the list of available printers
     * @returns Promise that resolves when printers are refreshed
     */
    refreshPrinters: async () => {
      if (bridgeClient == null ? void 0 : bridgeClient.updatePrinters) {
        await bridgeClient.updatePrinters();
        isAvailable.value = (bridgeState == null ? void 0 : bridgeState.isConnected) || false;
      }
    },
    /**
     * Sets the default printer
     * @param printerName - Name of the printer to set as default
     * @returns boolean indicating success
     */
    setDefaultPrinter: (printerName) => {
      return (bridgeClient == null ? void 0 : bridgeClient.setDefaultPrinter) ? bridgeClient.setDefaultPrinter(printerName) : false;
    },
    /**
     * Gets the current default printer
     * @returns Default printer name or null
     */
    getDefaultPrinter: () => {
      return (bridgeClient == null ? void 0 : bridgeClient.getDefaultPrinter) ? bridgeClient.getDefaultPrinter() : null;
    },
    /**
     * Checks the bridge connection status
     * @returns Promise that resolves to connection status
     */
    checkConnection: async () => {
      if (bridgeClient) {
        isAvailable.value = await bridgeClient.checkAvailability();
        return isAvailable.value;
      }
      return false;
    }
  };
}

exports.BridgeClient = BridgeClient;
exports.createVuePrintIt = createVuePrintIt;
exports.createVuePrintItBridge = createVuePrintItBridge;
exports.default = createVuePrintIt;
exports.usePrint = usePrint;
exports.usePrintBridge = usePrintBridge;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map