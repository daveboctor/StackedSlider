let stackWidth,
    panelContainerEl;

let panelWidth; // Pixel unit but 'px' not included in variable value

let panelElList,
    panelElArr;

let numOfPanels;

// https://developer.mozilla.org/en-US/docs/Web/API/Resize_Observer_API
const resizeObserver = new ResizeObserver(entries => {
    // 'entry' variable represents a 'ResizeObserverEntry' object.
    // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry
    for (const entry of entries) {
        if (!entry.target.classList.contains("panel-container")) { continue; }

        // Update width of each '.panel' element in 'panelElList'
        setPanelWidth(entry.target);

        // Update '.panel' spacing and position
        const panelInViewEl = panelContainerEl.querySelector(".panel-in-view");
        const moveToIndex = panelElArr.indexOf(panelInViewEl);
        setPanelPosn(moveToIndex);
    }
});

// Width unit in 'px'
const setPanelWidth = (panelContainerEl) => {
    const panelContainerWidth =
        parseInt(panelContainerEl.getBoundingClientRect().width, 10);
    panelWidth = panelContainerWidth - ((numOfPanels - 1) * stackWidth);
    panelElList.forEach(panelEl => panelEl.style.width = `${panelWidth}px`);
};

const transitionendHandler = (e) => {
    e.target.removeEventListener('transitionend', transitionendHandler);
    e.target.classList.remove('is-moving');
};

function on(container, config) {
    if (!container) { return; }

    panelContainerEl = container;

    stackWidth = isNaN(config.stackWidth) ? 0 : config.stackWidth;

    // 'querySelectorAll()' returns a 'NodeList' object.
    // NodeList objects are the collection of nodes.
    // NodeList is not a JavaScript 'Array' although it's possible
    // to iterate over a 'NodeList' using the 'forEach()' method.
    // NodeList can be converted into a JavaScript array using 'Array.from()'.
    panelElList = panelContainerEl.querySelectorAll(".panel");
    panelElArr = Array.from(panelElList);

    numOfPanels = panelElList.length;

    // Set initial panel to display
    let moveToIndex = isNaN(config.moveToIndex) ? 0 : config.moveToIndex;
    if (moveToIndex < 0) { moveToIndex = 0; }
    if (moveToIndex > numOfPanels - 1) { moveToIndex = numOfPanels - 1; }

    const moveToPanelEl = panelElList[moveToIndex];
    if (moveToPanelEl) { moveToPanelEl.classList.add("panel-in-view"); }

    // The observer "callback is firing immediately once observe() is called."
    // https://stackoverflow.com/questions/60026223/does-resizeobserver-invoke-initially-on-page-load
    // https://stackoverflow.com/questions/67751039/javascript-resizeobserver-is-triggered-unexpected
    // https://github.com/WICG/resize-observer/issues/38#issuecomment-290537900
    resizeObserver.observe(panelContainerEl);
}

function off() {
    panelElList.forEach(panelEl => {
        panelEl.style.removeProperty("width");
        panelEl.style.removeProperty("z-index");
        panelEl.style.removeProperty("transform");
    });
    resizeObserver.unobserve(panelContainerEl);
}

function moveTo(moveToIndex, animate) {
    const panelInViewEl = panelContainerEl.querySelector(".panel-in-view");

    const moveToPanelEl = panelElList[moveToIndex];

    if (animate === false) {
        if (panelInViewEl) { panelInViewEl.classList.remove("panel-in-view"); }
        moveToPanelEl.classList.add("panel-in-view");
        setPanelPosn(moveToIndex);
        return;
    }

    if (panelInViewEl) {
        panelInViewEl.addEventListener('transitionend', transitionendHandler);
        panelInViewEl.classList.add('is-moving'); // Trigger transform transition
        panelInViewEl.classList.remove('panel-in-view');
    }

    if (moveToPanelEl) {
        moveToPanelEl.addEventListener("transitionend", transitionendHandler);
        moveToPanelEl.classList.add('is-moving', 'panel-in-view'); // Trigger transform transition
        setPanelPosn(moveToIndex);
    }
}

function setPanelPosn(moveToIndex) {
    panelElList.forEach((panelEl, index) => {
        let posn;
        let zIndex = numOfPanels;

        // The panel at the target index is set to the lowest 'z-index' value.
        // The panel sliver to the left should be higher than the
        // sliver to the right until the target index is reached.
        // The panel sliver higher than the target index should be lower
        // than the sliver to its right.

        if (index < moveToIndex) {
            posn = panelWidth * -1 + (stackWidth * (index + 1));
            zIndex += moveToIndex - index;
        }
        else if (index > moveToIndex) {
            posn = panelWidth + (stackWidth * (index - 1));
            zIndex += moveToIndex + index;
        }
        else if (index === moveToIndex) {
            posn = stackWidth * index;
        }

        panelEl.style.transform = `translateX(${posn}px)`;

        panelEl.style.zIndex = zIndex;
    });
}

export { on, off, moveTo };


//setTimeout(() => {
//    const moveToPanelEl = panelElList[moveToIndex];
//    moveToPanelEl.style.zIndex = numOfPanels;
//}, 200);
