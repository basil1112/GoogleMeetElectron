const canvas = new fabric.Canvas("canvas", { isDrawingMode: true });
canvas.setWidth(window.innerWidth);
canvas.setHeight(window.innerHeight);
canvas.freeDrawingBrush.color = "#D54C4C";
canvas.freeDrawingBrush.width = 5;
canvas.freeDrawingBrush.shadow = new fabric.Shadow({
  blur: 5 || 0,
  offsetX: 0,
  offsetY: 0,
  affectStroke: true,
  color: "#93FC8F",
});

window.addEventListener("resize", () => {
  canvas.setWidth(window.innerWidth);
  canvas.setHeight(window.innerHeight);
  canvas.renderAll();
});
