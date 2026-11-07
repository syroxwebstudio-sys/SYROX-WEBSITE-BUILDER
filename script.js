
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
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
const saveProjectButton =
  document.getElementById("save-project");
const projectsContainer =
  document.getElementById("projects-container");

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
let editingProjectId = null;
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
  saveProjectButton.disabled = true;
  statusText.textContent = "SYROX AI is creating your website...";

  try {

    generatedHTML = await generateWithAI(finalIdea);

    originalIdea = finalIdea;

    preview.srcdoc = generatedHTML;

    downloadButton.disabled = false;
    zipButton.disabled = false;
    editButton.disabled = false;
    saveProjectButton.disabled = !auth.currentUser;

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
    if (editingProjectId && auth.currentUser) {

  await updateDoc(
    doc(
      db,
      "users",
      auth.currentUser.uid,
      "projects",
      editingProjectId
    ),
    {
      websiteHTML: generatedHTML,
      projectName: ideaInput.value.trim(),
      category: category.value,
      designStyle: designStyle.value,
      colorTheme: colorTheme.value,
      updatedAt: serverTimestamp()
    }
  );

  editingProjectId = null;
  await loadProjects();
}

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
    statusText.textContent = "ZIP download failed: " + error.message;

  } finally {
    zipButton.disabled = false;
  }
});


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
// Load Saved Projects
async function loadProjects() {

  const user = auth.currentUser;

  if (!user) {
    projectsContainer.textContent =
      "Please sign in to view your projects.";
    return;
  }

  projectsContainer.textContent = "Loading projects...";

  try {

    const snapshot = await getDocs(
      collection(db, "users", user.uid, "projects")
    );

    projectsContainer.innerHTML = "";

    if (snapshot.empty) {
      projectsContainer.textContent =
        "No saved projects yet.";
      return;
    }

    snapshot.forEach((projectDoc) => {

      const project = projectDoc.data();

      const card = document.createElement("div");
      card.className = "project-card";

      const title = document.createElement("h3");
      title.textContent = project.projectName || "Untitled Project";

      const categoryText = document.createElement("p");
      categoryText.textContent =
        "Category: " + (project.category || "Not specified");

     // Open Project Button
const openButton = document.createElement("button");
openButton.textContent = "Open Project";

openButton.addEventListener("click", () => {

  const website = project.websiteHTML || "";

  if (!website) {
    alert("Website HTML not found.");
    return;
  }

  generatedHTML = website;

  preview.srcdoc = generatedHTML;

  document.getElementById("preview-section")
    .scrollIntoView({ behavior: "smooth" });

});

// Edit Project Button
const editSavedButton = document.createElement("button");

editSavedButton.textContent = "Edit Project";

editSavedButton.addEventListener("click", () => {

  editingProjectId = projectDoc.id;

  generatedHTML = project.websiteHTML || "";

  if (!generatedHTML) {
    alert("Project HTML not found.");
    return;
  }

  ideaInput.value = project.projectName || "";

  preview.srcdoc = generatedHTML;

  document.getElementById("builder").scrollIntoView({
    behavior: "smooth"
  });

  statusText.textContent = "Saved project loaded. You can edit it now.";

});
// Delete Project Button
const deleteButton = document.createElement("button");
deleteButton.textContent = "Delete Project";

deleteButton.addEventListener("click", async () => {

  const confirmDelete = confirm(
    "Are you sure you want to delete this project?"
  );

  if (!confirmDelete) return;

  try {

    await deleteDoc(
      doc(db, "users", auth.currentUser.uid, "projects", projectDoc.id)
    );

    card.remove();

  } catch (error) {

    console.error(error);
    alert("Delete failed: " + error.message);

  }

});

card.appendChild(title);
card.appendChild(categoryText);
card.appendChild(openButton);
card.appendChild(editSavedButton);
card.appendChild(deleteButton);

projectsContainer.appendChild(card);

    });

  } catch (error) {

    console.error("Load Projects Error:", error);

    projectsContainer.textContent =
      "Unable to load projects: " + error.message;

  }
}
// Check Login Status
onAuthStateChanged(auth, (user) => {

  saveProjectButton.disabled = !user || !generatedHTML;

  if (user) {
    loadProjects();
    
    googleLoginButton.hidden = true;
    googleLogoutButton.hidden = false;
    userInfo.textContent = "Welcome, " + user.displayName;
  } else {
    googleLoginButton.hidden = false;
    googleLogoutButton.hidden = true;
    userInfo.textContent = "";
  }

});


// Save Project to Firestore
saveProjectButton.addEventListener("click", async function () {

  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in with Google first.");
    return;
  }

  if (!generatedHTML) {
    alert("Generate a website first.");
    return;
  }

  saveProjectButton.disabled = true;
  statusText.textContent = "Saving your project...";

  try {
    await addDoc(
      collection(db, "users", user.uid, "projects"),
      {
        projectName: ideaInput.value.trim(),
        websiteHTML: generatedHTML,
        category: category.value,
        designStyle: designStyle.value,
        colorTheme: colorTheme.value,
        createdAt: serverTimestamp()
      }
    );
// Update Existing Saved Project

    statusText.textContent = "Project saved successfully!";

  } catch (error) {
    console.error("Save Error:", error);
    statusText.textContent = "Project save failed: " + error.message;

  } finally {
    saveProjectButton.disabled = !auth.currentUser;
  }

});
