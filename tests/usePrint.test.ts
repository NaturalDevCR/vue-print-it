import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, h } from "vue";
import { createPrintFunction, usePrint } from "../src/composables/usePrint";
import { createVuePrintIt } from "../src/plugin";
import { createVuePrintItBridge } from "../src/plugins/bridge-plugin";
import { BridgeClient } from "../src/utils/bridge-client";

function createPrintWindow() {
  const printDocument = document.implementation.createHTMLDocument("Print");
  const print = vi.fn();
  const focus = vi.fn();
  const close = vi.fn();
  const printWindow = {
    document: printDocument,
    print,
    focus,
    close,
  } as unknown as Window;

  vi.spyOn(window, "open").mockReturnValue(printWindow);

  return {
    printDocument,
    print,
    focus,
    close,
  };
}

afterEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createPrintFunction", () => {
  it("prints the target root element by default", async () => {
    document.body.innerHTML = `
      <section id="invoice" class="invoice-root">
        <input id="customer" value="initial">
        <p>Line item</p>
      </section>
    `;
    const input = document.getElementById("customer") as HTMLInputElement;
    input.value = "current value";
    const { printDocument, print } = createPrintWindow();

    await createPrintFunction({ preserveStyles: false }).print("invoice", {
      timeout: 0,
      autoClose: false,
      styleLoadTimeout: 0,
    });

    expect(print).toHaveBeenCalledOnce();
    expect(
      printDocument.body.querySelector(
        ".vue-print-it-content > #invoice.invoice-root"
      )
    ).not.toBeNull();
    expect(printDocument.body.querySelector("#customer")?.getAttribute("value"))
      .toBe("current value");
  });

  it("can print only children when includeRoot is false", async () => {
    document.body.innerHTML = `
      <section id="invoice" class="invoice-root">
        <p id="line-item">Line item</p>
      </section>
    `;
    const { printDocument } = createPrintWindow();

    await createPrintFunction({ preserveStyles: false }).print("invoice", {
      includeRoot: false,
      timeout: 0,
      autoClose: false,
      styleLoadTimeout: 0,
    });

    expect(printDocument.body.querySelector("#invoice")).toBeNull();
    expect(printDocument.body.querySelector("#line-item")).not.toBeNull();
  });

  it("injects page size, orientation, scale, and printCss", async () => {
    document.body.innerHTML = `<section id="invoice">Printable</section>`;
    const { printDocument } = createPrintWindow();

    await createPrintFunction({
      pageSize: "A4",
      orientation: "landscape",
      scale: 0.82,
      printCss: ".screen-only { display: none; }",
      preserveStyles: false,
    }).print("invoice", {
      timeout: 0,
      autoClose: false,
      styleLoadTimeout: 0,
    });

    const css = Array.from(printDocument.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");

    expect(css).toContain("@page { size: A4 landscape; }");
    expect(css).toContain("transform: scale(0.82)");
    expect(css).toContain(".screen-only { display: none; }");
  });

  it("waits for stylesheet links before printing", async () => {
    vi.useFakeTimers();
    document.head.innerHTML = `<link rel="stylesheet" href="/print.css">`;
    document.body.innerHTML = `<section id="invoice">Printable</section>`;
    const { print } = createPrintWindow();

    const printPromise = createPrintFunction({ preserveStyles: true }).print(
      "invoice",
      {
        timeout: 0,
        autoClose: false,
        styleLoadTimeout: 50,
      }
    );

    await Promise.resolve();
    expect(print).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(49);
    expect(print).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await vi.runOnlyPendingTimersAsync();
    await printPromise;

    expect(print).toHaveBeenCalledOnce();
  });

  it("preserves textarea, select, and canvas state in the printed clone", async () => {
    document.body.innerHTML = `
      <section id="invoice">
        <textarea id="notes">old</textarea>
        <select id="status">
          <option value="draft">Draft</option>
          <option value="paid">Paid</option>
        </select>
        <canvas id="chart" width="20" height="10"></canvas>
      </section>
    `;
    const textarea = document.getElementById("notes") as HTMLTextAreaElement;
    const select = document.getElementById("status") as HTMLSelectElement;
    const canvas = document.getElementById("chart") as HTMLCanvasElement;
    textarea.value = "fresh notes";
    select.value = "paid";
    vi.spyOn(canvas, "toDataURL").mockReturnValue("data:image/png;base64,abc");
    const { printDocument } = createPrintWindow();

    await createPrintFunction({ preserveStyles: false }).print("invoice", {
      timeout: 0,
      autoClose: false,
      styleLoadTimeout: 0,
      waitForImages: false,
    });

    expect(printDocument.querySelector("#notes")?.textContent).toBe(
      "fresh notes"
    );
    expect(
      printDocument
        .querySelector('option[value="paid"]')
        ?.getAttribute("selected")
    ).toBe("selected");
    expect(printDocument.querySelector("canvas")).toBeNull();
    expect(printDocument.querySelector("img")?.getAttribute("src")).toBe(
      "data:image/png;base64,abc"
    );
  });

  it("supports separated stylesheet URLs and inline styles", async () => {
    document.body.innerHTML = `<section id="invoice">Printable</section>`;
    const { printDocument } = createPrintWindow();

    await createPrintFunction({
      preserveStyles: false,
      styleUrls: ["/global.css"],
      inlineStyles: [".global { color: blue; }"],
    }).print("invoice", {
      styleUrls: ["/local.css"],
      inlineStyles: [".local { color: red; }"],
      timeout: 0,
      autoClose: false,
      styleLoadTimeout: 0,
    });

    expect(
      Array.from(printDocument.querySelectorAll("link")).map((link) =>
        link.getAttribute("href")
      )
    ).toEqual(["/global.css", "/local.css"]);
    const css = Array.from(printDocument.querySelectorAll("style"))
      .map((style) => style.textContent)
      .join("\n");
    expect(css).toContain(".global { color: blue; }");
    expect(css).toContain(".local { color: red; }");
  });

  it("waits for images before printing", async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <section id="invoice">
        <img src="/slow-image.png" alt="Slow">
      </section>
    `;
    const { print } = createPrintWindow();

    const printPromise = createPrintFunction({ preserveStyles: false }).print(
      "invoice",
      {
        timeout: 0,
        autoClose: false,
        styleLoadTimeout: 0,
        imageLoadTimeout: 50,
      }
    );

    await Promise.resolve();
    expect(print).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(50);
    await vi.runOnlyPendingTimersAsync();
    await printPromise;

    expect(print).toHaveBeenCalledOnce();
  });

  it("can print through a hidden iframe", async () => {
    document.body.innerHTML = `<section id="invoice">Printable</section>`;
    const printDocument = document.implementation.createHTMLDocument("Print");
    const print = vi.fn();
    const focus = vi.fn();
    const fakeWindow = {
      document: printDocument,
      print,
      focus,
    } as unknown as Window;
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string, options?: ElementCreationOptions) => {
        const element = originalCreateElement(tagName, options);
        if (tagName.toLowerCase() === "iframe") {
          Object.defineProperty(element, "contentWindow", {
            configurable: true,
            value: fakeWindow,
          });
        }
        return element;
      }) as typeof document.createElement
    );

    await createPrintFunction({ preserveStyles: false }).print("invoice", {
      printTarget: "iframe",
      timeout: 0,
      autoClose: true,
      styleLoadTimeout: 0,
    });

    expect(print).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
    expect(document.querySelector("iframe")).toBeNull();
    expect(printDocument.body.textContent).toContain("Printable");
  });

  it("runs callbacks and forwards print errors", async () => {
    document.body.innerHTML = `<section id="invoice">Printable</section>`;
    const calls: string[] = [];
    vi.spyOn(window, "open").mockReturnValue(null);
    const onPrintError = vi.fn((error: Error) => {
      calls.push(`error:${error.message}`);
    });

    await expect(
      createPrintFunction({ preserveStyles: false }).print("invoice", {
        onBeforePrint: () => {
          calls.push("before");
        },
        onAfterPrint: () => {
          calls.push("after");
        },
        onPrintError,
      })
    ).rejects.toThrow("Could not open print window");

    expect(calls).toEqual(["before", "error:Could not open print window"]);
    expect(onPrintError).toHaveBeenCalledOnce();
  });
});

describe("createVuePrintIt", () => {
  it("provides print functions so usePrint respects globalMethodName", () => {
    let composablePrint: ReturnType<typeof usePrint> | undefined;
    const app = createApp(
      defineComponent({
        setup() {
          composablePrint = usePrint();
          return () => h("div");
        },
      })
    );
    const root = document.createElement("div");

    app.use(
      createVuePrintIt({
        globalMethodName: "$customPrint",
        preserveStyles: false,
      })
    );
    document.body.appendChild(root);
    app.mount(root);

    const globalPrint = app.config.globalProperties.$customPrint;
    expect(composablePrint?.print).toBe(globalPrint);
    expect(app.config.globalProperties.$print).toBeUndefined();
    expect(typeof globalPrint.printComponent).toBe("function");

    app.unmount();
  });
});

describe("createVuePrintItBridge", () => {
  it("keeps BridgeClient prototype methods when enhancing the client", () => {
    const app = createApp({ render: () => null });

    app.use(createVuePrintItBridge());

    const bridgeClient = app.config.globalProperties.$printBridge;
    expect(typeof bridgeClient.checkAvailability).toBe("function");
    expect(typeof bridgeClient.print).toBe("function");
    expect(typeof bridgeClient.updatePrinters).toBe("function");
  });
});

describe("BridgeClient", () => {
  it("uses configured headers and retries failed requests", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new BridgeClient({
      baseUrl: "http://localhost:9999",
      headers: { "X-Bridge-Token": "secret" },
      retryAttempts: 2,
      timeout: 1000,
    });

    await expect(client.checkAvailability()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:9999/health");
    expect(fetchMock.mock.calls[1][1].headers["X-Bridge-Token"]).toBe(
      "secret"
    );
  });
});
