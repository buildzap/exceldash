// Load the navigation component
document.addEventListener('DOMContentLoaded', function() {
    fetch('components/nav.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            // Remove CDATA tags if present
            data = data.replace('<![CDATA[', '').replace(']]>', '');
            // Insert the navigation at the start of the body
            const firstChild = document.body.firstChild;
            const navElement = document.createElement('div');
            navElement.innerHTML = data;
            document.body.insertBefore(navElement.firstChild, firstChild);
            highlightActiveNavItem();
        })
        .catch(error => {
            console.error('Error loading navigation:', error);
            // Add a visible error message if nav fails to load
            const errorMsg = document.createElement('div');
            errorMsg.style.background = 'red';
            errorMsg.style.color = 'white';
            errorMsg.style.padding = '10px';
            errorMsg.textContent = 'Error loading navigation. Please refresh the page.';
            document.body.insertBefore(errorMsg, document.body.firstChild);
        });
});

// Function to highlight the active navigation item
function highlightActiveNavItem() {
    // Get the current page name from the URL
    let currentPage = window.location.href;
    currentPage = decodeURIComponent(currentPage);  // Handle URL encoding
    currentPage = currentPage.split('\\').pop().split('/').pop() || 'index.html';
    
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Highlight the active link
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}
