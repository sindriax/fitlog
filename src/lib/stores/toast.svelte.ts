type ToastType = 'success' | 'error' | 'info';

interface Toast {
	id: string;
	message: string;
	type: ToastType;
}

function createToastStore() {
	let toasts = $state<Toast[]>([]);

	return {
		get all() {
			return toasts;
		},
		show(message: string, type: ToastType = 'success', duration = 2500) {
			const id = crypto.randomUUID();
			toasts = [...toasts, { id, message, type }];

			setTimeout(() => {
				toasts = toasts.filter((t) => t.id !== id);
			}, duration);
		},
		dismiss(id: string) {
			toasts = toasts.filter((t) => t.id !== id);
		}
	};
}

export const toastStore = createToastStore();
