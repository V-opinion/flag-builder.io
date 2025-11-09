import React, { useState } from "react";

// Initial flag shapes — add more or load from file/template!
const initialShapes = [
  { id: 1, type: "rectangle", x: 0, y: 0, width: 320, height: 200, fill: "#006aa7", layerOrder: 1, visible: true, locked: false },
  { id: 2, type: "vertical-stripe", x: 90, y: 0, width: 40, height: 200, fill: "#fecc00", layerOrder: 2, visible: true, locked: false },
  { id: 3, type: "horizontal-stripe", x: 0, y: 80, width: 320, height: 40, fill: "#fecc00", layerOrder: 3, visible: true, locked: false }
];

function FlagEditor() {
  // Core states
  const [shapes, setShapes] = useState(initialShapes);
  const [selectedShape, setSelectedShape] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Undo/redo stacks
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  // Reference image
  const [imageLayer, setImageLayer] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(0.5);

  // Helpers for history
  function updateShapes(newShapes) {
    setHistory([...history, shapes]);
    setShapes(newShapes);
    setFuture([]);
  }

  function undo() {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture([shapes, ...future]);
    setShapes(previous);
    setHistory(history.slice(0, -1));
  }
  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setHistory([...history, shapes]);
    setShapes(next);
    setFuture(future.slice(1));
  }

  // Drag logic (locked shapes can't be dragged)
  const handleMouseDown = (e, shape) => {
    if (shape.locked) return;
    setSelectedShape(shape.id);
    setDraggingId(shape.id);
    setDragOffset({
      x: e.nativeEvent.offsetX - shape.x,
      y: e.nativeEvent.offsetY - shape.y
    });
  };
  const handleMouseMove = (e) => {
    if (draggingId) {
      const svg = e.target.ownerSVGElement || e.target;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse());
      updateShapes(
        shapes.map(shape =>
          shape.id === draggingId && !shape.locked
            ? { ...shape, x: x - dragOffset.x, y: y - dragOffset.y }
            : shape
        )
      );
    }
  };
  const handleMouseUp = () => setDraggingId(null);

  // Shape rendering and selection
  const renderShape = (shape) => (
    <rect
      key={shape.id}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      fill={shape.fill}
      stroke={selectedShape === shape.id ? "#f00" : "none"}
      strokeWidth="3"
      opacity={shape.visible ? 1 : 0}
      onMouseDown={e => handleMouseDown(e, shape)}
      style={{ cursor: shape.locked ? "not-allowed" : "move" }}
      onClick={() => setSelectedShape(shape.id)}
    />
  );

  // Layer controls
  function toggleVisibility(id) {
    updateShapes(shapes.map(shape => shape.id === id ? { ...shape, visible: !shape.visible } : shape));
  }
  function toggleLock(id) {
    updateShapes(shapes.map(shape => shape.id === id ? { ...shape, locked: !shape.locked } : shape));
  }
  function deleteLayer(id) {
    updateShapes(shapes.filter(shape => shape.id !== id));
    if (selectedShape === id) setSelectedShape(null);
  }
  function moveLayer(id, direction) {
    // Swap layerOrder with adjacent
    let sorted = [...shapes].sort((a, b) => a.layerOrder - b.layerOrder);
    const idx = sorted.findIndex(s => s.id === id);
    if ((direction < 0 && idx === 0) || (direction > 0 && idx === sorted.length - 1)) return;
    const swapIdx = idx + direction;
    [sorted[idx].layerOrder, sorted[swapIdx].layerOrder] = [sorted[swapIdx].layerOrder, sorted[idx].layerOrder];
    updateShapes(sorted);
  }

  // PNG/JPEG Reference Image
  function handleImageImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageLayer(reader.result);
    reader.readAsDataURL(file);
  }

  // SVG Export
  function exportSVG() {
    const svg = document.querySelector("svg");
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flag.svg";
    link.click();
    URL.revokeObjectURL(url);
  }

  // Edit shape controls
  function editShapeProp(prop, value) {
    updateShapes(
      shapes.map(shape =>
        shape.id === selectedShape ? { ...shape, [prop]: value } : shape
      )
    );
  }

  return (
    <div>
      <h2>Flag Editor</h2>
      <div style={{ display: "flex" }}>
        {/* Main SVG + reference image */}
        <div>
          <svg
            width="320"
            height="200"
            style={{ border: "1px solid #333", background: "#fff" }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Reference PNG layer, if present */}
            {imageLayer && (
              <image
                href={imageLayer}
                x="0"
                y="0"
                width="320"
                height="200"
                opacity={imageOpacity}
              />
            )}
            {/* Render sorted shapes (layers!) */}
            {shapes
              .sort((a, b) => a.layerOrder - b.layerOrder)
              .map(renderShape)}
          </svg>
          <div style={{ margin: "4px 0" }}>
            <button onClick={exportSVG}>Export SVG</button>
            <button onClick={undo}>Undo</button>
            <button onClick={redo}>Redo</button>
          </div>
          <div>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageImport}
              style={{ margin: "4px 0" }}
            />
            {imageLayer && (
              <div>
                <label>
                  PNG opacity:&nbsp;
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={imageOpacity}
                    onChange={e => setImageOpacity(Number(e.target.value))}
                  />
                  {imageOpacity}
                </label>
                <button onClick={() => setImageLayer(null)}>Remove PNG</button>
              </div>
            )}
          </div>
        </div>
        {/* Layer sidebar */}
        <div style={{ marginLeft: "32px", width: "200px" }}>
          <h3>Layers</h3>
          {shapes
            .sort((a, b) => a.layerOrder - b.layerOrder)
            .map((shape, idx) => (
              <div key={shape.id}
                style={{
                  background: selectedShape === shape.id ? "#eef" : "#fff",
                  padding: 6,
                  border: "1px solid #ccc",
                  marginBottom: 3,
                }}
              >
                <span>{shape.type}</span>
                <button onClick={() => toggleVisibility(shape.id)} style={{ marginLeft: 4 }}>
                  {shape.visible ? "Hide" : "Show"}
                </button>
                <button onClick={() => toggleLock(shape.id)} style={{ marginLeft: 4 }}>
                  {shape.locked ? "Unlock" : "Lock"}
                </button>
                <button onClick={() => deleteLayer(shape.id)} style={{ marginLeft: 4 }}>Delete</button>
                <button onClick={() => moveLayer(shape.id, -1)} style={{ marginLeft: 4 }}>Up</button>
                <button onClick={() => moveLayer(shape.id, 1)} style={{ marginLeft: 4 }}>Down</button>
              </div>
            ))}
        </div>
        {/* Edit selected shape */}
        <div style={{ marginLeft: "32px", width: "200px" }}>
          {selectedShape && (() => {
            const shape = shapes.find(s => s.id === selectedShape);
            if (!shape) return null;
            return (
              <div>
                <h4>Edit Shape</h4>
                <div>
                  <label>Color:</label>
                  <input
                    type="color"
                    value={shape.fill}
                    onChange={e => editShapeProp("fill", e.target.value)}
                  />
                </div>
                <div>
                  <label>X:</label>
                  <input
                    type="number"
                    value={shape.x}
                    onChange={e => editShapeProp("x", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label>Y:</label>
                  <input
                    type="number"
                    value={shape.y}
                    onChange={e => editShapeProp("y", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label>Width:</label>
                  <input
                    type="number"
                    value={shape.width}
                    onChange={e => editShapeProp("width", Number(e.target.value))}
                  />
                </div>
                <div>
                  <label>Height:</label>
                  <input
                    type="number"
                    value={shape.height}
                    onChange={e => editShapeProp("height", Number(e.target.value))}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default FlagEditor;
