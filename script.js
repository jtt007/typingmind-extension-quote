(() => {
  // Create and append popover element
  const quotePopover = document.createElement("div");
  quotePopover.className =
    "fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 cursor-pointer transform z-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all";
  quotePopover.innerHTML = "💬";
  quotePopover.style.display = "none";
  document.body.appendChild(quotePopover);

  let selectedText = "";
  let isProcessingQuotes = false;

  // Enhanced quote processing and sending function
  async function processQuotesAndSend(textArea, quoteLabels) {
    try {
      // Get quotes
      const quotes = Array.from(quoteLabels).map((label) => {
        const quoteElement = label.querySelector("i");
        const fullQuote =
          quoteElement?.getAttribute("data-full-quote") ||
          quoteElement?.textContent ||
          "";
        return `> ${fullQuote}`;
      });

      // Combine text
      const existingText = textArea.value;
      const newText =
        quotes.join("\n\n") + (existingText ? "\n\n" + existingText : "");

      // Update textarea
      await new Promise((resolve) => {
        const reactKey = Object.keys(textArea).find((k) =>
          k.startsWith("__reactProps$"),
        );
        if (textArea[reactKey]?.onChange) {
          textArea[reactKey].onChange({
            target: { value: newText },
            currentTarget: { value: newText },
            preventDefault: () => {},
            stopPropagation: () => {},
          });
        }

        textArea.value = newText;
        textArea.dispatchEvent(new Event("input", { bubbles: true }));
        textArea.dispatchEvent(new Event("change", { bubbles: true }));
        requestAnimationFrame(resolve);
      });

      // Remove quote labels
      quoteLabels.forEach((label) => label.remove());

      // Trigger send
      await new Promise((resolve) => setTimeout(resolve, 50));
      const sendButton = document.querySelector(
        '[data-element-id="send-button"]',
      );
      sendButton?.click();
    } catch (error) {
      console.error("Error in processQuotesAndSend:", error);
    }
  }

  // Show quote popover function
  function showQuotePopover(e) {
    const selection = window.getSelection();
    const responseBlock = e.target.closest(
      '[data-element-id="response-block"]',
    );

    if (selection && responseBlock && !selection.isCollapsed) {
      let range = selection.getRangeAt(0);
      let container = range.commonAncestorContainer;
      while (container && container !== responseBlock) {
        container = container.parentNode;
      }

      if (container === responseBlock) {
        selectedText = selection.toString().trim();
        if (selectedText) {
          const rect = range.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          quotePopover.style.left = `${rect.left + rect.width / 2 - 15}px`;
          quotePopover.style.top = `${scrollTop + rect.top - 50}px`;
          quotePopover.style.display = "block";

          quotePopover.onclick = () => {
            addQuoteLabel(selectedText);
            hideQuotePopover();
          };
        } else {
          hideQuotePopover();
        }
      }
    }
  }

  function hideQuotePopover() {
    quotePopover.style.display = "none";
    selectedText = "";
  }

  function addQuoteLabel(quote) {
    if (!quote) quote = "text";

    const originalQuote = quote;
    if (quote.length > 100) {
      quote = quote.substring(0, 97) + "...";
    }

    const newLabel = document.createElement("div");
    newLabel.setAttribute("data-element-id", "inline-character-label");
    newLabel.className =
      "text-sm text-slate-600 dark:text-slate-400 pb-0.5 rounded-t-xl w-full -mb-1 bg-slate-100 dark:bg-slate-950 relative";

    const contentWrapper = document.createElement("div");
    contentWrapper.className = "flex items-start justify-between w-full";

    const innerContainer = document.createElement("div");
    innerContainer.className =
      "flex items-center justify-start gap-2 p-2 flex-grow";

    const avatar = document.createElement("span");
    avatar.setAttribute("data-element-id", "current-character-avatar");
    avatar.textContent = "💬";
    avatar.className =
      "error-fallback-gray flex-shrink-0 w-5 h-5 flex items-center justify-center";

    const span = document.createElement("span");
    span.innerHTML = `<i data-full-quote="${originalQuote}">${quote}</i>`;
    span.className = "pr-8";

    const closeButton = document.createElement("button");
    closeButton.className =
      "p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white quote-close-button absolute top-0 right-0";
    closeButton.innerHTML = `
            <svg class="h-4 w-4" width="18px" height="18px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <g fill="currentColor">
                    <path d="M14 4L4 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
                    <path d="M4 4L14 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path>
                </g>
            </svg>
        `;

    innerContainer.appendChild(avatar);
    innerContainer.appendChild(span);
    contentWrapper.appendChild(innerContainer);
    contentWrapper.appendChild(closeButton);
    newLabel.appendChild(contentWrapper);

    closeButton.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      this.closest('[data-element-id="inline-character-label"]').remove();
    });

    const messageInput = document.querySelector(
      '[data-element-id="message-input"]',
    );
    if (messageInput) {
      const inputRow = messageInput.querySelector(
        '[data-element-id="input-row"]',
      );
      if (inputRow) {
        const wfullDiv = inputRow.querySelector(".w-full");
        if (wfullDiv) {
          const chatInputContainer = wfullDiv.querySelector(
            '[data-element-id="chat-input-textbox-container"]',
          )?.parentElement;
          if (chatInputContainer) {
            wfullDiv.insertBefore(newLabel, chatInputContainer);
          }
        }
      }
    }
  }

  // Event Listeners
  document.addEventListener("mouseup", showQuotePopover);
  document.addEventListener("mousedown", (e) => {
    if (!quotePopover.contains(e.target)) {
      hideQuotePopover();
    }
  });

  // Enhanced scroll handling
  window.addEventListener("scroll", hideQuotePopover, true);
  document.addEventListener(
    "scroll",
    (e) => {
      if (quotePopover.style.display !== "none") {
        hideQuotePopover();
      }
    },
    true,
  );

  const scrollableContainers = document.querySelectorAll(
    ".overflow-auto, .overflow-y-auto, .overflow-scroll",
  );
  scrollableContainers.forEach((container) => {
    container.addEventListener("scroll", hideQuotePopover, true);
  });

  // Enhanced keyboard event listener
  document.addEventListener(
    "keydown",
    function (e) {
      const textArea = document.querySelector(
        '[data-element-id="chat-input-textbox"]',
      );
      if (
        e.key === "Enter" &&
        !e.shiftKey &&
        document.activeElement === textArea
      ) {
        const quoteLabels = document.querySelectorAll(
          '[data-element-id="inline-character-label"]',
        );
        if (quoteLabels.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          processQuotesAndSend(textArea, quoteLabels);
        }
      }
    },
    true,
  );

  // MutationObserver for send button
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        const sendButton = document.querySelector(
          '[data-element-id="send-button"]',
        );
        if (sendButton && !sendButton.hasAttribute("data-quote-handler")) {
          sendButton.setAttribute("data-quote-handler", "true");

          const originalOnClick = sendButton.onclick;
          sendButton.onclick = (e) => {
            if (!isProcessingQuotes) {
              const quoteLabels = document.querySelectorAll(
                '[data-element-id="inline-character-label"]',
              );
              if (quoteLabels.length > 0) {
                e.preventDefault();
                const textArea = document.querySelector(
                  '[data-element-id="chat-input-textbox"]',
                );
                processQuotesAndSend(textArea, quoteLabels);
              } else if (originalOnClick) {
                originalOnClick.call(sendButton, e);
              }
            }
          };
        }
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
