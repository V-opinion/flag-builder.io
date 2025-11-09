
let userFlag = [];
let selectedTextId = null;
let dragOffset = null;

// Example flagTemplates as above...

function addLetter() {
  const txt = document.getElementById('addLetterInput').value.trim();
  if (!txt) return;
  userFlag.push({
    type: "text",
    text: txt,
    x: 120,
    y: 110,
    fontSize: 56,
    fill: "#fff",
    fontWeight: "bold",
    id: "l" + (Math.random() * 100000).toFixed(0)
  });
  drawFlag(userFlag);
  document.getElementById('addLetterInput').value = "";
  selectText(userFlag[userFlag.length - 1].id); // Auto-select the new one
}

function drawFlag(shapes) {
  const svg = document.getElementById('flagCanvas');
  svg.innerHTML = '';
  shapes.forEach((shape, idx) => {
    let el;
    if (shape.type === 'rect') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      el.setAttribute('x', shape.x);
      el.setAttribute('y', shape.y);
      el.setAttribute('width', shape.width);
      el.setAttribute('height', shape.height);
      el.setAttribute('fill', shape.fill);
    }
    if (shape.type === 'text') {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      el.setAttribute('x', shape.x);
      el.setAttribute('y', shape.y);
      el.setAttribute('fill', shape.fill);
      el.setAttribute('font-size', shape.fontSize);
      el.setAttribute('font-weight', shape.fontWeight || "normal");
      el.setAttribute('font-family', "Arial, sans-serif");
      el.textContent = shape.text;
      el.setAttribute('cursor', 'move');
      // Highlight if selected
      if (selectedTextId === shape.id) {
        el.setAttribute('stroke', '#00aaff');
        el.setAttribute('stroke-width', "2");
      }
      // Drag/select events
      el.addEventListener('mousedown', function(evt) {
        selectText(shape.id);
        dragOffset = { x: evt.offsetX - shape.x, y: evt.offsetY - shape.y };
        svg.addEventListener('mousemove', dragMoveText);
        svg.addEventListener('mouseup', dragEndText);
      });
    }
    svg.appendChild(el);
  });
  renderSelectedTextPanel();
}

function selectText(id) {
  selectedTextId = id;
  renderSelectedTextPanel();
  drawFlag(userFlag);
}

function dragMoveText(evt) {
  if (!selectedTextId || dragOffset == null) return;
  let txt = userFlag.find(shape => shape.id === selectedTextId);
  txt.x = evt.offsetX - dragOffset.x;
  txt.y = evt.offsetY - dragOffset.y;
  drawFlag(userFlag);
}

function dragEndText(evt) {
  dragOffset = null;
  const svg = document.getElementById('flagCanvas');
  svg.removeEventListener('mousemove', dragMoveText);
  svg.removeEventListener('mouseup', dragEndText);
}

function renderSelectedTextPanel() {
  const panel = document.getElementById('selectedTextPanel');
  if (!selectedTextId) {
    panel.innerHTML = '<i>Click a letter to select.</i>';
    return;
  }
  let txt = userFlag.find(shape => shape.id === selectedTextId);
  if (!txt) {
    panel.innerHTML = '';
    return;
  }
  panel.innerHTML = `
    <label>Text: <input type="text" id="txtText" value="${txt.text}" /></label><br/>
    <label>Fill: <input type="color" id="txtColor" value="${txt.fill}" /></label><br/>
    <label>Size: <input type="number" id="txtSize" min="12" max="200" value="${txt.fontSize}" style="width:50px;"/></label><br/>
    <button onclick="deleteSelectedText()">Delete</button>
  `;

  // Responsive event listeners for live editing:
  document.getElementById('txtText').oninput = function() {
    txt.text = this.value;
    drawFlag(userFlag);
  };
  document.getElementById('txtColor').oninput = function() {
    txt.fill = this.value;
    drawFlag(userFlag);
  };
  document.getElementById('txtSize').oninput = function() {
    txt.fontSize = +this.value;
    drawFlag(userFlag);
  };
}

function deleteSelectedText() {
  userFlag = userFlag.filter(shape => shape.id !== selectedTextId);
  selectedTextId = null;
  drawFlag(userFlag);
}

function loadFlag(key) {
  userFlag = [...flagTemplates[key]];
  selectedTextId = null;
  drawFlag(userFlag);
}

window.onload = () => loadFlag('se');
