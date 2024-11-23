onUiLoaded(function () {
  let imageContainer = document.getElementById("lightboxModal");
  imageContainer.style.width = "100%";
  imageContainer.style.height = "100%";
  imageContainer.style.overflow = "hidden";

  let modalControls = imageContainer.getElementsByClassName("modalControls")[0];
  var SB = 'var(--button-secondary-text-color)';

  if (modalControls) {
    const Controlsmodal = document.createElement("style");
    Controlsmodal.textContent = `
      .modalZoom, .modalTileImage, .modalToggleLivePreview {
        display: none;
      }

      .modalControls {
        pointer-events: none;
      }

      .modalControls:hover {
        background-color: transparent !important;
        background: transparent !important;
      }

      .modalControls span {
        z-index: 9999;
        color: ${SB} !important;
        position: relative;
        pointer-events: auto;
        filter: brightness(1);
        text-shadow: 0px 0px 0.5rem black !important;
        transition: 0.3s ease;
      }

      .modalControls span:hover {
        filter: brightness(0.7);
      }

      .modalClose {
        font-size: 50px !important;
      }

      .modalSave {
        font-size: 40px !important;
        left: 20px !important;
      }

      .modalPrev, .modalNext {
        z-index: 9999;
        color: ${SB} !important;
      }
    `;
    document.head.appendChild(Controlsmodal);
  }

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
  let offsetX = 0;
  let offsetY = 0;
  let Groped = false;
  let GropinTime;

  function imgEL(E) {
    const imgRect = img.getBoundingClientRect();
    if (E.clientX >= imgRect.left && E.clientX <= imgRect.right &&
        E.clientY >= imgRect.top && E.clientY <= imgRect.bottom) {
      return true;
    }
    return false;
  }

  function imgClick(E) {
    if (!Groped) {
      E.stopPropagation();
      E.reset;
    }
  }

  let E = {
    wheel: function (E) {
      if (!imgEL(E)) return;
      E.stopPropagation();
      E.preventDefault();

      img.style.transition = "all 0.4s ease";

      let delta = Math.max(-1, Math.min(1, E.wheelDelta || -E.detail));
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
        E.clientX -
        ((E.clientX - imgCenterX) / lastScale) * scale - centerX;
      offsetY =
        E.clientY -
        ((E.clientY - imgCenterY) / lastScale) * scale - centerY;
  
      img.style.transform =
        "translate(" + offsetX + "px, " + offsetY + "px) scale(" + scale + ")";
    },
  
    mousedown: function (E) {
      if (!imgEL(E)) return;
      E.stopPropagation();
      img.style.transition = "none";
      GropinTime = setTimeout(() => {
        Groped = true;
        img.style.cursor = "grab";
        lastX = E.clientX - offsetX;
        lastY = E.clientY - offsetY;
      }, 100);
    },
  
    mousemove: function (E) {
      if (!imgEL(E) || !Groped) return;
      E.stopPropagation();
      E.preventDefault();
      img.onclick = imgClick;
      let deltaX = E.clientX - lastX;
      let deltaY = E.clientY - lastY;
      offsetX = deltaX;
      offsetY = deltaY;
      img.style.transform = "translate(" + deltaX + "px, " + deltaY + "px) scale(" + scale + ")";
    },

    mouseup: function (E) {
      img.style.cursor = "auto";
      if (!imgEL(E)) return;
      clearTimeout(GropinTime);
      if (!Groped) {
        img.onclick = E.stopPropagation();
        E.reset;
        return;
      }
      Groped = false;
    },

    mouseleave: function (E) {
      img.style.cursor = "auto";
      if (!imgEL(E)) return;
      clearTimeout(GropinTime);
      if (!Groped) {
        img.onclick = E.stopPropagation();
        E.reset;
        return;
      }
      Groped = false;
    },

    reset() {
      scale = 1;
      lastX = 0;
      lastY = 0;
      offsetX = 0;
      offsetY = 0;
      img.style.transform = "none";
      img.style.transition = "all 0.4s ease";
      img.onclick = undefined;
      Groped = false;
    }
  };

  function reloadZoomEvent(EEE) {
    if (!EEE) return;
    imageContainer.removeEventListener("click", E.reset);
    imageContainer.removeEventListener("wheel", E.wheel);
    img.removeEventListener("mousedown", E.mousedown);
    img.removeEventListener("mousemove", E.mousemove);
    img.removeEventListener("mouseup", E.mouseup);
    img.removeEventListener("mouseleave", E.mouseleave);
    E = EEE;

    imageContainer.addEventListener("click", E.reset);
    imageContainer.addEventListener("wheel", E.wheel);
    img.addEventListener("mousedown", E.mousedown);
    img.addEventListener("mousemove", E.mousemove);
    img.addEventListener("mouseup", E.mouseup);
    img.addEventListener("mouseleave", E.mouseleave);
    img.ondrag = img.ondragend = img.ondragstart = function (e) {
      e.stopPropagation();
      e.preventDefault();
    };
  }
  reloadZoomEvent(E);
});
