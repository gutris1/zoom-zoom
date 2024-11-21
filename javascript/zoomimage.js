onUiLoaded(function () {
  let imageContainer = document.getElementById("lightboxModal");
  imageContainer.style.width = "100%";
  imageContainer.style.height = "100%";
  imageContainer.style.overflow = "hidden";

  function disableClose(e) {
    e.stopPropagation();
  }

  let zoomSpan = document.querySelector(".modalZoom");
  let tileImageSpan = document.querySelector(".modalTileImage");
  let livePreviewSpan = document.querySelector(".modalToggleLivePreview");

  if (zoomSpan) zoomSpan.style.display = "none";
  if (tileImageSpan) tileImageSpan.style.display = "none";
  if (livePreviewSpan) livePreviewSpan.style.display = "none";

  let DisplayBefore = window.getComputedStyle(imageContainer).display;

  function DisplayChange() {
    const DisplayNow = window.getComputedStyle(imageContainer).display;

    if (DisplayNow !== DisplayBefore) {
      DisplayBefore = DisplayNow;

      if (DisplayNow === "flex") {
        document.body.style.overflow = "hidden";
      } else if (DisplayNow === "none") {
        document.body.style.overflow = "";
      }
    }
    requestAnimationFrame(DisplayChange);
  }

  requestAnimationFrame(DisplayChange);

  let modalControls = imageContainer.getElementsByClassName("modalControls")[0];
  if (modalControls) {
    modalControls.style.zIndex = 1;
  }

  const TopBar = document.createElement("style");
  TopBar.textContent = `
    .modalControls:hover {
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(TopBar);

  let img = imageContainer.querySelector("img");
  if (img) {
    img.style.top = "0";
    img.style.width = "auto";
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    img.style.maxHeight = "100%";
    img.style.objectFit = "contain";
  }

  let scale = 1;
  let lastX = 0;
  let lastY = 0;
  let lastLen = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let touchStore = {};
  let moveFunTimer = setTimeout(() => {}, 0);
  let moveFunLastExecTime = Date.now();

  let event = {
    wheel: function (event) {
      event.stopPropagation();
      event.preventDefault();
      img.style.transition = "transform 0.3s ease";
      let delta = Math.max(-1, Math.min(1, event.wheelDelta || -event.detail));
      let zoomStep = 0.1;
      let zoom = 1 + delta * zoomStep;
      let lastScale = scale;
      scale *= zoom;
      scale = Math.max(0.1, scale);

      let centerX = imageContainer.offsetWidth / 2;
      let centerY = imageContainer.offsetHeight / 2;

      let imgCenterX = offsetX + centerX;
      let imgCenterY = offsetY + centerY;

      offsetX =
        event.clientX -
        ((event.clientX - imgCenterX) / lastScale) * scale -
        centerX;
      offsetY =
        event.clientY -
        ((event.clientY - imgCenterY) / lastScale) * scale -
        centerY;
      img.style.transform =
        "translate(" + offsetX + "px, " + offsetY + "px) scale(" + scale + ")";
    },

    mousedown: function (event) {
      event.stopPropagation();
      isDragging = true;
      lastX = event.clientX - offsetX;
      lastY = event.clientY - offsetY;
      img.style.cursor = "grabbing";
    },

    mousemove: function (event) {
      if (isDragging) {
        img.style.transition = "";
        event.stopPropagation();
        event.preventDefault();
        img.onclick = disableClose;
        let deltaX = event.clientX - lastX;
        let deltaY = event.clientY - lastY;
        offsetX = deltaX;
        offsetY = deltaY;
        img.style.transform =
          "translate(" + deltaX + "px, " + deltaY + "px) scale(" + scale + ")";
      }
    },

    mouseup: function (event) {
      event.stopPropagation();
      isDragging = false;
      img.style.cursor = "grab";
    },

    mouseleave: function (event) {
      event.stopPropagation();
      isDragging = false;
      img.style.cursor = "grab";
    },

    reset() {
      scale = 1;
      lastX = 0;
      lastY = 0;
      last2X = 0;
      last2Y = 0;
      offsetX = 0;
      offsetY = 0;
      touchStore = {};
      img.style.transform = "none";
      img.onclick = undefined;
    },

    touchcancel: function (event) {
      event.stopPropagation();
      event.preventDefault();
      img.onclick = undefined;
      img.style.transition = "";

      let newScale = scale * event.scale;

      img.style.transform =
        "translate(" + offsetX + "px, " + offsetY + "px) scale(" + scale + ")";
    },

    touchend: function (event) {

      event.stopPropagation();
      img.onclick = undefined;

      if (!event.targetTouches.length) {
        touchStore.tpuchScale = false;
      }
    },

    touchstart: function (event) {
      event.stopPropagation();

      if (!touchStore.tpuchScale) {
        lastX = event.targetTouches[0].clientX - offsetX;
        lastY = event.targetTouches[0].clientY - offsetY;
      }

      if (event.targetTouches[1]) {
        touchStore.tpuchScale = true;
        touchStore.last1X = event.targetTouches[0].clientX;
        touchStore.last1Y = event.targetTouches[0].clientY;
        touchStore.last2X = event.targetTouches[1].clientX;
        touchStore.last2Y = event.targetTouches[1].clientY;
        touchStore.scale = scale;
        lastLen = Math.sqrt(
          Math.pow(touchStore.last2X - touchStore.last1X, 2) +
            Math.pow(touchStore.last2Y - touchStore.last1Y, 2)
        );
      }
    },

    touchmove: function (event) {
      event.stopPropagation();
      event.preventDefault();
      img.onclick = disableClose;

      if (event.targetTouches[1]) {
        touchStore.delta1X = event.targetTouches[0].clientX;
        touchStore.delta1Y = event.targetTouches[0].clientY;
        touchStore.delta2X = event.targetTouches[1].clientX;
        touchStore.delta2Y = event.targetTouches[1].clientY;

        let centerX = imageContainer.offsetWidth / 2;
        let centerY = imageContainer.offsetHeight / 2;
        let deltaLen = Math.sqrt(
          Math.pow(touchStore.delta2X - touchStore.delta1X, 2) +
            Math.pow(touchStore.delta2Y - touchStore.delta1Y, 2)
        );

        let zoom = deltaLen / lastLen;
        let lastScale = scale;
        scale = touchStore.scale * zoom;
        scale = Math.max(0.1, scale);

        let deltaCenterX =
          touchStore.delta1X + (touchStore.delta2X - touchStore.delta1X) / 2;
        let deltaCenterY =
          touchStore.delta1Y + (touchStore.delta2Y - touchStore.delta1Y) / 2;

        let imgCenterX = offsetX + centerX;
        let imgCenterY = offsetY + centerY;

        offsetX =
          deltaCenterX -
          ((deltaCenterX - imgCenterX) / lastScale) * scale -
          centerX;
        offsetY =
          deltaCenterY -
          ((deltaCenterY - imgCenterY) / lastScale) * scale -
          centerY;

        function moveFun() {
          if (Date.now() - moveFunLastExecTime < 5) return;
          img.style.transition = "transform 0.3s ease";
          img.style.transform =
            "translate(" +
            offsetX +
            "px, " +
            offsetY +
            "px) scale(" +
            scale +
            ")";
        }

        if (Date.now() - moveFunLastExecTime >= 50) {
          moveFun();
          moveFunLastExecTime = Date.now();
        } else {
          clearTimeout(moveFunTimer);
          moveFunTimer = setTimeout(() => {
            moveFun();
          }, 50);
        }
      } else if (!touchStore.tpuchScale) {
        img.style.transition = "";
        offsetX = event.targetTouches[0].clientX - lastX;
        offsetY = event.targetTouches[0].clientY - lastY;
        img.style.transform =
          "translate(" +
          offsetX +
          "px, " +
          offsetY +
          "px) scale(" +
          scale +
          ")";
      }
    },
  };

  function reloadZoomEvent(new_event) {
    if (!new_event) return;
    imageContainer.removeEventListener("click", event.reset);
    imageContainer.removeEventListener("wheel", event.wheel);
    img.removeEventListener("mousedown", event.mousedown);
    img.removeEventListener("mousemove", event.mousemove);
    img.removeEventListener("mouseup", event.mouseup);
    img.removeEventListener("mouseleave", event.mouseleave);

    imageContainer.removeEventListener("touchend", event.touchend);
    imageContainer.removeEventListener("touchstart", event.touchstart);
    imageContainer.removeEventListener("touchmove", event.touchmove);
    event = new_event;

    imageContainer.addEventListener("click", event.reset);
    imageContainer.addEventListener("wheel", event.wheel);
    img.addEventListener("mousedown", event.mousedown);
    img.addEventListener("mousemove", event.mousemove);
    img.addEventListener("mouseup", event.mouseup);
    img.addEventListener("mouseleave", event.mouseleave);
    img.ondrag =
      img.ondragend =
      img.ondragstart =
        function (e) {
          e.stopPropagation();
          e.preventDefault();
        };

    imageContainer.addEventListener("touchend", event.touchend);
    imageContainer.addEventListener("touchstart", event.touchstart);
    imageContainer.addEventListener("touchmove", event.touchmove);
  }
  reloadZoomEvent(event);
});
