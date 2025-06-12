document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const cancelBtn = document.getElementById('cancelBtn');
    const generateBtn = document.getElementById('generateBtn');
    const errorToast = document.getElementById('errorToast');
    const errorMessage = document.getElementById('errorMessage');

    let parsedData = null;

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    // Handle file drop
    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle file input change
    fileInput.addEventListener('change', function(e) {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        if (!isValidFile(file)) {
            showError('Please upload a valid file (.xlsx, .xls, .csv, .txt, .ods, .fods, .biff2, .biff3, .biff4, .biff5, .biff8, .wbk, .wks, .wq1, .wq2, .xlk, .xlsb, .xlsm, .xlt, .xltm, .xltx)');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { 
                    type: 'array',
                    cellDates: true, // Parse dates
                    cellNF: true,    // Parse numbers
                    cellText: true,  // Parse text
                    raw: false       // Convert values to their proper types
                });
                
                // Get the first worksheet
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // Convert to JSON
                parsedData = XLSX.utils.sheet_to_json(firstSheet, { 
                    header: 1,
                    defval: '', // Default value for empty cells
                    blankrows: false // Skip empty rows
                });
                
                if (parsedData.length === 0) {
                    showError('The file appears to be empty');
                    return;
                }

                // Clean up the data
                parsedData = cleanData(parsedData);

                // Store data in localStorage
                localStorage.setItem('excelData', JSON.stringify(parsedData));
                
                // Show preview
                showPreview(parsedData);
            } catch (error) {
                console.error('Error parsing file:', error);
                showError('Error parsing file. Please make sure the file is not corrupted and try again.');
            }
        };

        reader.onerror = function() {
            showError('Error reading file. Please try again.');
        };

        reader.readAsArrayBuffer(file);
    }

    function isValidFile(file) {
        const validExtensions = [
            // Excel formats
            'xlsx', 'xls', 'xlsm', 'xlsb', 'xlt', 'xltm', 'xltx',
            // Legacy formats
            'biff2', 'biff3', 'biff4', 'biff5', 'biff8',
            'wbk', 'wks', 'wq1', 'wq2', 'xlk',
            // Other formats
            'csv', 'txt', 'ods', 'fods'
        ];

        const extension = file.name.split('.').pop().toLowerCase();
        return validExtensions.includes(extension);
    }

    function cleanData(data) {
        // Remove empty rows and columns
        return data
            .filter(row => row.some(cell => cell !== '' && cell !== null))
            .map(row => {
                // Find the last non-empty cell
                let lastIndex = row.length - 1;
                while (lastIndex >= 0 && (row[lastIndex] === '' || row[lastIndex] === null)) {
                    lastIndex--;
                }
                // Trim the row to remove trailing empty cells
                return row.slice(0, lastIndex + 1);
            });
    }

    function showPreview(data) {
        // Clear existing table
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';

        // Add headers
        const headers = data[0];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.className = 'text-nowrap'; // Prevent header text wrapping
            tableHeader.appendChild(th);
        });

        // Add rows (limit to 5 rows for preview)
        const previewRows = data.slice(1, 6);
        previewRows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                // Format cell content based on type
                if (typeof cell === 'number') {
                    td.textContent = cell.toLocaleString();
                    td.className = 'text-end'; // Right-align numbers
                } else if (cell instanceof Date) {
                    td.textContent = cell.toLocaleDateString();
                } else {
                    td.textContent = cell;
                }
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        // Show preview section
        previewSection.classList.remove('d-none');
    }

    function showError(message) {
        errorMessage.textContent = message;
        const toast = new bootstrap.Toast(errorToast);
        toast.show();
    }

    // Handle cancel button
    cancelBtn.addEventListener('click', function() {
        previewSection.classList.add('d-none');
        fileInput.value = '';
        parsedData = null;
        localStorage.removeItem('excelData');
    });

    // Handle generate button
    generateBtn.addEventListener('click', function() {
        if (!parsedData) {
            showError('Please upload a file first');
            return;
        }

        // Show loading state
        const originalText = this.innerHTML;
        this.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Generating Dashboard...
        `;
        this.disabled = true;

        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    });
}); 