// script.js

/*
 * Bootstrap Grid Layout Builder
 * Pure Vanilla JS
 * See index.html for required Bootstrap assets.
 * 
 * Core Data Model:
 * - layoutData: [
 *     { id, columns: [
 *         { id, config: { col-lg, col-md, col-sm, offset, ... }, content: [ ... ] }
 *       ]
 *     }
 *   ]
 */

(function() {
    let layoutData = [];
    let rowCounter = 1;
    let colCounter = 1;
    let selectedRowId = null;
    let selectedColId = null;
  
    const builderContainer = document.getElementById('builder-container');
    const addRowBtn = document.getElementById('add-row-btn');
    const addColBtn = document.getElementById('add-col-btn');
    const addTextBtn = document.getElementById('add-text-btn');
    const addImageBtn = document.getElementById('add-image-btn');
    const downloadBtn = document.getElementById('download-btn');
    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
    const imageForm = document.getElementById('imageForm');
    const imgUrlInput = document.getElementById('imgUrlInput');
    const imgAltInput = document.getElementById('imgAltInput');
    const imgUrlFeedback = document.getElementById('imgUrlFeedback');
  
    function generateId(prefix) {
      const time = Date.now().toString(36).slice(-4);
      if (prefix == 'row') return `row_${rowCounter++}_${time}`;
      if (prefix == 'col') return `col_${colCounter++}_${time}`;
      return `${prefix}_${Math.random().toString(36).slice(2,7)}_${time}`;
    }
  
    // ========== EVENT HANDLERS ==========
  
    addRowBtn.addEventListener('click', () => {
      addRow();
    });
  
    addColBtn.addEventListener('click', () => {
      if (selectedRowId) {
        addCol(selectedRowId);
      } else {
        alert('Please select a row first to add a column.');
      }
    });
  
    addTextBtn.addEventListener('click', () => {
      if (selectedColId) {
        addTextToCol(selectedRowId, selectedColId);
      } else {
        alert('Select a column to add text.');
      }
    });
  
    addImageBtn.addEventListener('click', () => {
      if (selectedColId) {
        showImageModal();
      } else {
        alert('Select a column to add an image.');
      }
    });
  
    // Download Button (HTML generation)
    downloadBtn.addEventListener('click', () => {
      const html = generateExportHTML();
      download('layout.html', html);
    });
  
    // ========== ROW/COL/CONTENT DATA MODEL ==========
  
    function addRow() {
      const rowId = generateId('row');
      layoutData.push({
        id: rowId,
        columns: []
      });
      selectRow(rowId);
      render();
    }
  
    function removeRow(rowId) {
      layoutData = layoutData.filter(row => row.id !== rowId);
      if (selectedRowId === rowId) {
        selectedRowId = null;
        selectedColId = null;
      }
      render();
    }
  
    function addCol(rowId) {
      const row = layoutData.find(r => r.id === rowId);
      if (!row) return;
      const colId = generateId('col');
      // Default: 12 cols, set new col to e.g. 12, or try to autodistribute
      let colLg = 12;
      const usedLg = row.columns.reduce((s, c) => s + parseInt(c.config.colLg || 0), 0);
      if (row.columns.length > 0 && usedLg < 12) colLg = Math.max(1, Math.min(12 - usedLg, 4));
      row.columns.push({
        id: colId,
        config: {
          colLg: colLg,
          colMd: colLg,
          colSm: 12,
          offsetLg: 0,
          offsetMd: 0,
          offsetSm: 0
        },
        content: []
      });
      selectCol(rowId, colId);
      render();
    }
  
    function removeCol(rowId, colId) {
      const row = layoutData.find(r => r.id === rowId);
      if (!row) return;
      row.columns = row.columns.filter(c => c.id !== colId);
      if (selectedColId === colId) selectedColId = null;
      render();
    }
  
    function selectRow(rowId) {
      selectedRowId = rowId;
      selectedColId = null;
      render();
    }
  
    function selectCol(rowId, colId) {
      selectedRowId = rowId;
      selectedColId = colId;
      render();
    }
  
    function moveCol(rowId, colId, direction) {
      const row = layoutData.find(r => r.id === rowId);
      if (!row) return;
      const idx = row.columns.findIndex(c => c.id === colId);
      if (idx === -1) return;
      if (direction === 'left' && idx > 0) {
        [row.columns[idx - 1], row.columns[idx]] = [row.columns[idx], row.columns[idx - 1]];
      }
      if (direction === 'right' && idx < row.columns.length - 1) {
        [row.columns[idx], row.columns[idx + 1]] = [row.columns[idx + 1], row.columns[idx]];
      }
      render();
    }
  
    function moveRow(rowId, direction) {
      const idx = layoutData.findIndex(r => r.id === rowId);
      if (idx === -1) return;
      if (direction === 'up' && idx > 0) {
        [layoutData[idx - 1], layoutData[idx]] = [layoutData[idx], layoutData[idx - 1]];
      }
      if (direction === 'down' && idx < layoutData.length - 1) {
        [layoutData[idx], layoutData[idx + 1]] = [layoutData[idx + 1], layoutData[idx]];
      }
      render();
    }
  
    function addTextToCol(rowId, colId) {
      const col = getCol(rowId, colId);
      if (!col) return;
  
      // Add a new text block with placeholder
      col.content.push({
        type: 'text',
        html: 'Click to edit text...'
      });
      render();
      setTimeout(() => {
        // Focus new text div for immediate editing
        const el = document.querySelector(`[data-row-id="${rowId}"][data-col-id="${colId}"] .content-editable:last-child`);
        if (el) el.focus();
      }, 150);
    }
  
    function showImageModal() {
      imgUrlInput.value = '';
      imgAltInput.value = '';
      imgUrlFeedback.classList.add('d-none');
      imageModal.show();
    }
  
    imageForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const url = imgUrlInput.value.trim();
      const alt = imgAltInput.value.trim();
      if (!url) {
        imgUrlFeedback.classList.remove('d-none');
        return;
      }
      addImageToCol(selectedRowId, selectedColId, url, alt);
      imageModal.hide();
    });
  
    function addImageToCol(rowId, colId, url, alt) {
      const col = getCol(rowId, colId);
      if (!col) return;
      col.content.push({
        type: 'image',
        url: url,
        alt: alt
      });
      render();
    }
  
    function removeContent(rowId, colId, contentIdx) {
      const col = getCol(rowId, colId);
      if (!col) return;
      col.content.splice(contentIdx, 1);
      render();
    }
  
    // ========== COL CONFIGURATION PANEL ==========
  
    function getCol(rowId, colId) {
      const row = layoutData.find(r => r.id === rowId);
      if (!row) return null;
      return row.columns.find(c => c.id === colId) || null;
    }
  
    function setColConfig(rowId, colId, field, value) {
      const col = getCol(rowId, colId);
      if (!col) return;
      col.config[field] = value;
      render();
    }
  
    // ========== RENDER FUNCTION ==========
  
    function render() {
      builderContainer.innerHTML = '';
  
      // Iterate rows
      layoutData.forEach((row, rowIdx) => {
        // Row outer div
        const rowDiv = document.createElement('div');
        rowDiv.className = 'builder-row mb-3';
        rowDiv.dataset.rowId = row.id;
        if (row.id === selectedRowId) rowDiv.classList.add('selected');
  
        // Row click to select
        rowDiv.addEventListener('click', (e) => {
          // Only row background click should select (not columns)
          if (e.target === rowDiv) selectRow(row.id);
        });
  
        // Row controls (move, add col, remove row)
        const rowControls = document.createElement('div');
        rowControls.className = 'row-controls';
  
        rowControls.innerHTML =
          `<button title="Move Row Up" class="btn btn-sm" ${rowIdx === 0 ? 'disabled' : ''}>
              <i class="bi bi-arrow-up"></i>
           </button>
           <button title="Move Row Down" class="btn btn-sm" ${rowIdx === layoutData.length-1 ? 'disabled' : ''}>
              <i class="bi bi-arrow-down"></i>
           </button>
           <button title="Remove Row" class="btn btn-sm btn-danger">
              <i class="bi bi-x-lg"></i>
           </button>`;
  
        // Row controls logic
        const [moveUpBtn, moveDownBtn, removeRowBtn] = rowControls.children;
        moveUpBtn.addEventListener('click', (e) => { e.stopPropagation(); moveRow(row.id, 'up'); });
        moveDownBtn.addEventListener('click', (e) => { e.stopPropagation(); moveRow(row.id, 'down'); });
        removeRowBtn.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Remove this row?')) removeRow(row.id); });
  
        rowDiv.appendChild(rowControls);
  
        // Columns as Bootstrap .row > .col-...
        const gridRow = document.createElement('div');
        gridRow.className = 'row';
  
        row.columns.forEach((col, colIdx) => {
          // Calculate classes for col div
          let colClasses = [];
          if (col.config.colLg) colClasses.push(`col-lg-${col.config.colLg}`);
          if (col.config.colMd) colClasses.push(`col-md-${col.config.colMd}`);
          if (col.config.colSm) colClasses.push(`col-sm-${col.config.colSm}`);
          if (col.config.offsetLg) colClasses.push(`offset-lg-${col.config.offsetLg}`);
          if (col.config.offsetMd) colClasses.push(`offset-md-${col.config.offsetMd}`);
          if (col.config.offsetSm) colClasses.push(`offset-sm-${col.config.offsetSm}`);
          colClasses.push('builder-col');
          if (col.id === selectedColId && row.id === selectedRowId) colClasses.push('selected');
  
          const colDiv = document.createElement('div');
          colDiv.className = colClasses.join(' ');
          colDiv.dataset.colId = col.id;
          colDiv.dataset.rowId = row.id;
  
          colDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCol(row.id, col.id);
          });
  
          // Col controls: configure, move, remove
          const colControls = document.createElement('div');
          colControls.className = 'col-controls';
          colControls.innerHTML =
            `<button title="Move Left" class="btn btn-light"><i class="bi bi-arrow-left"></i></button>
             <button title="Move Right" class="btn btn-light"><i class="bi bi-arrow-right"></i></button>
             <button title="Remove Column" class="btn btn-danger"><i class="bi bi-x"></i></button>`;
  
          const [leftBtn, rightBtn, removeBtn] = colControls.children;
          leftBtn.addEventListener('click', e => { e.stopPropagation(); moveCol(row.id, col.id, 'left'); });
          rightBtn.addEventListener('click', e => { e.stopPropagation(); moveCol(row.id, col.id, 'right'); });
          removeBtn.addEventListener('click', e => { e.stopPropagation(); if (confirm('Remove this column?')) removeCol(row.id, col.id); });
  
          colDiv.appendChild(colControls);
  
          // If selected, show config form!
          if (row.id === selectedRowId && col.id === selectedColId) {
            colDiv.appendChild(configureColPanel(row.id, col.id, col.config));
          }
  
          // Column Content
          col.content.forEach((item, cidx) => {
            if (item.type === 'text') {
              const textDiv = document.createElement('div');
              textDiv.className = 'content-editable';
              textDiv.contentEditable = 'true';
              textDiv.innerHTML = item.html;
              textDiv.dataset.contentIdx = cidx;
              // Save onBlur
              textDiv.addEventListener('blur', e => {
                item.html = textDiv.innerHTML;
              });
              // Remove text content (if col selected)
              if (row.id === selectedRowId && col.id === selectedColId) {
                const rmBtn = document.createElement('button');
                rmBtn.className = 'btn btn-sm btn-outline-danger ms-2';
                rmBtn.title = 'Remove text content';
                rmBtn.innerHTML = '<i class="bi bi-trash"></i>';
                rmBtn.style.position = 'absolute';
                rmBtn.style.top = '2px';
                rmBtn.style.right = '2px';
                rmBtn.style.zIndex = 5;
                rmBtn.addEventListener('click', e => {
                  e.stopPropagation();
                  removeContent(row.id, col.id, cidx);
                });
                textDiv.appendChild(rmBtn);
              }
              colDiv.appendChild(textDiv);
            } else if (item.type === 'image') {
              const img = document.createElement('img');
              img.src = item.url;
              img.alt = item.alt || '';
              img.className = 'img-preview';
              // Remove image (if col selected)
              if (row.id === selectedRowId && col.id === selectedColId) {
                const rmBtn = document.createElement('button');
                rmBtn.className = 'btn btn-sm btn-outline-danger ms-2';
                rmBtn.title = 'Remove image';
                rmBtn.style.position = 'absolute';
                rmBtn.style.top = '4px';
                rmBtn.style.right = '4px';
                rmBtn.style.zIndex = 6;
                rmBtn.innerHTML = '<i class="bi bi-trash"></i>';
                rmBtn.addEventListener('click', e => {
                  e.stopPropagation();
                  removeContent(row.id, col.id, cidx);
                });
                colDiv.appendChild(rmBtn);
              }
              colDiv.appendChild(img);
            }
          });
  
          gridRow.appendChild(colDiv);
        });
  
        rowDiv.appendChild(gridRow);
        builderContainer.appendChild(rowDiv);
      });
    }
  
    function configureColPanel(rowId, colId, config) {
      // A small form for colLg/colMd/colSm/offsets
      const panel = document.createElement('div');
      panel.className = 'setup-panel mt-2 mb-2';
  
      function formGroup(label, name, value, min, max) {
        return `<div class="input-group input-group-sm mb-1">
          <span class="input-group-text">${label}</span>
          <input type="number" min="${min}" max="${max}" class="form-control" style="max-width: 55px;" name="${name}" value="${value}">
        </div>`;
      }
  
      panel.innerHTML = `
        <div class="d-flex flex-wrap gap-2">
          ${formGroup('LG cols', 'colLg', config.colLg, 1, 12)}
          ${formGroup('LG offset', 'offsetLg', config.offsetLg || 0, 0, 11)}
          ${formGroup('MD cols', 'colMd', config.colMd, 1, 12)}
          ${formGroup('MD offset', 'offsetMd', config.offsetMd || 0, 0, 11)}
          ${formGroup('SM cols', 'colSm', config.colSm, 1, 12)}
          ${formGroup('SM offset', 'offsetSm', config.offsetSm || 0, 0, 11)}
        </div>
      `;
  
      // Attach change events
      panel.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
          let v = parseInt(input.value);
          if (isNaN(v)) v = 0;
          if (input.name.startsWith('col')) v = Math.max(1, Math.min(v, 12));
          if (input.name.startsWith('offset')) v = Math.max(0, Math.min(v, 11));
          setColConfig(rowId, colId, input.name, v);
        });
      });
  
      return panel;
    }
  
    // ========== HTML EXPORT/DOWNLOAD ==========
  
    function escapeHTML(str) {
      return str.replace(/[&<>"']/g, function(m) {
        switch (m) {
          case '&': return '&amp;';
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#39;';
        }
      });
    }
  
    function generateExportHTML() {
      // Bootstrap grid structure only - user's content (text/image) is embedded
      let html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Exported Layout</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body>
    <div class="container-fluid py-4">
  `;
  
      layoutData.forEach((row) => {
        html += `    <div class="row mb-4">\n`;
        row.columns.forEach((col) => {
          // Build col class
          const colClasses = [];
          if (col.config.colLg) colClasses.push(`col-lg-${col.config.colLg}`);
          if (col.config.colMd) colClasses.push(`col-md-${col.config.colMd}`);
          if (col.config.colSm) colClasses.push(`col-sm-${col.config.colSm}`);
          if (col.config.offsetLg) colClasses.push(`offset-lg-${col.config.offsetLg}`);
          if (col.config.offsetMd) colClasses.push(`offset-md-${col.config.offsetMd}`);
          if (col.config.offsetSm) colClasses.push(`offset-sm-${col.config.offsetSm}`);
          if (!colClasses.length) colClasses.push('col');
          html += `      <div class="${colClasses.join(' ')}">\n`;
  
          col.content.forEach((item) => {
            if (item.type === 'text') {
              html += `        <div>${item.html}</div>\n`;
            } else if (item.type === 'image') {
              html += `        <img src="${escapeHTML(item.url)}"${item.alt ? ' alt="' + escapeHTML(item.alt) + '"' : ''} class="img-fluid my-2"/>\n`;
            }
          });
  
          html += `      </div>\n`;
        });
        html += `    </div>\n`;
      });
  
      html += `  </div>\n</body>\n</html>`;
      return html;
    }
  
    // Download helper
    function download(filename, text) {
      const el = document.createElement('a');
      el.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(text));
      el.setAttribute('download', filename);
      el.style.display = 'none';
      document.body.appendChild(el);
      el.click();
      document.body.removeChild(el);
    }
  
    // ========== INIT/STATE ==========
  
    // Start with an empty row for user
    if (layoutData.length === 0) {
      addRow();
      addCol(layoutData[0].id);
    } else {
      render();
    }
  
    // Keyboard shortcuts—simple: Del to remove selected col, Esc to unselect
    document.addEventListener('keydown', e => {
      if (selectedColId && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        const row = layoutData.find(r => r.id === selectedRowId);
        if (row) {
          removeCol(selectedRowId, selectedColId);
        }
      } else if (e.key === 'Escape') {
        selectedColId = null;
        render();
      }
    });
  
    // Focus autoclear
    builderContainer.addEventListener('click', function(e) {
      // Click on builder background clears selection
      if (e.target === builderContainer) {
        selectedRowId = null;
        selectedColId = null;
        render();
      }
    });
  
    // Prevent losing model on accidental reload/close
    window.addEventListener('beforeunload', function (e) {
      if (layoutData.length > 1 || (layoutData[0]?.columns?.length > 1) || (layoutData[0]?.columns[0]?.content?.length)) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  })();