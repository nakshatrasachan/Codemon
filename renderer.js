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

// Listen for the 'file-opened' event from the main process
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
const openFolderBtn = document.getElementById('open-folder-btn');
const fileTree = document.getElementById('file-tree');
const tabBar = document.getElementById('tab-bar');

// Initialize CodeMirror on our textarea element
const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
  lineNumbers: true,        // Feature: Show line numbers      // Feature: Use JavaScript syntax highlighting
  theme: 'dracula'          // Feature: Apply the Dracula theme
});
// Add this listener after you initialize CodeMirror
editor.on('change', () => {
    if (activeTab && openTabs[activeTab]) {
        // When content changes, mark the tab as not saved
        if (openTabs[activeTab].isSaved) {
            openTabs[activeTab].isSaved = false;
            updateTabIndicator(activeTab);
        }
    }
});
// --- Event Listeners ---
openBtn.addEventListener('click', () => {
  window.electronAPI.openFileDialog();
});

saveBtn.addEventListener('click', () => {
  // Use the CodeMirror API to get the content
  if (activeTab) {
    const content = editor.getValue();
    window.electronAPI.saveFile(activeTab, content); // Send path and content
    openTabs[activeTab].isSaved = true;
    updateTabIndicator(activeTab);
  }
});

openFolderBtn.addEventListener('click', () => {
    window.electronAPI.openFolderDialog();
});
// Listener for when a file is successfully opened by the main process
window.electronAPI.onFileOpened(({ filePath, content }) => {
  // Use the CodeMirror API to set the content
  console.log("Reached onFileOpened");
  createTab(filePath, content);
});

// Function to recursively render the file tree
function renderFileTree(structure, container) {
    const ul = document.createElement('ul');
    for (const item of structure) {
        const li = document.createElement('li');
        li.innerText = item.name;
        
        if (item.type === 'folder') {
            li.style.fontWeight = 'bold';
            // If the folder has children, render them recursively
            if (item.children && item.children.length > 0) {
                renderFileTree(item.children, li);
            }
        } else {
            li.classList.add('file-item');
            li.dataset.filePath = item.path; // Store file path in a data attribute
            
            // Add click listener to open the file
            li.addEventListener('click', (event) => {
                const filePath = event.target.dataset.filePath;
                // We need to ask the main process to read the file
                window.electronAPI.openFile(filePath);
            });
        }
        ul.appendChild(li);
    }
    container.appendChild(ul);
}

// Listen for the 'directory-opened' event from the main process
window.electronAPI.onDirectoryOpened((structure) => {
    fileTree.innerHTML = ''; // Clear the existing tree
    renderFileTree(structure, fileTree);
});

// Add this function at the top of your renderer.js
function getModeForFilePath(filePath) {
    const extension = filePath.split('.').pop().toLowerCase();
    const modeMap = {
        'js': 'javascript',
        'html': 'xml', // CodeMirror uses 'xml' mode for HTML
        'css': 'css',
        'md': 'markdown',
        'py': 'python',
        'java': 'text/x-java',
        'json': {name: 'javascript', json: true}
    };
    return modeMap[extension] || 'text/plain'; // Default to plain text
}
// --- State Management for Tabs ---
let openTabs = {}; // Use file path as the key
let activeTab = null; // Path of the currently active tab

// --- Main Tab Functions ---
function createTab(filePath, content) {
    if (openTabs[filePath]) {
        // Tab already exists, just switch to it
        switchTab(filePath);
        return;
    }
    console.log("create tab function reached")
    // Store tab data
    openTabs[filePath] = {
        path: filePath,
        content: content,
        editorState: null,// To store scroll position, etc.
        isSaved: true
    };
    
    // Create the tab element
    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.innerText = filePath.split('\\').pop().split('/').pop(); // Get filename
    tabElement.dataset.filePath = filePath;
    const unsavedDot = document.createElement('span');
    unsavedDot.className = 'unsaved-dot';
    tabElement.appendChild(unsavedDot);
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.innerText = 'x';
    closeBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent tab switch when closing
        closeTab(filePath);
    });
    tabElement.appendChild(closeBtn);
    
    // Add click listener to switch to this tab
    tabElement.addEventListener('click', () => switchTab(filePath));
    
    tabBar.appendChild(tabElement);
    switchTab(filePath);
}

function switchTab(filePath) {
    if (!openTabs[filePath]) return;

    // Save current editor state before switching
    if (activeTab && openTabs[activeTab]) {
        openTabs[activeTab].editorState = editor.getDoc().copy();
    }
    
    activeTab = filePath;
    
    // Update UI
    document.querySelectorAll('.tab').forEach(t => {
        if (t.dataset.filePath === filePath) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });
    
    // Load new content into the editor
    const tabData = openTabs[filePath];
    if (tabData.editorState) {
        editor.swapDoc(tabData.editorState);
    } else {
        editor.setValue(tabData.content);
    }
    
    // Set syntax highlighting for the new tab
    const newMode = getModeForFilePath(filePath);
    editor.setOption("mode", newMode);
    console.log("Switched to tab:", filePath, "with mode:", newMode);
    updateTabIndicator(filePath);
    editor.focus();
}

function closeTab(filePath) {
    if (!openTabs[filePath]) return;

    // Remove tab from state
    delete openTabs[filePath];
    
    // Remove tab element from UI
    const tabElement = document.querySelector(`.tab[data-file-path="${filePath.replace(/\\/g, '\\\\')}"]`);
    if (tabElement) {
        tabBar.removeChild(tabElement);
    }
    
    // If the closed tab was active, switch to another tab or clear the editor
    if (activeTab === filePath) {
        const remainingTabs = Object.keys(openTabs);
        if (remainingTabs.length > 0) {
            switchTab(remainingTabs[0]);
        } else {
            editor.setValue('');
            activeTab = null;
        }
    }
}

// Add this new helper function in renderer.js
function updateTabIndicator(filePath) {
    const tabElement = document.querySelector(`.tab[data-file-path="${filePath.replace(/\\/g, '\\\\')}"]`);
    if (tabElement && openTabs[filePath]) {
        if (openTabs[filePath].isSaved) {
            tabElement.classList.remove('dirty');
        } else {
            tabElement.classList.add('dirty');
        }
    }
}