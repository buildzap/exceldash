// Load header component
document.addEventListener('DOMContentLoaded', function() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        // Get the current page's base path
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        
        fetch(basePath + 'components/header.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                headerPlaceholder.innerHTML = data;
                
                // Set active nav item based on current page
                const currentPage = window.location.pathname.split('/').pop() || 'index.html';
                const navLinks = document.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    const linkPage = link.getAttribute('href');
                    if (linkPage === currentPage) {
                        link.classList.add('active');
                    }
                });
            })
            .catch(error => {
                console.error('Error loading header:', error);
                headerPlaceholder.innerHTML = `
                    <nav class="navbar navbar-expand-lg navbar-light bg-white">
                        <div class="container">
                            <a class="navbar-brand" href="index.html">
                                <i class="fas fa-chart-pie text-primary me-2"></i>
                                Excel Dashboard
                            </a>
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                                <span class="navbar-toggler-icon"></span>
                            </button>
                            <div class="collapse navbar-collapse" id="navbarNav">
                                <ul class="navbar-nav ms-auto">
                                    <li class="nav-item">
                                        <a class="nav-link" href="index.html">
                                            <i class="fas fa-home me-1"></i>Home
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="upload.html">
                                            <i class="fas fa-upload me-1"></i>Upload
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="dashboard.html">
                                            <i class="fas fa-chart-line me-1"></i>Dashboard
                                        </a>
                                    </li>
                                    <li class="nav-item">
                                        <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#helpModal">
                                            <i class="fas fa-question-circle me-1"></i>Help
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>
                `;
            });
    }
}); 