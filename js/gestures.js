import * as StackedSlider from "stacked-slider";
import * as MostVisible from "most-visible";

const gestureEvents = "swipeleft swiperight panstart pan panend tap";

// https://stackoverflow.com/questions/42267189/how-to-get-value-translatex-by-javascript
// https://stackoverflow.com/questions/1183903/regex-using-javascript-to-return-just-numbers/42264780#42264780
const NUMERIC_REGEXP = /[-]{0,1}[\d]*[,]?[\d]*[.]{0,1}[\d]+/g;

let hammer;

// Lists
let panelElList,
    panelElArr;

// HTML element object
let panelContainerEl,
    panelInViewEl,
    targetPanelEl,
    prevPanelEl,
    nextPanelEl;

// Integer
let targetIndex,
    moveToIndex;

let targetTranslateX,
    prevTranslateX,
    nextTranslateX;

let numOfPanels;

let panListenerIndex;

// Boolean
let panning,
    swipeGestureExecuted;

/* ------------------------------------------------------------
    Gesture event listeners
 */

// The plugin 'Hammer.js' (hammerjs.github.io) captures
// the events of a web app's pointer (touch/mouse/pen).

function on(container) {
    if (!container) { return; }

    panelContainerEl = container;

    panelElList = panelContainerEl.querySelectorAll(".panel");
    panelElArr = Array.from(panelElList);

    numOfPanels = panelElList.length;

    // If the 'hammer.min.js' plugin is not loaded, then exit
    if (typeof Hammer === "undefined") { return; }

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

function hammerListener(e) {
    //console.log(e.type);
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.type !== "tap") { return; }

    /*
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        if (targetPanelEl) {
            targetPanelEl.style.zIndex = 100;
            StackedSlider.moveTo(targetIndex);
            reset();
        }
        return;
    }
    */

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
            panelInViewEl = panelContainerEl.querySelector(".panel-in-view");

            const panelInViewIndex = panelElArr.indexOf(panelInViewEl);

            targetPanelEl = e.target.closest(".panel");
            if (!targetPanelEl) { return; }

            targetIndex = panelElArr.indexOf(targetPanelEl);

            if (panelInViewIndex === targetIndex) {
                if (targetIndex > 0) {
                    prevPanelEl = panelElList[targetIndex - 1];
                }

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

            let numbers;

            numbers = targetPanelEl.style.transform.match(NUMERIC_REGEXP);
            targetTranslateX = !numbers ? 0 : parseFloat(numbers[0]);

            if (prevPanelEl) {
                numbers = prevPanelEl.style.transform.match(NUMERIC_REGEXP);
                prevTranslateX = !numbers ? 0 : parseFloat(numbers[0]);
            }

            if (nextPanelEl) {
                numbers = nextPanelEl.style.transform.match(NUMERIC_REGEXP);
                nextTranslateX = !numbers ? 0 : parseFloat(numbers[0]);
            }

            break;

        case "pan":
            if (!panListenerIndex || panListenerIndex < 3) {
                panListenerIndex++;
                return;
            }
            if (!targetPanelEl) { return; }
            if (swipeGestureExecuted) { return; };
            if (panning === false) { return; }
            // hammerjs.github.io/api/#event-object
            if (e.direction === 1) { return; } // DIRECTION_NONE === 1

            let posn;

            posn = targetTranslateX + e.deltaX;
            targetPanelEl.style.transform = `translateX(${posn}px)`;

            if (prevPanelEl) {
                posn = prevTranslateX + e.deltaX;
                prevPanelEl.style.transform = `translateX(${posn}px)`;
            }

            if (nextPanelEl) {
                posn = nextTranslateX + e.deltaX;
                nextPanelEl.style.transform = `translateX(${posn}px)`;
            }

            break;

        case "panend":
            if (swipeGestureExecuted) {
                swipeGestureExecuted = false;
                return;
            };

            if (!targetPanelEl) {
                reset();
                return;
            }

            if (prevPanelEl || nextPanelEl) {
                // https://stackoverflow.com/questions/38360676/get-the-element-which-is-the-most-visible-on-the-screen/39576399#39576399
                // https://github.com/andyexeter/most-visible
                const elemArr = [targetPanelEl];
                if (prevPanelEl) { elemArr.push(prevPanelEl); }
                if (nextPanelEl) { elemArr.push(nextPanelEl); }
                if (elemArr.length > 1) {
                    targetPanelEl.style.zIndex = numOfPanels;
                }
                const mostVisibleEl = MostVisible.mostVisible(elemArr);
                moveToIndex = panelElArr.indexOf(mostVisibleEl);
                StackedSlider.moveTo(moveToIndex);
            }
            else {
                targetPanelEl.style.zIndex = numOfPanels;
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

function off() {
    hammer.off(gestureEvents, hammerListener);
}

export { on, off }


// https://hammerjs.github.io/api/#event-object
// DIRECTION_LEFT === 2, DIRECTION_RIGHT === 4, DIRECTION_HORIZONTAL === 6

//const dirSet = new Set([2, 4, 6]);

//if (!dirSet.has(e.direction)) { return; }

// https://stackoverflow.com/questions/53801499/hammer-js-how-to-block-horizontal-panning-during-page-scroll/53812660#53812660
//if (e.pointerType === 'touch' && (Math.abs(e.deltaY) > Math.abs(e.deltaX))) { return false; }

// https://stackoverflow.com/questions/26677463/hammer-js-breaks-vertical-scroll-when-horizontal-pan/54587885#54587885
//if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
//    return;
//}
