import { writable } from "svelte/store";

type Toast = {
  id: string;
  message: string;
};

export const toasts = writable<Toast[]>([]);

export function showToast(message: string, duration = 2000) {
  const id = crypto.randomUUID();
  toasts.update((list) => [...list, { id, message }]);

  setTimeout(() => {
    toasts.update((list) => list.filter((t) => t.id !== id));
  }, duration);
}
