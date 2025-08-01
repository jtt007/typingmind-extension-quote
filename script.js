(() => {
  // Create initial small button popover
  const quoteButton = document.createElement("div");
  quoteButton.className =
    "fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 cursor-pointer transform z-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all";
  quoteButton.innerHTML = "💬";
  quoteButton.style.display = "none";
  document.body.appendChild(quoteButton);

  // Create comment interface popover
  const commentPopover = document.createElement("div");
  commentPopover.className =
    "fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-50 border border-gray-200 dark:border-gray-600 min-w-80";
  commentPopover.style.display = "none";

  // Create textarea for comment input
  const commentTextarea = document.createElement("textarea");
  commentTextarea.className =
    "relative font-normal block w-full rounded-md border-0 text-gray-900 placeholder:text-slate-600 dark:placeholder:text-slate-400 min-h-[36px] resize-none bg-transparent dark:text-white main-chat-input focus:ring-0 max-h-[500px] text-xs overflow-y-auto";
  commentTextarea.placeholder = "Add your comment...";
  commentTextarea.rows = 2;
  commentTextarea.style.padding = "1px";
  commentTextarea.style.maxHeight = "60px"; // Prevent textarea from growing beyond 2 rows
  commentTextarea.style.minHeight = "40px"; // Maintain minimum height

  // Create help text
  const helpText = document.createElement("div");
  helpText.className =
    "text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight";
  helpText.innerHTML =
    '<span style="font-weight: 600;">Esc</span> to close<br/><span style="font-weight: 600;">Enter</span> to send';

  // Create button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "flex justify-between items-end mt-2";

  // Create send button
  const commentSendButton = document.createElement("button");
  commentSendButton.className =
    "w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors flex items-center justify-center";
  commentSendButton.title = "Prepend to next message";
  commentSendButton.innerHTML = `
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
    </svg>
  `;

  // Assemble button container
  buttonContainer.appendChild(helpText);
  buttonContainer.appendChild(commentSendButton);

  // Assemble comment popover
  commentPopover.appendChild(commentTextarea);
  commentPopover.appendChild(buttonContainer);
  document.body.appendChild(commentPopover);

  let selectedText = "";
  let selectedRange = null;
  let highlightedElement = null;
  let isProcessingQuotes = false;

  // Function to highlight selected text using overlay
  function highlightSelection(range) {
    try {
      // Remove any existing highlight
      removeHighlight();

      // Get the bounding rectangle of the selection
      const rect = range.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      // Create highlight overlay
      const highlightOverlay = document.createElement("div");
      highlightOverlay.style.position = "absolute";
      highlightOverlay.style.left = `${rect.left + scrollLeft}px`;
      highlightOverlay.style.top = `${rect.top + scrollTop}px`;
      highlightOverlay.style.width = `${rect.width}px`;
      highlightOverlay.style.height = `${rect.height}px`;
      highlightOverlay.style.backgroundColor = "rgba(59, 130, 246, 0.3)";
      highlightOverlay.style.borderRadius = "2px";
      highlightOverlay.style.pointerEvents = "none";
      highlightOverlay.style.zIndex = "10";
      highlightOverlay.style.transition = "opacity 0.2s ease";
      highlightOverlay.setAttribute("data-quote-highlight", "true");

      // Add to body
      document.body.appendChild(highlightOverlay);
      highlightedElement = highlightOverlay;

      return true;
    } catch (error) {
      console.warn("Could not highlight selection:", error);
      return false;
    }
  }

  // Function to remove highlight
  function removeHighlight() {
    if (highlightedElement && highlightedElement.parentNode) {
      highlightedElement.parentNode.removeChild(highlightedElement);
      highlightedElement = null;
    }
  }

  // Enhanced quote processing and sending function
  async function processQuotesAndSend(textArea, quoteLabels) {
    try {
      // Get quotes with comments
      const quotes = Array.from(quoteLabels).map((label) => {
        const spanElement = label.querySelector("span[data-full-quote]");
        const fullQuote = spanElement?.getAttribute("data-full-quote") || "";
        const fullComment = spanElement?.getAttribute("data-full-comment") || "";

        if (fullComment) {
          return `> ${fullQuote}\n${fullComment}`;
        } else {
          return `> ${fullQuote}`;
        }
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

  // Show quote button on text selection
  function showQuoteButton(e) {
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
          // Store the selection range
          selectedRange = range.cloneRange();

          const rect = range.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          quoteButton.style.left = `${rect.left}px`;
          quoteButton.style.top = `${scrollTop + rect.bottom + 10}px`;
          quoteButton.style.display = "block";
        } else {
          hideQuoteButton();
        }
      }
    }
  }

  // Show comment interface when button is clicked
  function showCommentInterface() {
    if (selectedText && selectedRange) {
      // Get button position before hiding it
      const rect = quoteButton.getBoundingClientRect();

      // Hide the button (but don't clear selectedText yet)
      quoteButton.style.display = "none";

      // Highlight the selected text
      highlightSelection(selectedRange);

      // Show comment interface aligned with button position
      commentPopover.style.left = `${rect.left}px`; // Align with button left edge
      commentPopover.style.top = `${rect.top}px`; // Same vertical position as button
      commentPopover.style.display = "block";

      // Clear previous comment and focus textarea
      commentTextarea.value = "";
      commentTextarea.focus();
    }
  }

  function hideQuoteButton() {
    quoteButton.style.display = "none";
    selectedText = "";
    selectedRange = null;
    removeHighlight();
  }

  function hideCommentPopover() {
    commentPopover.style.display = "none";
    removeHighlight();
  }

  function hideAll() {
    quoteButton.style.display = "none";
    hideCommentPopover();
    selectedText = "";
    selectedRange = null;
    removeHighlight();
  }

  // Handle comment submission
  function submitComment() {
    const comment = commentTextarea.value.trim();
    addQuoteLabel(selectedText, comment);
    hideAll();
  }

  function addQuoteLabel(quote, comment) {
    if (!quote) quote = "text";
    if (!comment) comment = "";

    const originalQuote = quote;
    const originalComment = comment;

    // Truncate quote for display
    let displayQuote = quote;
    if (quote.length > 100) {
      displayQuote = quote.substring(0, 97) + "...";
    }

    // Truncate comment for display
    let displayComment = comment;
    if (comment.length > 150) {
      displayComment = comment.substring(0, 147) + "...";
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
    span.setAttribute("data-full-quote", originalQuote);
    span.setAttribute("data-full-comment", originalComment);

    const quoteWithGuillemets = `«${displayQuote}»`;
    const commentPart = displayComment ? `<br/>⤷ ${displayComment}` : "";
    span.innerHTML = `<i>${quoteWithGuillemets}</i>${commentPart}`;
    span.className = "pr-8 text-xs leading-tight";

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

  // Event Listeners for quote button
  quoteButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showCommentInterface();
  });

  // Event Listeners for comment interface
  commentSendButton.addEventListener("click", submitComment);

  // Handle Enter and Esc keys in comment textarea
  commentTextarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitComment();
    } else if (e.key === "Escape") {
      e.preventDefault();
      hideAll();
    }
  });

  // Main event listeners
  document.addEventListener("mouseup", showQuoteButton);
  document.addEventListener("mousedown", (e) => {
    if (!quoteButton.contains(e.target) && !commentPopover.contains(e.target)) {
      hideAll();
    }
  });

  // Enhanced scroll handling
  window.addEventListener(
    "scroll",
    (e) => {
      // Don't hide on textarea scroll
      if (e.target === commentTextarea) {
        return;
      }
      hideAll();
    },
    true,
  );
  document.addEventListener(
    "scroll",
    (e) => {
      // Don't hide on textarea scroll
      if (e.target === commentTextarea) {
        return;
      }
      if (
        quoteButton.style.display !== "none" ||
        commentPopover.style.display !== "none"
      ) {
        hideAll();
      }
    },
    true,
  );

  const scrollableContainers = document.querySelectorAll(
    ".overflow-auto, .overflow-y-auto, .overflow-scroll",
  );
  scrollableContainers.forEach((container) => {
    container.addEventListener(
      "scroll",
      (e) => {
        // Don't hide on textarea scroll
        if (e.target === commentTextarea) {
          return;
        }
        hideAll();
      },
      true,
    );
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
