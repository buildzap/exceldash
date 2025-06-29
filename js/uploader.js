document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const uploadProgress = document.getElementById('uploadProgress');
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
    dropZone.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // Handle file input change
    fileInput.addEventListener('change', function(e) {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        if (!isValidFile(file)) {
            showError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
            return;
        }

        // Reset UI state
        previewSection.classList.add('d-none');
        generateBtn.disabled = true;
        
        // Show and update upload progress
        uploadProgress.classList.remove('d-none');
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        document.getElementById('uploadStatus').textContent = 'Reading file...';
        document.getElementById('percentage').textContent = '0%';
        document.getElementById('progressBar').style.width = '0%';
        
        const reader = new FileReader();
        
        reader.onprogress = function(e) {
            if (e.lengthComputable) {
                const percentLoaded = Math.round((e.loaded / e.total) * 100);
                updateProgress(percentLoaded, 'Reading file...');
            }
        };

        reader.onload = function(e) {
            try {
                updateProgress(100, 'Processing data...');
                
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { 
                    type: 'array',
                    cellDates: true,
                    cellNF: true,
                    cellText: true
                });
                
                // Get the first worksheet
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // Convert to JSON
                parsedData = XLSX.utils.sheet_to_json(firstSheet, { 
                    header: 1,
                    defval: '',
                    blankrows: false
                });
                
                if (parsedData.length === 0) {
                    showError('The file appears to be empty');
                    return;
                }

                // Store data in localStorage
                try {
                    localStorage.setItem('excelData', JSON.stringify(parsedData));
                } catch (e) {
                    showError('The file is too large to process. Please try a smaller file.');
                    return;
                }

                // Update progress and show preview
                updateProgress(100, 'Complete!');
                setTimeout(() => {
                    uploadProgress.classList.add('d-none');
                    showPreview(parsedData);
                }, 500);

            } catch (error) {
                console.error('Error parsing file:', error);
                showError('Error parsing file. Please make sure it\'s a valid Excel file.');
            }
        };

        reader.onerror = function() {
            showError('Error reading file. Please try again.');
        };

        reader.readAsArrayBuffer(file);
    }

    function showPreview(data) {
        // Clear existing preview
        tableHeader.innerHTML = '';
        tableBody.innerHTML = '';

        // Add headers (first row)
        const headers = data[0];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header || '';
            th.scope = 'col';
            tableHeader.appendChild(th);
        });

        // Add first 5 rows of data
        const previewRows = data.slice(1, 6);
        previewRows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = formatCell(cell);
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });

        // Show preview section and enable generate button
        previewSection.classList.remove('d-none');
        generateBtn.disabled = false;
    }

    function formatCell(value) {
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toLocaleDateString();
        if (typeof value === 'number') return value.toLocaleString();
        return value.toString();
    }

    function updateProgress(percent, status) {
        document.getElementById('progressBar').style.width = percent + '%';
        document.getElementById('percentage').textContent = percent + '%';
        if (status) {
            document.getElementById('uploadStatus').textContent = status;
        }
    }

    function isValidFile(file) {
        const validExtensions = ['xlsx', 'xls', 'csv'];
        const extension = file.name.split('.').pop().toLowerCase();
        return validExtensions.includes(extension);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showError(message) {
        errorMessage.textContent = message;
        const toast = new bootstrap.Toast(errorToast);
        toast.show();
        uploadProgress.classList.add('d-none');
    }

    // Handle cancel button
    cancelBtn.addEventListener('click', function() {
        previewSection.classList.add('d-none');
        uploadProgress.classList.add('d-none');
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
        window.location.href = 'dashboard.html';
    });
});
