
const generateButton = document.getElementById("generate");
const ideaInput = document.getElementById("idea");
const statusText = document.getElementById("status");
const preview = document.getElementById("website-preview");

generateButton.addEventListener("click", function() {

  const idea = ideaInput.value.trim();

  if (idea === "") {
    statusText.textContent = "Please enter your website idea.";
    return;
  }

  const safeIdea = idea.replace(/[&<>"']/g, function(char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char];
  });

  const website = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport"
        content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: Arial;
          text-align: center;
          padding: 70px 15px;
          background: #f7f9fc;
          color: #172033;
        }
        h1 { color: #2878ed; }
        .card {
          background: white;
          padding: 30px;
          border-radius: 15px;
          max-width: 500px;
          margin: auto;
          box-shadow: 0 5px 20px #0001;
        }
        button {
          background: #2878ed;
          color: white;
          padding: 12px 25px;
          border: 0;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Welcome to Our Website</h1>
        <p>Website created from your idea:</p>
        <h3>${safeIdea}</h3>
        <button>Contact Us</button>
      </div>
    </body>
    </html>
  `;

  preview.srcdoc = website;

  statusText.textContent = "Website preview generated!";
});
const downloadButton =
  document.getElementById("download-website");

downloadButton.addEventListener("click", function() {

  const idea = ideaInput.value.trim();

  if (!idea || !preview.srcdoc) {
    statusText.textContent =
      "Please generate a website first.";
    return;
  }

  const blob = new Blob(
    [preview.srcdoc],
    { type: "text/html" }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "syrox-website.html";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  statusText.textContent = "Website downloaded!";
});
