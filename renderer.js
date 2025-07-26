// const editor = document.getElementById('editor');
// const openBtn = document.getElementById('open-btn');
// const saveBtn = document.getElementById('save-btn');

// let currentFilePath = null;

// // Open File Button
// openBtn.addEventListener('click', () => {
//   window.electronAPI.openFileDialog();
// });

// // Save File Button
// saveBtn.addEventListener('click', () => {
//   const content = editor.innerText;
//   window.electronAPI.saveFileDialog(content);
// });

// // Listen for the 'file-opened' event from the main process
// window.electronAPI.onFileOpened(({ filePath, content }) => {
//   currentFilePath = filePath;
//   editor.innerText = content;
// });

// const lineNumbers = document.getElementById('line-numbers');

// function updateLineNumbers() {
//     const lineCount = editor.innerText.split('\n').length;
//     lineNumbers.innerHTML = Array.from({length: lineCount}, (_, i) => i + 1).join('<br>');
// }

// editor.addEventListener('keyup', updateLineNumbers);
// editor.addEventListener('scroll', () => {
//     lineNumbers.scrollTop = editor.scrollTop;
// });

// function highlightSyntax() {
//     let content = editor.innerText;
//     const highlighted = document.getElementById('highlighted');

//      // Replace < and > to prevent HTML injection
//     content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
//     // Example for JavaScript keywords
//     const keywordRegex = /\b(const|let|var|function|if|else|return|for|while)\b/g;
//     content = content.replace(keywordRegex, '<span class="keyword">$&</span>');

//     // Example for strings (simple version)
//     const stringRegex = /(".*?"|'.*?'|`.*?`)/g;
//     content = content.replace(stringRegex, '<span class="string">$&</span>');
    
// console.log(content);
//     highlighted.innerHTML = content;
//     highlighted.innerText = editor.innerText;
    
// }
// editor.addEventListener('keyup', highlightSyntax);
const openBtn = document.getElementById('open-btn');
const saveBtn = document.getElementById('save-btn');

// Initialize CodeMirror on our textarea element
const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
  lineNumbers: true,        // Feature: Show line numbers
  mode: 'javascript',       // Feature: Use JavaScript syntax highlighting
  theme: 'dracula'          // Feature: Apply the Dracula theme
});

// --- Event Listeners ---
openBtn.addEventListener('click', () => {
  window.electronAPI.openFileDialog();
});

saveBtn.addEventListener('click', () => {
  // Use the CodeMirror API to get the content
  const content = editor.getValue();
  window.electronAPI.saveFileDialog(content);
});

// Listener for when a file is successfully opened by the main process
window.electronAPI.onFileOpened(({ filePath, content }) => {
  // Use the CodeMirror API to set the content
  editor.setValue(content);
});