import * as StackedSlider from "stacked-slider";
import * as StackedSliderGestures from "gestures";

document.addEventListener("DOMContentLoaded", initialize);

let panelContainerEl,
    stackConfig;

function initialize() {
    panelContainerEl = document.querySelector(".panel-container");

    // developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/getPropertyValue
    // 'getPropertyValue()' return value: "If not set, returns the empty string."

    let stackWidth = getComputedStyle(panelContainerEl).getPropertyValue('--stackWidth');
    stackWidth = stackWidth === '' || isNaN(stackWidth) ? 0 : parseInt(stackWidth, 10);
    if (isNaN(stackWidth) || stackWidth < 0) { stackWidth = 0; }

    let mediaQueryWidth = getComputedStyle(panelContainerEl).getPropertyValue('--mediaQueryWidth');
    mediaQueryWidth = mediaQueryWidth === '' ? undefined : mediaQueryWidth;

    stackConfig = {
        stackWidth: stackWidth,
        moveToIndex: 0
    };

    if (!mediaQueryWidth) {
        setStackedSlider("on");
        return;
    }

    // Create media condition that targets viewports at least 'mediaQueryWidth' wide
    const mediaQuery = window.matchMedia(`(min-width: ${mediaQueryWidth})`);

    // developer.mozilla.org/en-US/docs/Web/API/MediaQueryList/change_event
    mediaQuery.addEventListener("change", e => {
        if (e.matches) {
            // Viewport equals or is more than 'mediaQueryWidth' wide
            setStackedSlider("off");
        }
        else {
            // Viewport is less than 'mediaQueryWidth' wide
            setStackedSlider("on");
        }
    });

    if (!mediaQuery.matches) { setStackedSlider("on"); }
}

function setStackedSlider(state) {
    if (state === "off") {
        StackedSlider.off();
        StackedSliderGestures.off();
        return;
    }
    StackedSlider.on(panelContainerEl, stackConfig);
    StackedSliderGestures.on(panelContainerEl);
}
