
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAiGfvrhAgBLmj8FImJz0sPsDHA2JlSb3E",
  authDomain: "syrox-web-studio.firebaseapp.com",
  projectId: "syrox-web-studio",
  storageBucket: "syrox-web-studio.firebasestorage.app",
  messagingSenderId: "270125576222",
  appId: "1:270125576222:web:2d7c90ba3fdb610b42fe0f",
  measurementId: "G-NHL77H14MG"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(firebaseApp);

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
const zipButton =
  document.getElementById("download-zip");

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
  zipButton.disabled = true;
  editButton.disabled = true;

  statusText.textContent = "SYROX AI is creating your website...";

  try {

    generatedHTML = await generateWithAI(finalIdea);

    originalIdea = finalIdea;

    preview.srcdoc = generatedHTML;

    downloadButton.disabled = false;
    zipButton.disabled = false;
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

  editButton.disabled = true;
  generateButton.disabled = true;

  statusText.textContent = "SYROX AI is editing your website...";

  try {
    const response = await fetch(
      "https://syrox-web-studio-api.onrender.com/api/edit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          html: generatedHTML,
          instruction: instruction
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Editing failed.");
    }

    if (!data.html || typeof data.html !== "string") {
      throw new Error("Invalid AI response.");
    }

    generatedHTML = data.html
      .replace(/^```html\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "");

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

// DOWNLOAD HTML WEBSITE

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

  statusText.textContent = "HTML downloaded successfully!";
});


// DOWNLOAD ZIP WEBSITE

zipButton.addEventListener("click", async function () {

  if (!generatedHTML) {
    statusText.textContent = "Generate a website first.";
    return;
  }

  if (typeof JSZip === "undefined") {
    statusText.textContent = "ZIP library not loaded. Refresh the page.";
    return;
  }

  zipButton.disabled = true;
  statusText.textContent = "Creating your ZIP file...";

  try {

    const zip = new JSZip();

    zip.file("index.html", generatedHTML);

    const zipBlob = await zip.generateAsync({
      type: "blob"
    });

    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "syrox-website.zip";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);

    statusText.textContent = "ZIP downloaded successfully!";

  } catch (error) {

    console.error(error);
    statusText.textContent = "ZIP download failed.";

  } finally {

    zipButton.disabled = false;

  }

});

const googleLoginButton = document.getElementById("google-login");
const googleLogoutButton = document.getElementById("google-logout");
const userInfo = document.getElementById("user-info");

// Google Login
googleLoginButton.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Login Error:", error);
    alert("Google Login failed: " + error.message);
  }
});

// Logout
googleLogoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    alert("Logout failed: " + error.message);
  }
});

// Check Login Status
onAuthStateChanged(auth, (user) => {
  if (user) {
    googleLoginButton.hidden = true;
    googleLogoutButton.hidden = false;
    userInfo.textContent = "Welcome, " + user.displayName;
  } else {
    googleLoginButton.hidden = false;
    googleLogoutButton.hidden = true;
    userInfo.textContent = "";
  }
});

