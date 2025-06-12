document.addEventListener('DOMContentLoaded', function() {
    // Initialize tool search functionality
    const toolSearch = document.getElementById('toolSearch');
    const toolCards = document.querySelectorAll('.tool-card');

    if (toolSearch && toolCards.length > 0) {
        toolSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            toolCards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                const description = card.querySelector('.card-text').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize toasts
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    toastElList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl);
    });

    // Show welcome toast if it's the user's first visit
    if (!localStorage.getItem('hasVisited')) {
        const welcomeToast = document.getElementById('welcomeToast');
        if (welcomeToast) {
            const toast = new bootstrap.Toast(welcomeToast);
            toast.show();
            localStorage.setItem('hasVisited', 'true');
        }
    }

    // Add smooth scrolling to all links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading spinner to buttons with data-loading attribute
    document.querySelectorAll('[data-loading]').forEach(button => {
        button.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Loading...
            `;
            this.disabled = true;

            // Reset button after 2 seconds (for demo purposes)
            setTimeout(() => {
                this.innerHTML = originalText;
                this.disabled = false;
            }, 2000);
        });
    });
}); 