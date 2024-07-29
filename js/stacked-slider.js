let stackWidth,
    panelContainerEl;

let panelWidth; // Pixel unit but 'px' not included in variable value

let panelElList,
    panelElArr;

let numOfPanels;

let isInitializing;

// https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API
const resizeObserver = new ResizeObserver(entries => {

    // 'entry' variable represents a 'ResizeObserverEntry' object.
    // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry
    for (const entry of entries) {
        if (!entry.target.classList.contains("panel-container")) { continue; }

        // The 'resizeObserver' object is executed after the line
        // 'resizeObserver.observe(panelContainerEl);' is processed
        // in the 'on()' function. During this execution, the
        // 'setPanelWidth()' function triggers another 'resizeObserver'
        // object. To avoid duplication execution of the code
        // within the callback function of the resizer observer constructor,
        // use the 'isInitializing' boolean flag to exit the second/duplicate
        // execution.
        if (isInitializing === undefined) { isInitializing = true; }
        else if (isInitializing) { isInitializing = false; return; }

        // Update width of each '.panel' element in 'panelElList'
        setPanelWidth(entry.target);

        // Update '.panel' spacing and position
        const panelInViewEl = panelContainerEl.querySelector(".panel-in-view");
        const moveToIndex = panelElArr.indexOf(panelInViewEl);
        setPanelPosn(moveToIndex, false);
    }
});

// Width unit: 'px'
const setPanelWidth = (panelContainerEl) => {
    panelWidth = panelContainerEl.getBoundingClientRect().width - ((numOfPanels - 1) * stackWidth);
    panelElList.forEach(panelEl => panelEl.style.width = `${panelWidth}px`);
};

const transitionendHandler = (e) => {
    e.target.classList.remove('is-moving');
};

function on(container, config) {
    if (!container) { return; }

    panelContainerEl = container;

    stackWidth = isNaN(config.stackWidth) ? 0 : config.stackWidth;

    // 'querySelectorAll()' returns a 'NodeList' object.
    // NodeList objects are the collection of nodes.
    panelElList = panelContainerEl.querySelectorAll(".panel");

    // NodeList is not a JavaScript 'Array' although it's possible
    // to iterate over a 'NodeList' using the 'forEach()' method.
    // NodeList can be converted into a JavaScript array using 'Array.from()'.
    panelElArr = Array.from(panelElList);

    numOfPanels = panelElList.length;

    panelElList.forEach(panelEl => panelEl.addEventListener("transitionend", transitionendHandler));

    // Set initial panel to display
    let moveToIndex = isNaN(config.moveToIndex) ? 0 : config.moveToIndex;
    if (moveToIndex < 0) { moveToIndex = 0; }
    if (moveToIndex > numOfPanels - 1) { moveToIndex = numOfPanels - 1; }

    const moveToPanelEl = panelElList[moveToIndex];
    if (moveToPanelEl) { moveToPanelEl.classList.add("panel-in-view"); }

    // The observer "callback is firing immediately once observe() is called."
    // See implementation notes within the resizer observer callback function
    // and the use of the 'isInitializing' flag to avoid duplicate execution
    // of the callback function on initialization.
    // https://stackoverflow.com/questions/60026223/does-resizeobserver-invoke-initially-on-page-load
    // https://stackoverflow.com/questions/67751039/javascript-resizeobserver-is-triggered-unexpected
    // https://github.com/WICG/resize-observer/issues/38#issuecomment-290537900
    resizeObserver.observe(panelContainerEl);
}

function off() {
    panelElList.forEach(panelEl => {
        panelEl.style.removeProperty("width");
        panelEl.style.removeProperty("z-index");
        panelEl.style.removeProperty("left");
        panelEl.removeEventListener("transitionend", transitionendHandler);
    });
    resizeObserver.unobserve(panelContainerEl);
}

function moveTo(moveToIndex, animate) {
    const panelInViewEl = panelContainerEl.querySelector(".panel-in-view");

    if (panelInViewEl) {
        panelInViewEl.classList.remove('panel-in-view');
    }

    const moveToPanelEl = panelElList[moveToIndex];

    if (moveToPanelEl) {
        moveToPanelEl.classList.add('panel-in-view');
    }

    setPanelPosn(moveToIndex, animate);
}

// 'setPanelPosn()' sets the 'left' position of each '.panel'
// element within the panel container parent element. The function
// sets the 'z-index' position of each '.panel' element so that
// each sliver (i.e. the thin left or right width of each '.panel'
// element) overlaps the adjacent element.
// The panel at the target index is set to the lowest 'z-index' value.
// The panel sliver to the left should be higher than the
// sliver to the right until the target index is reached.
// The panel sliver higher than the target index should be lower
// than the sliver to its right.
function setPanelPosn(moveToIndex, animate) {
    animate = animate !== false ? true : false;

    panelElList.forEach((panelEl, index) => {
        let posn;

        if (index < moveToIndex) {
            posn = panelWidth * -1 + (stackWidth * (index + 1));
            panelEl.style.zIndex = numOfPanels + moveToIndex - index;
        }
        else if (index > moveToIndex) {
            posn = panelWidth + (stackWidth * (index - 1));
            panelEl.style.zIndex = numOfPanels + moveToIndex + index;
        }
        else if (index === moveToIndex) {
            posn = stackWidth * index;
            setTimeout(() => panelEl.style.zIndex = numOfPanels, 400);
        }

        posn = parseInt(posn, 10);

        // Convert string value of 'panelEl.style.left', which includes
        // its units (e.g. "1024px"), to an integer value using
        // 'parseInt()'. If the existing left position of the '.panel'
        // element is the same as the value of the 'posn' variable,
        // remove the 'is-moving' class in case this class name was
        // not removed by the 'transitionendHandler()' function.
        // The 'is-moving' class sets 'transition: left 0.4s;'.
        // If the user gesture is panning, then the immediate effect
        // of setting the 'left' value of a '.panel' element causes
        // a lag effect when the 'is-moving' class is listed in the
        // class name of a '.panel'.

        if (parseInt(panelEl.style.left, 10) === posn) {
            panelEl.classList.remove('is-moving');
        }
        else {
            panelEl.style.left = `${posn}px`;
            if (animate) { panelEl.classList.add('is-moving'); } // Trigger transition
        }
    });
}

export { on, off, moveTo };