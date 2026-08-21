import type { Action } from "svelte/action";

interface LongPressAttributes {
  onlongpress?: (e: CustomEvent<PointerEvent>) => void;
  onshortpress?: (e: CustomEvent<PointerEvent>) => void;
}

export const longpress: Action<
  HTMLElement,
  number | undefined,
  LongPressAttributes
> = (node, duration = 500) => {
  let timer: ReturnType<typeof setTimeout>;
  let fired = false;
  let moved = false;
  let startX = 0;
  let startY = 0;

  function start(event: PointerEvent) {
    if (event.button !== 0) return;
    fired = false;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    timer = setTimeout(() => {
      if (moved) return;
      fired = true;
      node.dispatchEvent(new CustomEvent("longpress", { detail: event }));
    }, duration);
  }

  function move(event: PointerEvent) {
    if (
      Math.abs(event.clientX - startX) > 10 ||
      Math.abs(event.clientY - startY) > 10
    ) {
      moved = true;
      clearTimeout(timer);
    }
  }

  function cancel(event: PointerEvent) {
    clearTimeout(timer);
    if (!fired && !moved && event.type === "pointerup") {
      node.dispatchEvent(new CustomEvent("shortpress", { detail: event }));
    }
  }

  node.addEventListener("pointerdown", start);
  node.addEventListener("pointermove", move);
  node.addEventListener("pointerup", cancel);
  node.addEventListener("pointerleave", cancel);
  node.addEventListener("pointercancel", cancel);

  return {
    update(newDuration) {
      duration = newDuration ?? 500;
    },
    destroy() {
      clearTimeout(timer);
      node.removeEventListener("pointerdown", start);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", cancel);
      node.removeEventListener("pointerleave", cancel);
      node.removeEventListener("pointercancel", cancel);
    },
  };
};
