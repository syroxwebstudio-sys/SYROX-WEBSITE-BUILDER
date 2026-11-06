
const API_URL =
  "https://syrox-web-studio-api.onrender.com/api/generate";

const generateButton = document.getElementById("generate");
const ideaInput = document.getElementById("idea");
const statusText = document.getElementById("status");
const preview = document.getElementById("website-preview");

const category = document.getElementById("category");
const designStyle = document.getElementById("design-style");
const colorTheme = document.getElementById("color-theme");

const downloadButton =
  document.getElementById("download-website");

const editPrompt =
  document.getElementById("edit-prompt");

const editButton =
  document.getElementById("edit-website");

const desktopButton =
  document.getElementById("desktop-view");

const tabletButton =
  document.getElementById("tablet-view");

const mobileButton =
  document.getElementById("mobile-view");

let generatedHTML = "";
let originalIdea = "";

preview.setAttribute("sandbox", "");

// AI API REQUEST

async function generateWithAI(idea) {

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idea })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "AI generation failed.");
  }

  if (!data.html || typeof data.html !== "string") {
    throw new Error("Invalid AI response.");
  }

  return data.html
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "");
}

// GENERATE WEBSITE

generateButton.addEventListener("click", async function () {

  const idea = ideaInput.value.trim();

  if (!idea) {
    statusText.textContent = "Please enter your website idea.";
    return;
  }

  if (idea.length > 1500) {
    statusText.textContent = "Please shorten your website idea.";
    return;
  }

  const finalIdea = `
Create a complete professional responsive website.

Website idea: ${idea}

Website category: ${category.value}
Design style: ${designStyle.value}
Color theme: ${colorTheme.value}

Requirements:
- Premium modern design
- Responsive layout
- Attractive navigation
- Professional sections
- Mobile-friendly layout
- Return only complete HTML code.
`;

  generateButton.disabled = true;
  downloadButton.disabled = true;
  editButton.disabled = true;

  statusText.textContent = "SYROX AI is creating your website...";

  try {

    generatedHTML = await generateWithAI(finalIdea);

    originalIdea = finalIdea;

    preview.srcdoc = generatedHTML;

    downloadButton.disabled = false;
    editButton.disabled = false;

    statusText.textContent = "Your website is ready!";

  } catch (error) {

    console.error(error);
    statusText.textContent = error.message;

  } finally {

    generateButton.disabled = false;

  }

});

// DESKTOP PREVIEW

function setPreview(width, button) {

  preview.style.width = width;

  [desktopButton, tabletButton, mobileButton]
    .forEach(function (item) {
      item.classList.remove("active");
    });

  button.classList.add("active");
}

desktopButton.addEventListener("click", function () {
  setPreview("100%", desktopButton);
});

tabletButton.addEventListener("click", function () {
  setPreview("768px", tabletButton);
});

mobileButton.addEventListener("click", function () {
  setPreview("375px", mobileButton);
});

// AI WEBSITE EDITING

editButton.addEventListener("click", async function () {

  const instruction = editPrompt.value.trim();

  if (!generatedHTML) {
    statusText.textContent = "Generate a website first.";
    return;
  }

  if (!instruction) {
    statusText.textContent = "Enter your editing instruction.";
    return;
  }

  const editIdea = `
Modify the following existing website according to the user's instruction.

Original website requirements:
${originalIdea}

User editing instruction:
${instruction}

Existing website HTML:
${generatedHTML}

Return the complete updated HTML only.
`;

  editButton.disabled = true;
  generateButton.disabled = true;
  statusText.textContent = "SYROX AI is editing your website...";

  try {

    const updatedHTML = await generateWithAI(editIdea);

    generatedHTML = updatedHTML;
    preview.srcdoc = generatedHTML;

    editPrompt.value = "";

    statusText.textContent = "Website successfully updated!";

  } catch (error) {

    console.error(error);
    statusText.textContent = error.message;

  } finally {

    editButton.disabled = false;
    generateButton.disabled = false;

  }

});

// DOWNLOAD WEBSITE

downloadButton.addEventListener("click", function () {

  if (!generatedHTML) {
    statusText.textContent = "Generate a website first.";
    return;
  }

  const blob = new Blob(
    [generatedHTML],
    { type: "text/html" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "syrox-website.html";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(function () {
    URL.revokeObjectURL(url);
  }, 1000);

  statusText.textContent = "Website downloaded successfully!";

});
