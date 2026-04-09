
class LocalUtils {
	static setFormValue(jsn, form) {
		if (!jsn) {
			return;
		}

		if (typeof form === 'string') {
			form = document.querySelector(form);
		}

		const elements = form?.elements;

		if (!elements) {
			console.error('Could not find form!');
		}

		Array.from(elements)
			.filter((element) => element?.name)
			.forEach((element) => {
				const { name, type } = element;
				const value = name in jsn ? jsn[name] : null;
				const isCheckOrRadio = type === 'checkbox' || type === 'radio';

				if (value === null) return;

                if (isCheckOrRadio) {
                    // Improved: support for boolean and number type values
					const isSingle = typeof value === 'boolean' && value || value == element.value;
					if (isSingle || (Array.isArray(value) && value.includes(element.value))) {
						element.checked = true;
					}
				} else {
					element.value = value ?? '';
				}
			});
	}

    // From Volume Controller plugin
    static setToolTipListeners(control) {
        const tooltip = document.createElement("div");
        tooltip.classList.add("sdpi-info-label", "hidden");
        document.body.appendChild(tooltip);

        const suffix = control.attributes["data-suffix"].value;

        const fn = () => {
            const tw = tooltip.getBoundingClientRect().width;
            const rangeRect = control.getBoundingClientRect();
            const w = rangeRect.width - tw / 2;
            const percnt = (control.value - control.min) / (control.max - control.min);
            tooltip.style.left = `${rangeRect.left + Math.round(w * percnt) - tw / 4}px`;
            const val = Math.round(control.value);
            tooltip.textContent = `${val}${suffix}`;
            tooltip.style.top = `${rangeRect.top - 30}px`;
        };

        control.addEventListener(
            'mouseenter',
            function () {
                tooltip.classList.remove('hidden');
                tooltip.classList.add('shown');
                fn();
            },
            false
        );

        control.addEventListener(
            'mouseout',
            function () {
                tooltip.classList.remove('shown');
                tooltip.classList.add('hidden');
                fn();
            },
            false
        );
        control.addEventListener('input', fn, false);
    }

    static async applyLocalization() {
        await $PI.loadLocalization('../');

        document.querySelectorAll('[data-localize]').forEach((element) => {
            if (element.tagName == 'OPTGROUP') {
                element.label = element.label.trim().lox();
            } else {
                element.innerHTML = element.innerHTML.trim().lox();
            }
        });
    }
}