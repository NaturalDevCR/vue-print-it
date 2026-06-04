import { getCurrentInstance, inject } from "vue";
import type {
  PrintOptions,
  GlobalPrintOptions,
  PrintInstance,
  PrintBridgeInstance,
  BridgeHealthResponse,
  BridgePrinter,
  BridgePrintRequest,
  BridgePrintResponse,
} from "../types";

export const VUE_PRINT_IT_INJECTION_KEY = "vuePrintIt";
export const VUE_PRINT_IT_METHOD_NAME_KEY = "vuePrintItMethodName";

const DEFAULT_STYLE_LOAD_TIMEOUT = 5000;
const DEFAULT_IMAGE_LOAD_TIMEOUT = 5000;
const PRINT_ROOT_CLASS = "vue-print-it-content";

type BridgeClientLike = PrintBridgeInstance & {
  updatePrinters?: () => Promise<void>;
  getDefaultPrinter?: () => string | null;
};

type BridgeClientResolver = () => BridgeClientLike | null | undefined;

type NormalizedPrintOptions = Omit<
  PrintOptions,
  | "name"
  | "specs"
  | "styles"
  | "styleUrls"
  | "inlineStyles"
  | "timeout"
  | "autoClose"
  | "windowTitle"
  | "preserveStyles"
  | "includeRoot"
  | "scale"
  | "printCss"
  | "styleLoadTimeout"
  | "waitForImages"
  | "imageLoadTimeout"
  | "printTarget"
  | "onBeforePrint"
  | "onAfterPrint"
  | "onPrintError"
> & {
  name: string;
  specs: NonNullable<PrintOptions["specs"]>;
  styles: string[];
  timeout: number;
  autoClose: boolean;
  windowTitle: string;
  preserveStyles: boolean;
  includeRoot: boolean;
  scale: number;
  printCss: string[];
  styleLoadTimeout: number;
  waitForImages: boolean;
  imageLoadTimeout: number;
  printTarget: "window" | "iframe";
  onBeforePrint: () => void | Promise<void>;
  onAfterPrint: () => void | Promise<void>;
  onPrintError: (error: Error) => void;
};

function normalizeCssList(value?: string | string[]): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function normalizeScale(value: unknown): number {
  const scale = Number(value);
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

function normalizeTimeout(value: unknown, fallback: number): number {
  const timeout = Number(value);
  return Number.isFinite(timeout) && timeout >= 0 ? timeout : fallback;
}

function ensureBrowserEnvironment(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("vue-print-it requires a browser environment to print.");
  }
}

function isStylesheetUrl(value: string): boolean {
  return /^(https?:\/\/|\/\/|\/|\.\/|\.\.\/)/.test(value.trim());
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function appendInlineStyle(win: Window, css: string): void {
  if (!css) return;

  const styleElement = win.document.createElement("style");
  styleElement.textContent = css;
  win.document.head.appendChild(styleElement);
}

function cloneStylesheetLink(
  win: Window,
  source: HTMLLinkElement
): HTMLLinkElement {
  const link = win.document.createElement("link");
  link.rel = "stylesheet";
  link.href = source.href;

  if (source.media) link.media = source.media;
  if (source.crossOrigin !== null) link.crossOrigin = source.crossOrigin;
  if (source.integrity) link.integrity = source.integrity;
  if (source.referrerPolicy) link.referrerPolicy = source.referrerPolicy;

  return link;
}

function appendStylesheetLink(
  win: Window,
  link: HTMLLinkElement,
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (settled) return;

      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      link.removeEventListener("load", finish);
      link.removeEventListener("error", finish);
      resolve();
    };

    link.addEventListener("load", finish);
    link.addEventListener("error", finish);
    win.document.head.appendChild(link);

    if (timeoutMs <= 0) {
      finish();
      return;
    }

    timeoutId = setTimeout(finish, timeoutMs);
  });
}

function extractAccessibleCssRules(): string[] {
  const cssRules: string[] = [];

  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach((rule) => {
            cssRules.push(rule.cssText);
          });
        }
      } catch {
        // Ignore CORS errors from inaccessible stylesheets.
      }
    });
  } catch {
    // Ignore stylesheet enumeration errors.
  }

  return cssRules;
}

/**
 * Injects page styles automatically into the print window.
 * Resolves once stylesheet links either load, error, or reach the load timeout.
 */
async function injectPageStyles(
  win: Window,
  styleLoadTimeout: number
): Promise<void> {
  const styleElements = document.querySelectorAll("style");
  styleElements.forEach((style) => {
    appendInlineStyle(win, style.textContent || "");
  });

  const linkLoadPromises: Promise<void>[] = [];
  const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
  linkElements.forEach((link) => {
    const stylesheetLink = cloneStylesheetLink(win, link as HTMLLinkElement);
    linkLoadPromises.push(
      appendStylesheetLink(win, stylesheetLink, styleLoadTimeout)
    );
  });

  const cssRules = extractAccessibleCssRules();
  if (cssRules.length > 0) {
    appendInlineStyle(win, cssRules.join("\n"));
  }

  await Promise.all(linkLoadPromises);
}

/**
 * Injects custom styles into the print window.
 * Resolves once custom stylesheet URLs either load, error, or reach the timeout.
 */
async function injectCustomStyles(
  win: Window,
  styles: string[],
  styleLoadTimeout: number
): Promise<void> {
  const linkLoadPromises = styles.map((style) => {
    if (isStylesheetUrl(style)) {
      const link = win.document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = style.trim();
      return appendStylesheetLink(win, link, styleLoadTimeout);
    }

    appendInlineStyle(win, style);
    return Promise.resolve();
  });

  await Promise.all(linkLoadPromises);
}

/**
 * Gets the bridge client if available.
 */
function getBridgeClient(
  resolveBridgeClient?: BridgeClientResolver
): BridgeClientLike | null {
  const resolvedBridgeClient = resolveBridgeClient?.();
  if (resolvedBridgeClient) return resolvedBridgeClient;

  if (typeof window === "undefined") return null;

  const instance = getCurrentInstance();
  if (instance) {
    const injectedBridge = inject<BridgeClientLike | null>(
      "vuePrintItBridge",
      null
    );
    if (injectedBridge) return injectedBridge;

    const globalBridge =
      instance.appContext.config.globalProperties.$printBridge;
    if (globalBridge) return globalBridge;
  }

  return null;
}

/**
 * Resolves element from string ID or HTMLElement.
 */
function resolveElement(element: HTMLElement | string): HTMLElement {
  if (typeof element === "string") {
    const found = document.getElementById(element);
    if (!found) {
      throw new Error(`Element with ID '${element}' not found`);
    }
    return found;
  }
  return element;
}

function syncFormControlState(
  sourceElement: HTMLElement,
  clonedElement: HTMLElement
): void {
  const sourceControls = sourceElement.querySelectorAll(
    "input, textarea, select"
  );
  const clonedControls = clonedElement.querySelectorAll(
    "input, textarea, select"
  );

  sourceControls.forEach((sourceControl, index) => {
    const clonedControl = clonedControls[index];
    if (!clonedControl) return;

    if (
      sourceControl instanceof HTMLInputElement &&
      clonedControl instanceof HTMLInputElement
    ) {
      if (
        sourceControl.type === "checkbox" ||
        sourceControl.type === "radio"
      ) {
        if (sourceControl.checked) {
          clonedControl.setAttribute("checked", "checked");
        } else {
          clonedControl.removeAttribute("checked");
        }
      } else {
        clonedControl.setAttribute("value", sourceControl.value);
      }
    } else if (
      sourceControl instanceof HTMLTextAreaElement &&
      clonedControl instanceof HTMLTextAreaElement
    ) {
      clonedControl.textContent = sourceControl.value;
    } else if (
      sourceControl instanceof HTMLSelectElement &&
      clonedControl instanceof HTMLSelectElement
    ) {
      Array.from(sourceControl.options).forEach((option, optionIndex) => {
        const clonedOption = clonedControl.options[optionIndex];
        if (!clonedOption) return;

        if (option.selected) {
          clonedOption.setAttribute("selected", "selected");
        } else {
          clonedOption.removeAttribute("selected");
        }
      });
    }
  });
}

function replaceCanvasWithImages(
  sourceElement: HTMLElement,
  clonedElement: HTMLElement
): void {
  const sourceCanvases = sourceElement.querySelectorAll("canvas");
  const clonedCanvases = clonedElement.querySelectorAll("canvas");

  sourceCanvases.forEach((sourceCanvas, index) => {
    const clonedCanvas = clonedCanvases[index];
    if (!clonedCanvas) return;

    try {
      const dataUrl = sourceCanvas.toDataURL();
      const img = clonedElement.ownerDocument.createElement("img");
      img.src = dataUrl;
      img.style.cssText = sourceCanvas.style.cssText;
      img.className = sourceCanvas.className;
      img.width = sourceCanvas.width;
      img.height = sourceCanvas.height;
      clonedCanvas.parentNode?.replaceChild(img, clonedCanvas);
    } catch (error) {
      console.warn("Cannot convert canvas to image (tainted?)", error);
    }
  });
}

function cloneElementForPrint(targetElement: HTMLElement): HTMLElement {
  const clonedElement = targetElement.cloneNode(true) as HTMLElement;
  syncFormControlState(targetElement, clonedElement);
  replaceCanvasWithImages(targetElement, clonedElement);
  return clonedElement;
}

function getPrintableContent(
  targetElement: HTMLElement,
  options: NormalizedPrintOptions
): string {
  const clonedElement = cloneElementForPrint(targetElement);
  return options.includeRoot ? clonedElement.outerHTML : clonedElement.innerHTML;
}

function buildManagedPrintCss(options: NormalizedPrintOptions): string {
  const css: string[] = [];
  const pageSize = options.pageSize?.trim();
  const pageRuleParts = [pageSize, options.orientation].filter(Boolean);

  if (pageRuleParts.length > 0) {
    css.push(`@page { size: ${pageRuleParts.join(" ")}; }`);
  }

  if (options.scale !== 1) {
    css.push(`
@media print {
  .${PRINT_ROOT_CLASS} {
    transform: scale(${options.scale});
    transform-origin: top left;
    width: calc(100% / ${options.scale});
  }
}`);
  }

  css.push(...options.printCss);

  return css.filter(Boolean).join("\n");
}

function buildStyleEntryHtml(style: string): string {
  if (isStylesheetUrl(style)) {
    return `<link rel="stylesheet" href="${escapeHtml(style.trim())}">`;
  }

  return `<style>${style}</style>`;
}

function buildPreservedStylesHtml(): string {
  let htmlContent = "";

  const styleElements = document.querySelectorAll("style");
  styleElements.forEach((style) => {
    htmlContent += `<style>${style.textContent || ""}</style>`;
  });

  const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
  linkElements.forEach((link) => {
    const href = (link as HTMLLinkElement).href;
    if (href) {
      htmlContent += `<link rel="stylesheet" href="${escapeHtml(href)}">`;
    }
  });

  const cssRules = extractAccessibleCssRules();
  if (cssRules.length > 0) {
    htmlContent += `<style>${cssRules.join("\n")}</style>`;
  }

  return htmlContent;
}

/**
 * Builds complete HTML content with styles for printing.
 */
function buildPrintHtml(
  targetElement: HTMLElement,
  options: NormalizedPrintOptions
): string {
  const managedPrintCss = buildManagedPrintCss(options);
  const preservedStyles = options.preserveStyles ? buildPreservedStylesHtml() : "";
  const customStyles = options.styles.map(buildStyleEntryHtml).join("");
  const printCss = managedPrintCss ? `<style>${managedPrintCss}</style>` : "";
  const printableContent = getPrintableContent(targetElement, options);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(options.windowTitle)}</title>
    ${preservedStyles}
    ${customStyles}
    ${printCss}
  </head>
  <body>
    <div class="${PRINT_ROOT_CLASS}">
      ${printableContent}
    </div>
  </body>
</html>`;
}

function buildPrintShellHtml(
  targetElement: HTMLElement,
  options: NormalizedPrintOptions
): string {
  const printableContent = getPrintableContent(targetElement, options);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(options.windowTitle)}</title>
  </head>
  <body>
    <div class="${PRINT_ROOT_CLASS}">
      ${printableContent}
    </div>
  </body>
</html>`;
}

async function waitForFonts(win: Window): Promise<void> {
  const fonts = (win.document as Document & {
    fonts?: { ready?: Promise<void> };
  }).fonts;

  if (!fonts?.ready) return;

  try {
    await fonts.ready;
  } catch {
    // Fonts should improve print fidelity, but should not block printing.
  }
}

function waitForImage(
  image: HTMLImageElement,
  timeoutMs: number
): Promise<void> {
  if (image.complete) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (settled) return;

      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve();
    };

    image.addEventListener("load", finish);
    image.addEventListener("error", finish);

    if (timeoutMs <= 0) {
      finish();
      return;
    }

    timeoutId = setTimeout(finish, timeoutMs);
  });
}

async function waitForImages(win: Window, timeoutMs: number): Promise<void> {
  const images = Array.from(win.document.images);
  if (images.length === 0) return;

  await Promise.all(images.map((image) => waitForImage(image, timeoutMs)));
}

function createHiddenPrintFrame(): {
  frame: HTMLIFrameElement;
  win: Window;
} {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.style.visibility = "hidden";
  document.body.appendChild(frame);

  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    throw new Error("Could not create print iframe");
  }

  return { frame, win };
}

/**
 * Prints content using the bridge client.
 */
async function printWithBridge(
  element: HTMLElement | string,
  options: NormalizedPrintOptions,
  bridgeClient: BridgeClientLike
): Promise<void> {
  const targetElement = resolveElement(element);
  const htmlContent = buildPrintHtml(targetElement, options);

  const base64Content = bridgeClient.htmlToBase64(htmlContent);
  let printerName: string | undefined = options.printerName;

  if (!printerName) {
    printerName = bridgeClient.getDefaultPrinter
      ? bridgeClient.getDefaultPrinter() || undefined
      : undefined;

    if (!printerName && bridgeClient.updatePrinters) {
      await bridgeClient.updatePrinters();
      printerName = bridgeClient.getDefaultPrinter?.() || undefined;
    }
  }

  const printRequest: BridgePrintRequest = {
    printer_name: printerName,
    content: base64Content,
    content_type: (options.contentType || "html") as "html" | "pdf",
    copies: options.copies || 1,
  };

  const result = await bridgeClient.print(printRequest);

  if (!result.success) {
    throw new Error(`Print error: ${result.message}`);
  }

  console.log(`Print successful. Job ID: ${result.job_id}`);
}

/**
 * Prints content using browser window.
 */
async function printWithBrowser(
  element: HTMLElement | string,
  options: NormalizedPrintOptions
): Promise<void> {
  const targetElement = resolveElement(element);
  let cleanup: (() => void) | undefined;

  let specsString = "";
  if (Array.isArray(options.specs)) {
    specsString = options.specs.join(",");
  } else if (typeof options.specs === "object") {
    const specsArray = [];
    if (options.specs.width) specsArray.push(`width=${options.specs.width}`);
    if (options.specs.height) specsArray.push(`height=${options.specs.height}`);
    specsString = specsArray.join(",");
  }

  let win: Window | null;
  if (options.printTarget === "iframe") {
    const printFrame = createHiddenPrintFrame();
    win = printFrame.win;
    cleanup = options.autoClose ? () => printFrame.frame.remove() : undefined;
  } else {
    win = window.open("", options.name, specsString);
    cleanup = options.autoClose ? () => win?.close() : undefined;
  }

  if (!win) {
    throw new Error("Could not open print window");
  }

  win.document.open();
  win.document.write(buildPrintShellHtml(targetElement, options));
  win.document.close();

  if (options.preserveStyles) {
    await injectPageStyles(win, options.styleLoadTimeout);
  }

  if (options.styles.length > 0) {
    await injectCustomStyles(win, options.styles, options.styleLoadTimeout);
  }

  const managedPrintCss = buildManagedPrintCss(options);
  if (managedPrintCss) {
    appendInlineStyle(win, managedPrintCss);
  }

  await waitForFonts(win);
  if (options.waitForImages) {
    await waitForImages(win, options.imageLoadTimeout);
  }

  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      try {
        win.focus();
        win.print();

        cleanup?.();

        resolve();
      } catch (error) {
        reject(error);
      }
    }, options.timeout);
  });
}

function normalizeOptions(
  globalOptions: Partial<GlobalPrintOptions>,
  localOptions: Partial<PrintOptions>
): NormalizedPrintOptions {
  const defaultOptions = {
    name: "_blank",
    specs: ["fullscreen=yes", "titlebar=yes", "scrollbars=yes"],
    timeout: 1000,
    autoClose: true,
    windowTitle:
      typeof window !== "undefined" ? window.document.title : "Document",
    preserveStyles: true,
    includeRoot: true,
    scale: 1,
    styleLoadTimeout: DEFAULT_STYLE_LOAD_TIMEOUT,
    waitForImages: true,
    imageLoadTimeout: DEFAULT_IMAGE_LOAD_TIMEOUT,
    printTarget: "window" as const,
  };

  return {
    name: localOptions.name ?? globalOptions.name ?? defaultOptions.name,
    specs: localOptions.specs ?? globalOptions.specs ?? defaultOptions.specs,
    styles: [
      ...normalizeCssList(globalOptions.styles),
      ...normalizeCssList(globalOptions.styleUrls),
      ...normalizeCssList(globalOptions.inlineStyles),
      ...normalizeCssList(localOptions.styles),
      ...normalizeCssList(localOptions.styleUrls),
      ...normalizeCssList(localOptions.inlineStyles),
    ],
    timeout: normalizeTimeout(
      localOptions.timeout ?? globalOptions.timeout,
      defaultOptions.timeout
    ),
    autoClose:
      localOptions.autoClose ?? globalOptions.autoClose ?? defaultOptions.autoClose,
    windowTitle:
      localOptions.windowTitle ??
      globalOptions.windowTitle ??
      defaultOptions.windowTitle,
    preserveStyles:
      localOptions.preserveStyles ??
      globalOptions.preserveStyles ??
      defaultOptions.preserveStyles,
    includeRoot:
      localOptions.includeRoot ??
      globalOptions.includeRoot ??
      defaultOptions.includeRoot,
    pageSize: localOptions.pageSize ?? globalOptions.pageSize,
    orientation: localOptions.orientation ?? globalOptions.orientation,
    scale: normalizeScale(
      localOptions.scale ?? globalOptions.scale ?? defaultOptions.scale
    ),
    printCss: [
      ...normalizeCssList(globalOptions.printCss),
      ...normalizeCssList(localOptions.printCss),
    ],
    styleLoadTimeout: normalizeTimeout(
      localOptions.styleLoadTimeout ?? globalOptions.styleLoadTimeout,
      defaultOptions.styleLoadTimeout
    ),
    waitForImages:
      localOptions.waitForImages ??
      globalOptions.waitForImages ??
      defaultOptions.waitForImages,
    imageLoadTimeout: normalizeTimeout(
      localOptions.imageLoadTimeout ?? globalOptions.imageLoadTimeout,
      defaultOptions.imageLoadTimeout
    ),
    printTarget:
      localOptions.printTarget ??
      globalOptions.printTarget ??
      defaultOptions.printTarget,
    useBridge: localOptions.useBridge,
    printerName: localOptions.printerName,
    copies: localOptions.copies,
    contentType: localOptions.contentType,
    onBeforePrint: localOptions.onBeforePrint || (() => {}),
    onAfterPrint: localOptions.onAfterPrint || (() => {}),
    onPrintError: localOptions.onPrintError || (() => {}),
  };
}

/**
 * Creates print functions with global configuration.
 */
export function createPrintFunction(
  globalOptions: Partial<GlobalPrintOptions> = {},
  resolveBridgeClient?: BridgeClientResolver
): PrintInstance {
  async function print(
    element: HTMLElement | string,
    localOptions: Partial<PrintOptions> = {}
  ): Promise<void> {
    ensureBrowserEnvironment();
    const options = normalizeOptions(globalOptions, localOptions);

    try {
      await options.onBeforePrint();

      const bridgeClient = getBridgeClient(resolveBridgeClient);
      const shouldUseBridge =
        options.useBridge &&
        bridgeClient &&
        (await bridgeClient.checkAvailability());

      if (shouldUseBridge) {
        await printWithBridge(element, options, bridgeClient);
      } else {
        await printWithBrowser(element, options);
      }

      await options.onAfterPrint();
    } catch (error) {
      options.onPrintError(error as Error);
      throw error;
    }
  }

  async function getBridgeStatus(): Promise<BridgeHealthResponse | null> {
    const bridgeClient = getBridgeClient(resolveBridgeClient);
    return bridgeClient ? await bridgeClient.getHealth() : null;
  }

  async function getAvailablePrinters(): Promise<BridgePrinter[]> {
    const bridgeClient = getBridgeClient(resolveBridgeClient);
    if (!bridgeClient) return [];

    const isAvailable = await bridgeClient.checkAvailability();
    return isAvailable ? await bridgeClient.getPrinters() : [];
  }

  async function printDirect(
    content: string,
    options: Partial<BridgePrintRequest> = {}
  ): Promise<BridgePrintResponse> {
    const bridgeClient = getBridgeClient(resolveBridgeClient);
    if (!bridgeClient) {
      throw new Error(
        "Bridge plugin not installed. Please install vue-print-it bridge plugin."
      );
    }

    const isAvailable = await bridgeClient.checkAvailability();
    if (!isAvailable) {
      throw new Error("Bridge not available");
    }

    const request: BridgePrintRequest = {
      content: bridgeClient.htmlToBase64(content),
      content_type: "html" as const,
      copies: 1,
      ...options,
    };

    return await bridgeClient.print(request);
  }

  async function printComponent(
    componentRef: any,
    localOptions: Partial<PrintOptions> = {}
  ): Promise<void> {
    console.warn(
      "printComponent is currently experimental and requires the component to be already mounted in the DOM. Use print() with element ID for best results."
    );

    const element = componentRef.$el || componentRef;
    if (element instanceof HTMLElement) {
      return print(element, localOptions);
    }

    throw new Error(
      "Could not resolve component to HTMLElement. Ensure the component is mounted."
    );
  }

  return {
    print,
    printComponent,
    getBridgeStatus,
    getAvailablePrinters,
    printDirect,
  };
}

function createPrintInstanceFromGlobal(globalPrint: any): PrintInstance | null {
  if (typeof globalPrint !== "function") return null;

  const fallbackFunctions = createPrintFunction();

  return {
    ...fallbackFunctions,
    print: globalPrint,
    printComponent: globalPrint.printComponent || fallbackFunctions.printComponent,
    getBridgeStatus:
      globalPrint.getBridgeStatus || fallbackFunctions.getBridgeStatus,
    getAvailablePrinters:
      globalPrint.getAvailablePrinters || fallbackFunctions.getAvailablePrinters,
    printDirect: globalPrint.printDirect || fallbackFunctions.printDirect,
  };
}

/**
 * Vue composable for printing functionality.
 */
export function usePrint(): PrintInstance {
  const instance = getCurrentInstance();

  if (instance) {
    const injectedPrintFunctions = inject<PrintInstance | null>(
      VUE_PRINT_IT_INJECTION_KEY,
      null
    );
    if (injectedPrintFunctions) return injectedPrintFunctions;

    const injectedMethodName = inject<string | null>(
      VUE_PRINT_IT_METHOD_NAME_KEY,
      null
    );
    const methodName = injectedMethodName || "$print";
    const globalProperties = instance.appContext.config.globalProperties;
    const globalPrint = globalProperties[methodName] || globalProperties.$print;
    const printInstance = createPrintInstanceFromGlobal(globalPrint);

    if (printInstance) return printInstance;
  }

  return createPrintFunction();
}
