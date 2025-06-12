document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let data = [];
    let headers = [];
    let filteredData = [];
    let mainChart = null;
    let pieChart = null;
    let trendChart = null;
    let comparisonChart = null;
    let metricsChart = null;
    let currentPage = 1;
    const recordsPerPage = 10;

    // Load data from localStorage
    function loadData() {
        const storedData = localStorage.getItem('excelData');
        if (!storedData) {
            showError('No data found. Please upload a file first.');
            setTimeout(() => {
                window.location.href = 'upload.html';
            }, 2000);
            return;
        }

        data = JSON.parse(storedData);
        headers = data[0];
        filteredData = data.slice(1);

        initializeDashboard();
    }

    // Initialize dashboard components
    function initializeDashboard() {
        populateAxisSelects();
        populateCategoryFilter();
        updateTable();
        updateAllCharts();
    }

    // Populate axis selection dropdowns
    function populateAxisSelects() {
        const xAxisSelect = document.getElementById('xAxis');
        const yAxisSelect = document.getElementById('yAxis');

        xAxisSelect.innerHTML = '';
        yAxisSelect.innerHTML = '';

        headers.forEach((header, index) => {
            const xOption = document.createElement('option');
            xOption.value = index;
            xOption.textContent = header;
            xAxisSelect.appendChild(xOption);

            const yOption = document.createElement('option');
            yOption.value = index;
            yOption.textContent = header;
            yAxisSelect.appendChild(yOption);
        });

        // Set default selections
        if (headers.length > 0) {
            xAxisSelect.value = 0;
            yAxisSelect.value = Math.min(1, headers.length - 1);
        }
    }

    // Populate category filter
    function populateCategoryFilter() {
        const categoryFilter = document.getElementById('categoryFilter');
        const uniqueCategories = [...new Set(filteredData.map(row => row[0]))];
        
        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    // Update the data table with pagination
    function updateTable() {
        const tableHeader = document.getElementById('tableHeader');
        const tableBody = document.getElementById('tableBody');
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const paginatedData = filteredData.slice(startIndex, endIndex);

        // Update header
        tableHeader.innerHTML = headers.map(header => `
            <th>${header}</th>
        `).join('');

        // Update body
        tableBody.innerHTML = paginatedData.map(row => `
            <tr>
                ${row.map(cell => {
                    if (typeof cell === 'number') {
                        return `<td class="text-end">${cell.toLocaleString()}</td>`;
                    } else if (cell instanceof Date) {
                        return `<td>${cell.toLocaleDateString()}</td>`;
                    }
                    return `<td>${cell}</td>`;
                }).join('')}
            </tr>
        `).join('');

        // Update pagination info
        document.getElementById('currentPage').textContent = startIndex + 1;
        document.getElementById('totalPages').textContent = Math.min(endIndex, filteredData.length);
        document.getElementById('totalRecords').textContent = filteredData.length;

        // Update pagination buttons
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = endIndex >= filteredData.length;
    }

    // Update all charts
    function updateAllCharts() {
        updateMainChart();
        updatePieChart();
        updateTrendChart();
        updateComparisonChart();
        updateMetricsChart();
    }

    // Update the main chart
    function updateMainChart() {
        const chartType = document.getElementById('chartType').value;
        const xAxisIndex = parseInt(document.getElementById('xAxis').value);
        const yAxisIndex = parseInt(document.getElementById('yAxis').value);
        const aggregation = document.getElementById('aggregation').value;

        // Group data by x-axis value
        const groupedData = {};
        filteredData.forEach(row => {
            const xValue = row[xAxisIndex];
            const yValue = parseFloat(row[yAxisIndex]);
            
            if (!isNaN(yValue)) {
                if (!groupedData[xValue]) {
                    groupedData[xValue] = [];
                }
                groupedData[xValue].push(yValue);
            }
        });

        // Calculate aggregated values
        const labels = Object.keys(groupedData);
        const values = labels.map(xValue => {
            const numbers = groupedData[xValue];
            switch (aggregation) {
                case 'sum':
                    return numbers.reduce((a, b) => a + b, 0);
                case 'average':
                    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
                case 'count':
                    return numbers.length;
                default:
                    return 0;
            }
        });

        // Destroy existing chart if it exists
        if (mainChart) {
            mainChart.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('mainChart').getContext('2d');
        mainChart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: headers[yAxisIndex],
                    data: values,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: `${headers[yAxisIndex]} by ${headers[xAxisIndex]}`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Update the pie chart
    function updatePieChart() {
        const xAxisIndex = parseInt(document.getElementById('xAxis').value);

        // Count occurrences of each value
        const counts = {};
        filteredData.forEach(row => {
            const value = row[xAxisIndex];
            counts[value] = (counts[value] || 0) + 1;
        });

        // Destroy existing chart if it exists
        if (pieChart) {
            pieChart.destroy();
        }

        // Create new chart
        const ctx = document.getElementById('pieChart').getContext('2d');
        pieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(counts),
                datasets: [{
                    data: Object.values(counts),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: `Distribution of ${headers[xAxisIndex]}`
                    }
                }
            }
        });
    }

    // Update the trend chart
    function updateTrendChart() {
        const xAxisIndex = parseInt(document.getElementById('xAxis').value);
        const yAxisIndex = parseInt(document.getElementById('yAxis').value);

        // Group data by date and calculate moving average
        const groupedData = {};
        filteredData.forEach(row => {
            const date = new Date(row[xAxisIndex]);
            const value = parseFloat(row[yAxisIndex]);
            
            if (!isNaN(value)) {
                const dateKey = date.toISOString().split('T')[0];
                if (!groupedData[dateKey]) {
                    groupedData[dateKey] = [];
                }
                groupedData[dateKey].push(value);
            }
        });

        const dates = Object.keys(groupedData).sort();
        const values = dates.map(date => {
            const numbers = groupedData[date];
            return numbers.reduce((a, b) => a + b, 0) / numbers.length;
        });

        // Calculate moving average
        const movingAverage = [];
        const windowSize = 3;
        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const window = values.slice(start, i + 1);
            movingAverage.push(window.reduce((a, b) => a + b, 0) / window.length);
        }

        if (trendChart) {
            trendChart.destroy();
        }

        const ctx = document.getElementById('trendChart').getContext('2d');
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Actual',
                        data: values,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Moving Average',
                        data: movingAverage,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Update the comparison chart
    function updateComparisonChart() {
        const xAxisIndex = parseInt(document.getElementById('xAxis').value);
        const yAxisIndex = parseInt(document.getElementById('yAxis').value);

        // Group data by category and calculate metrics
        const groupedData = {};
        filteredData.forEach(row => {
            const category = row[xAxisIndex];
            const value = parseFloat(row[yAxisIndex]);
            
            if (!isNaN(value)) {
                if (!groupedData[category]) {
                    groupedData[category] = [];
                }
                groupedData[category].push(value);
            }
        });

        const categories = Object.keys(groupedData);
        const metrics = categories.map(category => {
            const values = groupedData[category];
            return {
                avg: values.reduce((a, b) => a + b, 0) / values.length,
                max: Math.max(...values),
                min: Math.min(...values)
            };
        });

        if (comparisonChart) {
            comparisonChart.destroy();
        }

        const ctx = document.getElementById('comparisonChart').getContext('2d');
        comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'Average',
                        data: metrics.map(m => m.avg),
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Maximum',
                        data: metrics.map(m => m.max),
                        backgroundColor: 'rgba(255, 206, 86, 0.5)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Minimum',
                        data: metrics.map(m => m.min),
                        backgroundColor: 'rgba(153, 102, 255, 0.5)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Update the metrics chart
    function updateMetricsChart() {
        const xAxisIndex = parseInt(document.getElementById('xAxis').value);
        const yAxisIndex = parseInt(document.getElementById('yAxis').value);

        // Calculate performance metrics
        const values = filteredData.map(row => parseFloat(row[yAxisIndex])).filter(v => !isNaN(v));
        const total = values.reduce((a, b) => a + b, 0);
        const avg = total / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length);

        if (metricsChart) {
            metricsChart.destroy();
        }

        const ctx = document.getElementById('metricsChart').getContext('2d');
        metricsChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Total', 'Average', 'Maximum', 'Minimum', 'Std Dev'],
                datasets: [{
                    label: 'Performance Metrics',
                    data: [total, avg, max, min, stdDev],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Apply filters
    function applyFilters() {
        const dateFilter = document.getElementById('dateFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        filteredData = data.slice(1).filter(row => {
            // Apply date filter
            if (dateFilter) {
                const rowDate = new Date(row[headers.indexOf('Date')]);
                const today = new Date();
                switch (dateFilter) {
                    case 'today':
                        if (rowDate.toDateString() !== today.toDateString()) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date(today.setDate(today.getDate() - 7));
                        if (rowDate < weekAgo) return false;
                        break;
                    case 'month':
                        if (rowDate.getMonth() !== today.getMonth()) return false;
                        break;
                    case 'year':
                        if (rowDate.getFullYear() !== today.getFullYear()) return false;
                        break;
                }
            }

            // Apply category filter
            if (categoryFilter && row[0] !== categoryFilter) return false;

            // Apply status filter
            if (statusFilter && row[headers.indexOf('Status')] !== statusFilter) return false;

            // Apply search filter
            if (searchTerm) {
                return row.some(cell => String(cell).toLowerCase().includes(searchTerm));
            }

            return true;
        });

        currentPage = 1;
        updateTable();
    }

    // Show error message
    function showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        const toast = new bootstrap.Toast(document.getElementById('errorToast'));
        toast.show();
    }

    // Clear chart controls
    function clearChartControls() {
        document.getElementById('chartType').value = 'bar';
        document.getElementById('xAxis').value = '0';
        document.getElementById('yAxis').value = '1';
        document.getElementById('aggregation').value = 'sum';
        updateAllCharts();
    }

    // Clear data filters
    function clearDataFilters() {
        document.getElementById('dateFilter').value = 'all';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('searchInput').value = '';
        filteredData = data.slice(1);
        currentPage = 1;
        updateTable();
        updateAllCharts();
    }

    // Event Listeners
    document.getElementById('applyChart').addEventListener('click', updateAllCharts);
    document.getElementById('clearChart').addEventListener('click', clearChartControls);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearDataFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);

    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTable();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        const maxPage = Math.ceil(filteredData.length / recordsPerPage);
        if (currentPage < maxPage) {
            currentPage++;
            updateTable();
        }
    });

    // Export functionality
    document.getElementById('exportCSV').addEventListener('click', function() {
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'dashboard_data.csv';
        link.click();
    });

    document.getElementById('exportExcel').addEventListener('click', function() {
        showError('Excel export functionality will be implemented soon.');
    });

    // Initialize the dashboard
    loadData();
}); 