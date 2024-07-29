import * as StackedSlider from "stacked-slider";
import * as MostVisible from "most-visible";

const gestureEvents = "swipeleft swiperight panstart pan panend tap";

let hammer;

// Lists
let panelElList,
    panelElArr;

// HTML element object
let panelContainerEl,
    targetPanelEl,
    prevPanelEl,
    nextPanelEl;

// Integer
let targetIndex,
    moveToIndex;

let targetStartX,
    prevStartX,
    nextStartX;

let numOfPanels;

let panListenerIndex;

// Boolean
let panning,
    swipeGestureExecuted;

// The plugin 'Hammer.js' (hammerjs.github.io) captures
// the events of a web app's pointer (touch/mouse/pen).

function on(container) {
    if (!container) { return; }

    // If the 'hammer.min.js' plugin is not loaded, then exit
    if (typeof Hammer === "undefined") { return; }

    panelContainerEl = container;

    panelElList = panelContainerEl.querySelectorAll(".panel");

    panelElArr = Array.from(panelElList);

    numOfPanels = panelElList.length;

    // Create a 'Hammer' instance.
    // By default the 'Hammerjs' library adds horizontal recognizers only.
    // Event delegation and DOM events. "Hammer is able to trigger
    // DOM events with the option'domEvents: true'. This will give
    // you methods like 'stopPropagation()', so you can use event
    // delegation. Hammer will not unbind the bound events."
    // hammerjs.github.io/tips
    hammer = new Hammer(container, { domEvents: false });

    hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });

    hammer.on(gestureEvents, hammerListener);
}

function off() {
    hammer.off(gestureEvents, hammerListener);
}

function hammerListener(e) {
    //console.log(e.type);

    // If the gesture event is not a tap, and the size of the
    // vertical pan delta is greater than the size of the
    // horizontal pan delta, then the gesture is a vertical
    // scroll. Therefore, exit this event listener.
    // https://stackoverflow.com/questions/26677463/hammer-js-breaks-vertical-scroll-when-horizontal-pan/54587885#54587885
    // https://stackoverflow.com/questions/53801499/hammer-js-how-to-block-horizontal-panning-during-page-scroll/53812660#53812660
    if (e.type !== "tap" && Math.abs(e.deltaY) > Math.abs(e.deltaX)) { return; }

    switch (e.type) {
        case "tap":
            targetPanelEl = e.target.closest(".panel");
            if (!targetPanelEl) { return; }
            if (targetPanelEl.classList.contains("panel-in-view")) { return; }

            moveToIndex = panelElArr.indexOf(targetPanelEl);

            StackedSlider.moveTo(moveToIndex);
            reset();
            break;
        case "swipeleft":
        case "swiperight":
            targetPanelEl = e.target.closest(".panel");
            if (!targetPanelEl) { return; }
            if (!targetPanelEl.classList.contains("panel-in-view")) { return; }

            setMoveToIndexFromSwipe(targetPanelEl, e.type);
            if (moveToIndex === undefined) { return; }

            StackedSlider.moveTo(moveToIndex);

            swipeGestureExecuted = true;
            reset();
            break;
        case "panstart":
            targetPanelEl = e.target.closest(".panel");
            if (!targetPanelEl) { return; }

            targetIndex = panelElArr.indexOf(targetPanelEl);

            const panelInViewEl = panelContainerEl.querySelector(".panel-in-view");
            const panelInViewIndex = panelElArr.indexOf(panelInViewEl);

            // The most common case is the pan gesture starts on
            // the panel in view. That is, the target panel of the
            // pan start gesture is the same as the panel containing
            // the class name 'panel-in-view'.
            if (targetIndex === panelInViewIndex) {
                // If the target panel is greater than the first panel,
                // then assign the previous panel element.
                if (targetIndex > 0) {
                    prevPanelEl = panelElList[targetIndex - 1];
                }
                // If the target panel is less than the last panel,
                // then assign the next panel element.
                if (targetIndex < numOfPanels - 1) {
                    nextPanelEl = panelElList[targetIndex + 1];
                }
            }
            else if (targetIndex === panelInViewIndex + 1) {
                prevPanelEl = panelElList[targetIndex - 1];
            }
            else if (targetIndex === panelInViewIndex - 1) {
                nextPanelEl = panelElList[targetIndex + 1];
            }

            panListenerIndex = 0;

            panning = true;

            targetStartX = parseInt(targetPanelEl.style.left);

            if (prevPanelEl) {
                prevStartX = parseInt(prevPanelEl.style.left);
            }

            if (nextPanelEl) {
                nextStartX = parseInt(nextPanelEl.style.left);
            }

            break;
        case "pan":
            // The 'panListenerIndex' variable is used to skip
            // the first 'pan' type event gestures. This handles the
            // case where the user is starts a vertical scroll
            // (i.e. a pan in the vertical direction), but the 'hammer.js'
            // plugin first reports the gesture as a horizontal pan
            // right after the 'panstart' event gesture type is dispatched.
            if (!panListenerIndex || panListenerIndex < 3) {
                panListenerIndex++;
                return;
            }

            if (!targetPanelEl) { return; }
            if (swipeGestureExecuted) { return; };
            if (panning === false) { return; }

            if (e.direction === 1) { return; } // DIRECTION_NONE === 1
            // https://hammerjs.github.io/api/#event-object
            // Alternatively, check the direction value is one of the
            // following valid directions: left, right, or horizontal.
            // DIRECTION_LEFT === 2, DIRECTION_RIGHT === 4, DIRECTION_HORIZONTAL === 6
            // const dirSet = new Set([2, 4, 6]);
            // if (!dirSet.has(e.direction)) { return; }

            const deltaX = e.deltaX;

            targetPanelEl.style.left = `${(targetStartX + deltaX)}px`;

            if (prevPanelEl) {
                prevPanelEl.style.left = `${(prevStartX + deltaX)}px`;
            }

            if (nextPanelEl) {
                nextPanelEl.style.left = `${(nextStartX + deltaX)}px`;
            }

            break;
        case "panend":
            // A swipe gesture event type is triggered between a pan
            // start and pan end event. Hammer.js dispatches the following:
            // 'panstart', 'swipe[left,right]', 'pan', and finally, 'panend'.
            // If the swipe gesture event listener processed the
            // gesture event already, then there's no need to process
            // the 'pan' and 'panend' events.
            if (swipeGestureExecuted) {
                swipeGestureExecuted = false;
                return;
            };

            if (!targetPanelEl) {
                reset();
                return;
            }

            if (prevPanelEl || nextPanelEl) {
                const elemArr = [targetPanelEl];
                if (prevPanelEl) { elemArr.push(prevPanelEl); }
                if (nextPanelEl) { elemArr.push(nextPanelEl); }
                if (elemArr.length > 1 &&
                    !targetPanelEl.classList.contains("panel-in-view")) {
                    targetPanelEl.style.zIndex = numOfPanels * 3;
                }
                // https://stackoverflow.com/questions/38360676/get-the-element-which-is-the-most-visible-on-the-screen/39576399#39576399
                // https://github.com/andyexeter/most-visible
                const mostVisibleEl = MostVisible.mostVisible(elemArr);
                moveToIndex = panelElArr.indexOf(mostVisibleEl);
                StackedSlider.moveTo(moveToIndex);
            }
            else {
                // This condition is executed (i.e. no value is assigned
                // to the 'prevPanelEl' and 'nextPanelEl' variables)
                // when the pan gesture targets a stacked panel that is
                // not the panel in view or the direct neighbors
                // (i.e. the panel to the immediate left or immediate right)
                // of the panel in view. For example, if the panel in view is
                // the first panel in the panel element array, and the
                // pan gesture starts on the last panel in the slider
                // stack, then only the 'targetPanelEl' variable is
                // assigned.
                if (!targetPanelEl.classList.contains("panel-in-view")) {
                    targetPanelEl.style.zIndex = numOfPanels * 3;
                }
                StackedSlider.moveTo(targetIndex);
            }

            reset();
            break;
    }
}

function setMoveToIndexFromSwipe(targetPanelEl, gestureType) {
    targetIndex = panelElArr.indexOf(targetPanelEl);

    if (gestureType === "swiperight" && targetIndex === 0) { return; }
    if (gestureType === "swipeleft" && targetIndex === numOfPanels - 1) { return; }

    if (targetIndex === 0) {
        moveToIndex = 1;
    }
    else if (targetIndex === numOfPanels - 1) {
        moveToIndex = numOfPanels - 2;
    }
    else {
        moveToIndex = targetIndex + (gestureType === "swipeleft" ? 1 : -1);
    }
}

function reset() {
    panning = false;
    panListenerIndex = undefined;
    prevPanelEl = undefined;
    nextPanelEl = undefined;
    targetPanelEl = undefined;
    targetIndex = undefined;
    moveToIndex = undefined;
}

export { on, off }