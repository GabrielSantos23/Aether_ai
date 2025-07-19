"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export function useScrollToBottom(
  activeMessages: any[],
  isStreaming?: boolean
) {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const hasInitialScrolled = useRef(false);
  const userScrolledUpDuringStreamingRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const isStreamingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    isStreamingRef.current = !!isStreaming;
  }, [isStreaming]);

  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    programmaticScrollRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior });
    userScrolledUpDuringStreamingRef.current = false;
    setTimeout(() => {
      programmaticScrollRef.current = false;
    }, 100);
  };

  const handleScroll = useCallback(() => {
    let viewport = scrollAreaRef.current?.querySelector(
      "div[data-radix-scroll-area-viewport]"
    );

    if (!viewport) {
      viewport = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
    }

    if (!viewport) {
      viewport = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-root]"
      );
    }

    if (!viewport && scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      if (scrollArea.scrollHeight > scrollArea.clientHeight) {
        viewport = scrollArea;
      }
    }

    if (viewport) {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;
      const wasAtBottom = isAtBottomRef.current;
      const lastScrollTop = lastScrollTopRef.current;

      isAtBottomRef.current = isAtBottom;
      setShowScrollToBottom(!isAtBottom);

      if (isStreamingRef.current && !programmaticScrollRef.current) {
        if (scrollTop < lastScrollTop) {
          userScrolledUpDuringStreamingRef.current = true;
        } else if (wasAtBottom && !isAtBottom) {
          userScrolledUpDuringStreamingRef.current = true;
        }
      }

      if (isAtBottom) {
        userScrolledUpDuringStreamingRef.current = false;
      }

      lastScrollTopRef.current = scrollTop;
    }
  }, []);

  useEffect(() => {
    if (!isStreaming) {
      userScrolledUpDuringStreamingRef.current = false;
    }
  }, [isStreaming]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let viewport = scrollAreaRef.current?.querySelector(
        "div[data-radix-scroll-area-viewport]"
      );

      if (!viewport) {
        viewport = scrollAreaRef.current?.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
      }
      if (!viewport) {
        viewport = scrollAreaRef.current?.querySelector(
          "[data-radix-scroll-area-root]"
        );
      }
      if (!viewport && scrollAreaRef.current) {
        const scrollArea = scrollAreaRef.current;
        if (scrollArea.scrollHeight > scrollArea.clientHeight) {
          viewport = scrollArea;
        }
      }

      if (viewport) {
        viewport.addEventListener("scroll", handleScroll);
        handleScroll();
        return () => viewport.removeEventListener("scroll", handleScroll);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [handleScroll]);

  useEffect(() => {
    const messageCount = activeMessages.length;
    const messageCountChanged = messageCount !== lastMessageCountRef.current;
    lastMessageCountRef.current = messageCount;

    if (messageCount > 0 && !hasInitialScrolled.current) {
      setTimeout(() => {
        scrollToBottom("auto");
        hasInitialScrolled.current = true;
      }, 50);
      return;
    }

    if (messageCountChanged && isAtBottomRef.current) {
      if (isStreaming && userScrolledUpDuringStreamingRef.current) {
        return;
      }
      scrollToBottom("auto");
    }
  }, [activeMessages.length, isStreaming]);

  useEffect(() => {
    if (isStreaming && userScrolledUpDuringStreamingRef.current) {
      return;
    }

    if (isStreaming && isAtBottomRef.current && activeMessages.length > 0) {
      const timeoutId = setTimeout(() => {
        if (
          isAtBottomRef.current &&
          !userScrolledUpDuringStreamingRef.current
        ) {
          scrollToBottom("auto");
        }
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [activeMessages, isStreaming]);

  return {
    showScrollToBottom,
    messagesEndRef,
    scrollAreaRef,
    scrollToBottom,
  };
}
