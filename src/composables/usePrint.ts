import { getCurrentInstance, inject } from 'vue';
import type { PrintOptions, GlobalPrintOptions, BridgeHealthResponse, BridgePrinter, BridgePrintRequest, BridgePrintResponse } from '../types';
import { BridgeClient } from '../utils/bridge-client';

/**
 * Injects page styles automatically into the print window
 * @param win - The print window to inject styles into
 * @returns Promise that resolves when styles are injected
 */
async function injectPageStyles(win: Window): Promise<void> {
  // Copy inline styles
  const styleElements = document.querySelectorAll('style');
  styleElements.forEach(style => {
    const newStyle = win.document.createElement('style');
    newStyle.textContent = style.textContent;
    win.document.head.appendChild(newStyle);
  });
  
  // Copy external stylesheets
  const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
  linkElements.forEach(link => {
    const newLink = win.document.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.href = (link as HTMLLinkElement).href;
    win.document.head.appendChild(newLink);
  });
  
  // Try to copy CSS rules from accessible stylesheets
  try {
    const cssRules: string[] = [];
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            cssRules.push(rule.cssText);
          });
        }
      } catch {
        // Ignore CORS errors
      }
    });
    
    if (cssRules.length > 0) {
      const styleElement = win.document.createElement('style');
      styleElement.textContent = cssRules.join('\n');
      win.document.head.appendChild(styleElement);
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Injects custom styles into the print window
 * @param win - The print window to inject styles into
 * @param styles - Array of CSS strings or URLs to inject
 * @returns Promise that resolves when custom styles are injected
 */
async function injectCustomStyles(win: Window, styles: string[]): Promise<void> {
  styles.forEach(style => {
    if (style.startsWith('http') || style.startsWith('/') || style.startsWith('./')) {
      // It's a stylesheet URL
      const link = win.document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = style;
      win.document.head.appendChild(link);
    } else {
      // It's inline CSS
      const styleElement = win.document.createElement('style');
      styleElement.textContent = style;
      win.document.head.appendChild(styleElement);
    }
  });
}

/**
 * Gets the bridge client if available
 * @returns BridgeClient instance or null
 */
function getBridgeClient(): BridgeClient | null {
  if (typeof window === 'undefined') return null;
  
  // Try to get from Vue instance
  const instance = getCurrentInstance();
  if (instance) {
    const injectedBridge = inject('vuePrintItBridge', null);
    if (injectedBridge) return injectedBridge;
    
    const globalBridge = instance.appContext.config.globalProperties.$printBridge;
    if (globalBridge) return globalBridge;
  }
  
  return null;
}

/**
 * Resolves element from string ID or HTMLElement
 * @param element - Element ID string or HTMLElement
 * @returns HTMLElement
 * @throws Error if element not found
 */
function resolveElement(element: HTMLElement | string): HTMLElement {
  if (typeof element === 'string') {
    const found = document.getElementById(element);
    if (!found) {
      throw new Error(`Element with ID '${element}' not found`);
    }
    return found;
  }
  return element;
}

/**
 * Builds complete HTML content with styles for printing
 * @param targetElement - Element to print
 * @param options - Print options
 * @param globalOptions - Global print options
 * @returns Complete HTML string
 */
function buildPrintHtml(targetElement: HTMLElement, options: any, globalOptions: Partial<GlobalPrintOptions>): string {
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.windowTitle}</title>
  `;
  
  // Add styles if preserveStyles is enabled
  if (options.preserveStyles) {
    // Copy inline styles
    const styleElements = document.querySelectorAll('style');
    styleElements.forEach(style => {
      htmlContent += `<style>${style.textContent}</style>`;
    });
    
    // Copy external stylesheets
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    linkElements.forEach(link => {
      htmlContent += `<link rel="stylesheet" href="${(link as HTMLLinkElement).href}">`;
    });
  }
  
  // Add custom styles
  const allStyles = [...(globalOptions.styles || []), ...(options.styles || [])];
  allStyles.forEach(style => {
    if (style.startsWith('http') || style.startsWith('/') || style.startsWith('./')) {
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

/**
 * Prints content using the bridge client
 * @param element - Element to print
 * @param options - Print options
 * @param globalOptions - Global print options
 * @param bridgeClient - Bridge client instance
 * @returns Promise that resolves when printing is complete
 */
async function printWithBridge(
  element: HTMLElement | string, 
  options: any, 
  globalOptions: Partial<GlobalPrintOptions>,
  bridgeClient: any // Enhanced bridge client
): Promise<void> {
  const targetElement = resolveElement(element);
  const htmlContent = buildPrintHtml(targetElement, options, globalOptions);
  
  // Convert to Base64
  const base64Content = bridgeClient.htmlToBase64(htmlContent);
  
  // Determine printer name with fallback logic
  let printerName = options.printerName;
  
  if (!printerName) {
    // Try to get default printer from bridge state
    printerName = bridgeClient.getDefaultPrinter ? bridgeClient.getDefaultPrinter() : null;
    
    // If still no printer, refresh and try again
    if (!printerName && bridgeClient.updatePrinters) {
      await bridgeClient.updatePrinters();
      printerName = bridgeClient.getDefaultPrinter();
    }
  }
  
  // Prepare request for bridge
  const printRequest: BridgePrintRequest = {
    printer_name: printerName,
    content: base64Content,
    content_type: (options.contentType || 'html') as 'html' | 'pdf',
    copies: options.copies || 1
  };
  
  // Send to bridge
  const result = await bridgeClient.print(printRequest);
  
  if (!result.success) {
    throw new Error(`Print error: ${result.message}`);
  }
  
  console.log(`Print successful. Job ID: ${result.job_id}`);
}

/**
 * Prints content using browser window
 * @param element - Element to print
 * @param options - Print options
 * @param globalOptions - Global print options
 * @returns Promise that resolves when printing is complete
 */
async function printWithBrowser(
  element: HTMLElement | string, 
  options: any, 
  globalOptions: Partial<GlobalPrintOptions>
): Promise<void> {
  const targetElement = resolveElement(element);
  
  // Convert specs if it's an object
  let specsString = '';
  if (Array.isArray(options.specs)) {
    specsString = options.specs.join(',');
  } else if (typeof options.specs === 'object') {
    const specsArray = [];
    if (options.specs.width) specsArray.push(`width=${options.specs.width}`);
    if (options.specs.height) specsArray.push(`height=${options.specs.height}`);
    specsString = specsArray.join(',');
  }
  
  const win = window.open('', options.name, specsString);
  
  if (!win) {
    throw new Error('Could not open print window');
  }
  
  // Create window HTML
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
  
  // Inject styles
  if (options.preserveStyles) {
    await injectPageStyles(win);
  }
  
  const allStyles = [...(globalOptions.styles || []), ...(options.styles || [])];
  if (allStyles.length > 0) {
    await injectCustomStyles(win, allStyles);
  }
  
  // Print after timeout
  await new Promise<void>((resolve, reject) => {
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

/**
 * Creates print functions with global configuration
 * @param globalOptions - Global options to apply to all print operations
 * @returns Object containing print functions and bridge methods
 * @example
 * ```typescript
 * const printFunctions = createPrintFunction({
 *   windowTitle: 'My Document',
 *   autoClose: true
 * })
 * ```
 */
export function createPrintFunction(globalOptions: Partial<GlobalPrintOptions> = {}) {
  const defaultOptions: Required<Omit<PrintOptions, 'onBeforePrint' | 'onAfterPrint' | 'onPrintError' | 'printerName' | 'useBridge' | 'copies' | 'contentType'>> = {
    name: '_blank',
    specs: ['fullscreen=yes', 'titlebar=yes', 'scrollbars=yes'],
    styles: [],
    timeout: 1000,
    autoClose: true,
    windowTitle: typeof window !== 'undefined' ? window.document.title : 'Document',
    preserveStyles: true
  };

  /**
   * Main print function that handles both browser and bridge printing
   * @param element - HTML element or element ID to print
   * @param localOptions - Print configuration options
   * @returns Promise that resolves when printing is complete
   */
  async function print(element: HTMLElement | string, localOptions: Partial<PrintOptions> = {}): Promise<void> {
    // Combine options: defaults < global < local
    const options = { 
      ...defaultOptions, 
      ...globalOptions, 
      ...localOptions,
      onBeforePrint: localOptions.onBeforePrint || (() => {}),
      onAfterPrint: localOptions.onAfterPrint || (() => {}),
      onPrintError: localOptions.onPrintError || (() => {})
    };
    
    try {
      await options.onBeforePrint();
      
      // Check if bridge should be used and is available
      const bridgeClient = getBridgeClient();
      const shouldUseBridge = options.useBridge && 
                             bridgeClient && 
                             await bridgeClient.checkAvailability();
      
      if (shouldUseBridge) {
        await printWithBridge(element, options, globalOptions, bridgeClient);
      } else {
        await printWithBrowser(element, options, globalOptions);
      }
      
      await options.onAfterPrint();
    } catch (error) {
      options.onPrintError(error as Error);
      throw error;
    }
  }

  /**
   * Gets bridge status if bridge plugin is available
   * @returns Promise that resolves to bridge health information or null
   */
  async function getBridgeStatus(): Promise<BridgeHealthResponse | null> {
    const bridgeClient = getBridgeClient();
    return bridgeClient ? await bridgeClient.getHealth() : null;
  }

  /**
   * Gets available printers if bridge plugin is available
   * @returns Promise that resolves to array of available printers
   */
  async function getAvailablePrinters(): Promise<BridgePrinter[]> {
    const bridgeClient = getBridgeClient();
    if (!bridgeClient) return [];
    
    const isAvailable = await bridgeClient.checkAvailability();
    return isAvailable ? await bridgeClient.getPrinters() : [];
  }

  /**
   * Prints content directly to a printer if bridge plugin is available
   * @param content - Content to print
   * @param options - Bridge print options
   * @returns Promise that resolves to print response
   */
  async function printDirect(content: string, options: Partial<BridgePrintRequest> = {}): Promise<BridgePrintResponse> {
    const bridgeClient = getBridgeClient();
    if (!bridgeClient) {
      throw new Error('Bridge plugin not installed. Please install vue-print-it bridge plugin.');
    }
    
    const isAvailable = await bridgeClient.checkAvailability();
    if (!isAvailable) {
      throw new Error('Bridge not available');
    }
    
    const request: BridgePrintRequest = {
      content: bridgeClient.htmlToBase64(content),
      content_type: 'html' as const,
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

/**
 * Vue composable for printing functionality
 * @returns Object containing print functions and bridge methods
 * @example
 * ```typescript
 * const { print, getBridgeStatus } = usePrint()
 * await print('element-id', { windowTitle: 'My Print' })
 * ```
 */
export function usePrint() {
  const instance = getCurrentInstance();
  
  if (instance?.appContext.config.globalProperties.$print) {
    return {
      print: instance.appContext.config.globalProperties.$print,
      getBridgeStatus: instance.appContext.config.globalProperties.$print.getBridgeStatus,
      getAvailablePrinters: instance.appContext.config.globalProperties.$print.getAvailablePrinters,
      printDirect: instance.appContext.config.globalProperties.$print.printDirect
    };
  }
  
  // Fallback: create local print function
  const printFunctions = createPrintFunction();
  return printFunctions;
}