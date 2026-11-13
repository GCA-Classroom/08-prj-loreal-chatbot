import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import vm from "node:vm";

class MockElement {
  constructor() {
    this.children = [];
    this.listeners = {};
    this.attributes = {};
    this.className = "";
    this.textContent = "";
    this.value = "";
    this.disabled = false;
    this.dataset = {};
    this.scrollTop = 0;
  }

  set innerHTML(value) {
    this._innerHTML = value;
    if (value === "") {
      this.children = [];
    }
  }

  get innerHTML() {
    return this._innerHTML || "";
  }

  get scrollHeight() {
    return this.children.length * 100;
  }

  append(...elements) {
    this.children.push(...elements);
  }

  appendChild(element) {
    this.children.push(element);
    return element;
  }

  prepend(element) {
    this.children.unshift(element);
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  focus() {}

  remove() {
    for (const element of allElements) {
      const index = element.children.indexOf(this);
      if (index >= 0) {
        element.children.splice(index, 1);
      }
    }
  }

  click() {
    return this.listeners.click?.({ preventDefault() {}, target: this });
  }

  querySelector(selector) {
    const classNames = selector.split(".").filter(Boolean);

    for (const child of this.children) {
      const childClasses = child.className.split(/\s+/);
      if (classNames.every((className) => childClasses.includes(className))) {
        return child;
      }

      const match = child.querySelector(selector);
      if (match) {
        return match;
      }
    }

    return null;
  }

  querySelectorAll(selector) {
    const classNames = selector.split(".").filter(Boolean);
    const matches = [];

    for (const child of this.children) {
      const childClasses = child.className.split(/\s+/);
      if (classNames.every((className) => childClasses.includes(className))) {
        matches.push(child);
      }
      matches.push(...child.querySelectorAll(selector));
    }

    return matches;
  }
}

let allElements = [];

function createBrowser(fetchImplementation, storedMessages = []) {
  allElements = [];
  const elements = Object.fromEntries(
    ["chatForm", "userInput", "chatWindow", "clearChatBtn", "sendBtn"].map((id) => [
      id,
      new MockElement()
    ])
  );
  const suggestionButtons = [new MockElement(), new MockElement()];
  const storage = new Map([
    ["loreal-chat-history", JSON.stringify(storedMessages)]
  ]);
  const localStorage = new Map();
  const document = {
    getElementById(id) {
      return elements[id];
    },
    createElement() {
      const element = new MockElement();
      allElements.push(element);
      return element;
    },
    querySelectorAll(selector) {
      return selector === ".suggestion-btn" ? suggestionButtons : [];
    }
  };

  for (const element of Object.values(elements)) {
    allElements.push(element);
  }
  allElements.push(...suggestionButtons);

  const context = {
    document,
    window: { BEAUTY_ADVISOR_WORKER_URL: "http://localhost:8787/api/chat" },
    sessionStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    localStorage: {
      getItem: (key) => localStorage.get(key) || null,
      setItem: (key, value) => localStorage.set(key, value)
    },
    fetch: fetchImplementation,
    confirm: () => true,
    Date,
    JSON
  };

  return { context, elements, suggestionButtons, storage };
}

async function loadFrontend(fetchImplementation, storedMessages) {
  const browser = createBrowser(fetchImplementation, storedMessages);
  const source = await readFile(new URL("../script.js", import.meta.url), "utf8");
  vm.runInNewContext(source, browser.context);
  return browser;
}

function submitMessage(elements, text) {
  elements.userInput.value = text;
  elements.chatForm.listeners.submit({ preventDefault() {} });
}

function successfulResponse(reply) {
  return {
    ok: true,
    json: async () => ({ reply })
  };
}

function waitForUi() {
  return new Promise((resolve) => setImmediate(resolve));
}

test("frontend shows the submitted question before the assistant reply and displays loading", async () => {
  let resolveFetch;
  const browser = await loadFrontend(
    () => new Promise((resolve) => {
      resolveFetch = resolve;
    })
  );

  submitMessage(browser.elements, "Help me build a skincare routine.");

  assert.equal(browser.elements.userInput.value, "");
  assert.equal(browser.elements.sendBtn.disabled, true);
  assert.equal(browser.elements.chatWindow.children[0].className, "message-row user");
  assert.equal(browser.elements.chatWindow.querySelector(".typing")?.className, "message-row assistant typing");

  resolveFetch(successfulResponse("Try a gentle cleanser and moisturizer."));
  await waitForUi();

  const rows = browser.elements.chatWindow.children.filter((child) =>
    child.className.startsWith("message-row")
  );
  assert.deepEqual(rows.map((row) => row.className), ["message-row user", "message-row assistant"]);
  assert.equal(browser.elements.sendBtn.disabled, false);
  assert.ok(rows[0].querySelector(".bubble.user"));
  assert.ok(rows[1].querySelector(".bubble.assistant"));
});

test("frontend prevents duplicate submissions while a request is pending", async () => {
  let resolveFetch;
  let fetchCount = 0;
  const browser = await loadFrontend(() => {
    fetchCount += 1;
    return new Promise((resolve) => {
      resolveFetch = resolve;
    });
  });

  submitMessage(browser.elements, "I need a skincare routine.");
  submitMessage(browser.elements, "I need a skincare routine.");
  assert.equal(fetchCount, 1);

  resolveFetch(successfulResponse("Start with a gentle cleanser."));
  await waitForUi();
});

test("frontend sends prior conversation turns with a contextual follow-up", async () => {
  const requests = [];
  const browser = await loadFrontend(async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return successfulResponse("Here is a suitable option.");
  });

  submitMessage(browser.elements, "I have dry skin and want a skincare routine.");
  await waitForUi();
  submitMessage(browser.elements, "Which one is cheaper?");
  await waitForUi();

  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1].messages.map(({ role }) => role), [
    "user",
    "assistant",
    "user"
  ]);
  assert.match(requests[1].messages[0].content, /dry skin/);
});

test("frontend preserves failed questions and retries without duplicating them", async () => {
  let fetchCount = 0;
  const browser = await loadFrontend(async () => {
    fetchCount += 1;
    if (fetchCount === 1) {
      throw new Error("offline");
    }
    return successfulResponse("A gentle cleanser is a good starting point.");
  });

  submitMessage(browser.elements, "Help me with skincare.");
  await waitForUi();

  const retryButton = browser.elements.chatWindow.querySelector(".retry-btn");
  assert.ok(retryButton);
  assert.match(browser.elements.chatWindow.querySelector(".message-error").textContent, /Could not get a reply/);

  await retryButton.click();
  await waitForUi();

  const rows = browser.elements.chatWindow.children.filter((child) =>
    child.className.startsWith("message-row")
  );
  assert.equal(fetchCount, 2);
  assert.deepEqual(rows.map((row) => row.className), ["message-row user", "message-row assistant"]);
});

test("frontend loads at most 12 stored messages and clear chat empties the conversation", async () => {
  const previousMessages = Array.from({ length: 14 }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `Beauty message ${index}`,
    timestamp: new Date().toISOString()
  }));
  const browser = await loadFrontend(async () => successfulResponse("Done."), previousMessages);

  assert.equal(
    browser.elements.chatWindow.children.filter((child) => child.className.startsWith("message-row")).length,
    12
  );

  browser.elements.clearChatBtn.click();
  assert.equal(browser.elements.chatWindow.querySelector(".empty-state")?.className, "empty-state");
});

test("brand asset and mobile layout styles are present", async () => {
  const [html, css] = await Promise.all([
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../style.css", import.meta.url), "utf8")
  ]);

  await access(new URL("../img/loreal-logo.png", import.meta.url));
  assert.match(html, /img\/loreal-logo\.png/);
  assert.match(html, /aria-live="polite"/);
  assert.match(css, /\.brand-logo\s*\{[^}]*filter:\s*brightness\(0\)\s*invert\(1\)/s);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("runtime config maps a Codespaces preview to its local Worker port", async () => {
  const source = await readFile(new URL("../runtime-config.js", import.meta.url), "utf8");
  const browserWindow = { location: { hostname: "beauty-demo-8000.app.github.dev" } };
  vm.runInNewContext(source, { window: browserWindow });

  assert.equal(
    browserWindow.BEAUTY_ADVISOR_WORKER_URL,
    "https://beauty-demo-8787.app.github.dev/api/chat"
  );
});
