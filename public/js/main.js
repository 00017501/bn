const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

// Function to add copy buttons to all code blocks
function addCopyButtons() {
  // Get all code blocks
  const codeBlocks = document.querySelectorAll('pre code.hljs');
  
  // Loop through each code block
  codeBlocks.forEach((codeBlock, index) => {
    // Create container for code block to allow positioning the button
    const container = document.createElement('div');
    container.style.position = 'relative';
    
    // Move the code block inside the container
    const pre = codeBlock.parentNode;
    pre.parentNode.insertBefore(container, pre);
    container.appendChild(pre);
    
    // Create the copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.className = 'copy-button';
    
    // Style the button
    copyButton.style.position = 'absolute';
    copyButton.style.top = '5px';
    copyButton.style.right = '5px';
    copyButton.style.padding = '3px 8px';
    copyButton.style.fontSize = '12px';
    copyButton.style.backgroundColor = '#f1f1f1';
    copyButton.style.border = '1px solid #ccc';
    copyButton.style.borderRadius = '3px';
    copyButton.style.cursor = 'pointer';
    copyButton.style.zIndex = '1';
    
    // Add the button to the container
    container.appendChild(copyButton);
    
    // Add click event listener to the button
    copyButton.addEventListener('click', () => {
      // Get the code text
      const code = codeBlock.textContent;
      
      // Copy the code to clipboard
      navigator.clipboard.writeText(code).then(() => {
        // Change button text temporarily to indicate success
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.style.backgroundColor = '#4CAF50';
        copyButton.style.color = 'white';
        
        // Revert button text after 2 seconds
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.style.backgroundColor = '#f1f1f1';
          copyButton.style.color = 'black';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        copyButton.textContent = 'Error!';
        copyButton.style.backgroundColor = '#f44336';
        copyButton.style.color = 'white';
        
        setTimeout(() => {
          copyButton.textContent = 'Copy';
          copyButton.style.backgroundColor = '#f1f1f1';
          copyButton.style.color = 'black';
        }, 2000);
      });
    });
  });
}


// Initialize highlight.js for code blocks
document.addEventListener('DOMContentLoaded', (event) => {
  document.querySelectorAll('pre code').forEach((el) => {
    hljs.highlightElement(el);
  });

  setTimeout(addCopyButtons, 100);

});
