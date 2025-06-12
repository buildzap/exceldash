// Load footer component
document.addEventListener('DOMContentLoaded', function() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        // Get the current page's base path
        const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        
        fetch(basePath + 'components/footer.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(data => {
                footerPlaceholder.innerHTML = data;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
                footerPlaceholder.innerHTML = `
                    <footer class="bg-white py-4 mt-5">
                        <div class="container">
                            <div class="row">
                                <div class="col-md-4 mb-3 mb-md-0">
                                    <h5 class="mb-3">Excel Dashboard</h5>
                                    <p class="text-muted mb-0">
                                        Create beautiful, interactive dashboards from your Excel files. No server required.
                                    </p>
                                </div>
                                <div class="col-md-4 mb-3 mb-md-0">
                                    <h5 class="mb-3">Quick Links</h5>
                                    <ul class="list-unstyled">
                                        <li><a href="index.html" class="text-decoration-none text-muted">Home</a></li>
                                        <li><a href="upload.html" class="text-decoration-none text-muted">Upload Excel</a></li>
                                        <li><a href="dashboard.html" class="text-decoration-none text-muted">Dashboard</a></li>
                                        <li><a href="#" class="text-decoration-none text-muted" data-bs-toggle="modal" data-bs-target="#helpModal">Help</a></li>
                                    </ul>
                                </div>
                                <div class="col-md-4">
                                    <h5 class="mb-3">Connect</h5>
                                    <div class="d-flex gap-3">
                                        <a href="#" class="text-muted"><i class="fab fa-github fa-lg"></i></a>
                                        <a href="#" class="text-muted"><i class="fab fa-twitter fa-lg"></i></a>
                                        <a href="#" class="text-muted"><i class="fab fa-linkedin fa-lg"></i></a>
                                    </div>
                                </div>
                            </div>
                            <hr class="my-4">
                            <div class="row align-items-center">
                                <div class="col-md-6 text-center text-md-start">
                                    <p class="text-muted mb-0">
                                        &copy; 2024 Excel Dashboard. All rights reserved.
                                    </p>
                                </div>
                                <div class="col-md-6 text-center text-md-end">
                                    <a href="#" class="text-muted text-decoration-none me-3">Privacy Policy</a>
                                    <a href="#" class="text-muted text-decoration-none">Terms of Service</a>
                                </div>
                            </div>
                        </div>
                    </footer>
                `;
            });
    }
}); 