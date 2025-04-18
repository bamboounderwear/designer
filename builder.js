/*
 * Bootstrap Visual Webpage Builder Core Logic
 * Assumes folder /components/ contains HTML files, one per prebuilt Bootstrap component.
 */

// Config: List your components and human-readable names here.
const COMPONENTS = [
    { file: "alert.html", name: "Alert" },
    { file: "card.html", name: "Card" },
    { file: "navbar.html", name: "Navbar" },
    { file: "carousel.html", name: "Carousel" },
    { file: "footer.html", name: "Footer" }
];

// Load and display draggable components in the sidebar
function loadComponentList() {
    const list = document.getElementById("componentList");
    list.innerHTML = "";

    COMPONENTS.forEach(comp => {
        const card = document.createElement("div");
        card.className = "component-card";
        card.setAttribute("draggable", "true");
        card.dataset.file = comp.file;
        card.innerText = comp.name;

        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData('component-file', comp.file);
            card.classList.add('dragging');
        });
        card.addEventListener("dragend", (e) => {
            card.classList.remove('dragging');
        });

        list.appendChild(card);
    });
}

// Helper: Fetch HTML fragment for a component
async function loadComponentHTML(file) {
    try {
        const resp = await fetch('components/' + file);
        if (!resp.ok) throw new Error("Failed to load " + file);
        return await resp.text();
    } catch (error) {
        return `<div class="alert alert-danger">Failed to load ${file}</div>`;
    }
}

// Drag-and-drop handler
async function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.getData('component-file');
    if (!file) return;

    const html = await loadComponentHTML(file);
    addComponentInstance(html, file);
}

function addComponentInstance(html, file) {
    const builder = document.getElementById("builderArea");
    // Remove placeholder if present
    const placeholder = document.getElementById("builderPlaceholder");
    if (placeholder) placeholder.remove();

    // Make a wrapper, for removal and possible future editing
    const wrapper = document.createElement("div");
    wrapper.className = "component-instance";
    wrapper.setAttribute("data-file", file);

    // Add remove button
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.innerHTML = "&times;";
    removeBtn.title = "Remove Component";
    removeBtn.onclick = () => wrapper.remove();

    // Inner HTML (component preview)
    wrapper.innerHTML = html;
    wrapper.prepend(removeBtn);

    builder.appendChild(wrapper);
}

// Download as HTML (with all dropped components inside a Bootstrap page)
function downloadHTML() {
    const builder = document.getElementById("builderArea");
    // Grab the DOM of all direct children that are "component-instance"
    const components = Array.from(
        builder.querySelectorAll('.component-instance')
    ).map(wrap => wrap.cloneNode(true));
    // Remove remove buttons from clones
    components.forEach(wp => {
        const btn = wp.querySelector(".remove-btn");
        if (btn) btn.remove();
    });

    // Compose HTML document
    const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Bootstrap Page</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
${components.map(comp => comp.innerHTML).join("\n\n")}
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;

    // Download file
    const blob = new Blob([htmlDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-bootstrap-page.html";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
    }, 200);
}

// Setup
document.addEventListener("DOMContentLoaded", () => {
    loadComponentList();
    document.getElementById("downloadBtn").addEventListener("click", downloadHTML);
});