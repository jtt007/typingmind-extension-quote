(() => {
  // === Create Quote Button ===
  const quoteButton = document.createElement("div");
  Object.assign(quoteButton.style, {
    position: "absolute",
    background: "white",
    borderRadius: "8px",
    padding: "4px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    cursor: "pointer",
    zIndex: 9999,
    display: "none",
    userSelect: "none",
  });
  quoteButton.textContent = "💬";
  document.body.appendChild(quoteButton);

  // === Comment Popover ===
  const commentPopover = document.createElement("div");
  Object.assign(commentPopover.style, {
    position: "absolute",
    background: "white",
    borderRadius: "8px",
    padding: "6px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
    zIndex: 9999,
    display: "none",
    width: "200px",
  });
  const commentTextarea = document.createElement("textarea");
  commentTextarea.placeholder = "Comment or leave blank";
  commentTextarea.rows = 2;
  commentTextarea.style.width = "100%";
  commentTextarea.style.fontSize = "12px";
  commentTextarea.style.resize = "none";
  const sendBtn = document.createElement("button");
  sendBtn.textContent = "Send";
  sendBtn.style.marginTop = "4px";
  sendBtn.style.width = "100%";
  commentPopover.appendChild(commentTextarea);
  commentPopover.appendChild(sendBtn);
  document.body.appendChild(commentPopover);

  // === Variables ===
  let selectedText = "";
  let selectedRange = null;
  let isPopoverOpen = false;

  // === Helpers ===
  const hideAll = () => {
    if (isPopoverOpen) return; // don't hide if editing
    quoteButton.style.display = "none";
    commentPopover.style.display = "none";
  };

  const closePopover = () => {
    commentPopover.style.display = "none";
    isPopoverOpen = false;
    selectedText = "";
    selectedRange = null;
  };

  const getSelectionRect = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect?.();
    if (!rect || !rect.width) return null;
    return rect;
  };

  // === Show Button when Text Selected ===
  const showQuoteButton = () => {
    const rect = getSelectionRect();
    const sel = window.getSelection();
    if (!rect || !sel || sel.isCollapsed) {
      return;
    }
    selectedText = sel.toString().trim();
    selectedRange = sel.getRangeAt(0).cloneRange();

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    quoteButton.style.left = `${rect.left + rect.width / 2 - 15}px`;
    quoteButton.style.top = `${rect.top + scrollY - 30}px`;
    quoteButton.style.display = "block";
  };

  // Desktop mouse and mobile touch triggers
  document.addEventListener("mouseup", showQuoteButton);
  document.addEventListener("touchend", () => setTimeout(showQuoteButton, 50));

  document.addEventListener("selectionchange", () => {
    if (isPopoverOpen) return; // don't auto-hide while editing
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0) {
      showQuoteButton();
    }
  });

  // === Comment Popover ===
  quoteButton.addEventListener("click", () => {
    if (!selectedText) return;
    const rect = quoteButton.getBoundingClientRect();
    commentPopover.style.left = `${rect.left}px`;
    commentPopover.style.top = `${rect.bottom + window.scrollY + 5}px`;
    commentPopover.style.display = "block";
    isPopoverOpen = true;
    commentTextarea.value = "";
    setTimeout(() => commentTextarea.focus(), 100);
  });

  // === Submit Comment ===
  const addQuoteLabel = (quote, comment) => {
    const messageInput = document.querySelector(
      '[data-element-id="message-input"] textarea, textarea[data-element-id="chat-input-textbox"]'
    );
    if (!messageInput) return;

    const combined = `> ${quote}\n\n${comment ? "Comment: " + comment + "\n\n---" : "---"}\n\n`;
    messageInput.value = combined + messageInput.value;
    messageInput.dispatchEvent(new Event("input", { bubbles: true }));
    messageInput.dispatchEvent(new Event("change", { bubbles: true }));
  };

  sendBtn.addEventListener("click", () => {
    addQuoteLabel(selectedText, commentTextarea.value.trim());
    closePopover();
    quoteButton.style.display = "none";
  });

  commentTextarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    } else if (e.key === "Escape") {
      closePopover();
    }
  });

  // Prevent closing when clicking inside popover or quote button
  document.addEventListener("mousedown", (e) => {
    if (commentPopover.contains(e.target) || quoteButton.contains(e.target)) return;
    if (isPopoverOpen) {
      closePopover();
    } else {
      hideAll();
    }
  });

  document.addEventListener("touchstart", (e) => {
    if (commentPopover.contains(e.target) || quoteButton.contains(e.target)) return;
    if (isPopoverOpen) {
      closePopover();
    } else {
      hideAll();
    }
  });

  document.addEventListener("scroll", () => {
    if (!isPopoverOpen) hideAll();
  }, true);
})();