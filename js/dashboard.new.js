// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let data = [];
    let headers = [];
    let filteredData = [];
    let charts = {};
    let currentPage = 1;
    const recordsPerPage = 10;

    // Function to parse numeric values safely
    function parseNumericValue(value) {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    // Function to generate sample data if no Excel data is available
    function generateSampleData() {
        const categories = ['Electronics', 'Clothing', 'Food', 'Books', 'Home'];
        const products = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
        const sampleData = [
            ['Category', 'Product', 'Date', 'Sales', 'Units', 'Revenue']
        ];

        // Generate 50 sample records
        for (let i = 0; i < 50; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const product = products[Math.floor(Math.random() * products.length)];
            const date = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
            const units = Math.floor(Math.random() * 100) + 1;
            const sales = Math.floor(Math.random() * 1000) + 100;
            const revenue = sales * units;

            sampleData.push([
                category,
                product,
                date.toISOString().split('T')[0],
                sales,
                units,
                revenue
            ]);
        }
        return sampleData;
    }

    // Function to destroy all existing charts
    function destroyCharts() {
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
    }

    // Function to create or update a single chart
    function createChart(canvasId, config) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error(`Canvas ${canvasId} not found`);
                return null;
            }

            // Destroy existing chart if it exists
            if (charts[canvasId]) {
                charts[canvasId].destroy();
            }

            const ctx = canvas.getContext('2d');
            charts[canvasId] = new Chart(ctx, {
                type: config.type,
                data: config.data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    ...config.options
                }
            });

            return charts[canvasId];
        } catch (error) {
            console.error(`Error creating chart ${canvasId}:`, error);
            return null;
        }
    }

    // Function to update all charts
    function updateCharts() {
        if (!filteredData || filteredData.length === 0) {
            console.warn('No data available for charts');
            return;
        }

        try {
            // Get selected values from control panel
            const xAxisIndex = parseInt(document.getElementById('xAxis')?.value || '0');
            const yAxisIndex = parseInt(document.getElementById('yAxis')?.value || '3');
            const chartType = document.getElementById('chartType')?.value || 'bar';
            const aggregation = document.getElementById('aggregation')?.value || 'sum';

            console.log('Updating charts with:', { xAxisIndex, yAxisIndex, chartType, aggregation });

            // Get unique categories and generate colors
            const categories = [...new Set(filteredData.map(row => row[0]))];
            const getColor = (index, alpha = 0.5) => 
                `hsla(${(360 / categories.length) * index}, 70%, 50%, ${alpha})`;

            // Helper functions
            const aggregate = (data, method) => {
                switch (method) {
                    case 'average':
                        return data.reduce((a, b) => a + b, 0) / data.length;
                    case 'count':
                        return data.length;
                    case 'sum':
                    default:
                        return data.reduce((a, b) => a + b, 0);
                }
            };

            const getAggregatedData = (valueIndex, method = 'sum') => {
                return filteredData.reduce((acc, row) => {
                    const category = row[0];
                    const value = parseNumericValue(row[valueIndex]);
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(value);
                    return acc;
                }, {});
            };

            // 1. Main Chart (Uses control panel settings)
            const mainChartData = getAggregatedData(yAxisIndex);
            createChart('mainChart', {
                type: chartType,
                data: {
                    labels: categories,
                    datasets: [{
                        label: `${headers[yAxisIndex]} by ${headers[xAxisIndex]}`,
                        data: categories.map(cat => aggregate(mainChartData[cat], aggregation)),
                        backgroundColor: categories.map((_, i) => getColor(i)),
                        borderColor: categories.map((_, i) => getColor(i, 1)),
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: `${headers[yAxisIndex]} by ${headers[xAxisIndex]} (${aggregation})`
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            // 2. Sales-Units-Revenue Analysis (Bubble)
            const bubbleData = filteredData.map(row => ({
                x: parseNumericValue(row[3]), // Sales
                y: parseNumericValue(row[4]), // Units
                r: Math.sqrt(parseNumericValue(row[5]) / 1000), // Revenue (scaled)
                category: row[0]
            }));

            createChart('bubbleChart', {
                type: 'bubble',
                data: {
                    datasets: categories.map((category, index) => ({
                        label: category,
                        data: bubbleData.filter(item => item.category === category),
                        backgroundColor: getColor(index, 0.6),
                        borderColor: getColor(index, 1)
                    }))
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Sales vs Units vs Revenue (bubble size)'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Sales'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Units'
                            }
                        }
                    }
                }
            });

            // 3. Category Performance Radar
            const metrics = ['Sales', 'Units', 'Revenue'];
            const metricsData = categories.reduce((acc, category) => {
                const categoryData = filteredData.filter(row => row[0] === category);
                acc[category] = {
                    Sales: aggregate(categoryData.map(row => parseNumericValue(row[3])), 'sum'),
                    Units: aggregate(categoryData.map(row => parseNumericValue(row[4])), 'sum'),
                    Revenue: aggregate(categoryData.map(row => parseNumericValue(row[5])), 'sum')
                };
                return acc;
            }, {});

            createChart('radarChart', {
                type: 'radar',
                data: {
                    labels: categories,
                    datasets: metrics.map((metric, index) => ({
                        label: metric,
                        data: categories.map(cat => metricsData[cat][metric]),
                        backgroundColor: getColor(index, 0.2),
                        borderColor: getColor(index, 1),
                        borderWidth: 2
                    }))
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Category Performance Analysis'
                        }
                    }
                }
            });

            // 4. Revenue Distribution (Doughnut)
            const revenueData = getAggregatedData(5);
            createChart('doughnutChart', {
                type: 'doughnut',
                data: {
                    labels: categories,
                    datasets: [{
                        data: categories.map(cat => aggregate(revenueData[cat], 'sum')),
                        backgroundColor: categories.map((_, i) => getColor(i)),
                        borderColor: categories.map((_, i) => getColor(i, 1)),
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Revenue Distribution by Category'
                        }
                    }
                }
            });

            // 5. Product Category Analysis (Stacked Bar)
            const products = [...new Set(filteredData.map(row => row[1]))];
            const productData = {};
            
            filteredData.forEach(row => {
                const product = row[1];
                const category = row[0];
                const revenue = parseNumericValue(row[5]);
                
                if (!productData[product]) {
                    productData[product] = {};
                }
                if (!productData[product][category]) {
                    productData[product][category] = 0;
                }
                productData[product][category] += revenue;
            });

            createChart('stackedBarChart', {
                type: 'bar',
                data: {
                    labels: products,
                    datasets: categories.map((category, index) => ({
                        label: category,
                        data: products.map(product => productData[product]?.[category] || 0),
                        backgroundColor: getColor(index),
                        borderColor: getColor(index, 1),
                        borderWidth: 1,
                        stack: 'stack0'
                    }))
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Product Performance by Category'
                        }
                    },
                    scales: {
                        x: {
                            stacked: true,
                            title: {
                                display: true,
                                text: 'Products'
                            }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Revenue'
                            }
                        }
                    }
                }
            });

            console.log('All charts updated successfully');
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    // Function to update the data table
    function updateTable() {
        try {
            const tableHeader = document.getElementById('tableHeader');
            const tableBody = document.getElementById('tableBody');
            if (!tableHeader || !tableBody) return;

            // Calculate pagination
            const startIndex = (currentPage - 1) * recordsPerPage;
            const endIndex = Math.min(startIndex + recordsPerPage, filteredData.length);
            const paginatedData = filteredData.slice(startIndex, endIndex);

            // Update header
            tableHeader.innerHTML = headers.map(header => 
                `<th class="text-nowrap">${header}</th>`
            ).join('');

            // Update body
            tableBody.innerHTML = paginatedData.map(row => `
                <tr>
                    ${row.map((cell, index) => {
                        if (index >= 3 && index <= 5) { // Sales, Units, Revenue columns
                            const value = parseNumericValue(cell);
                            return `<td class="text-end">${value.toLocaleString()}</td>`;
                        }
                        return `<td>${cell}</td>`;
                    }).join('')}
                </tr>
            `).join('');

            // Update pagination info
            const elements = {
                currentPage: document.getElementById('currentPage'),
                totalPages: document.getElementById('totalPages'),
                totalRecords: document.getElementById('totalRecords'),
                prevPage: document.getElementById('prevPage'),
                nextPage: document.getElementById('nextPage')
            };

            if (elements.currentPage) elements.currentPage.textContent = startIndex + 1;
            if (elements.totalPages) elements.totalPages.textContent = endIndex;
            if (elements.totalRecords) elements.totalRecords.textContent = filteredData.length;
            if (elements.prevPage) elements.prevPage.disabled = currentPage === 1;
            if (elements.nextPage) elements.nextPage.disabled = endIndex >= filteredData.length;

        } catch (error) {
            console.error('Error updating table:', error);
        }
    }

    // Function to handle control panel changes
    function handleControlChange() {
        console.log('Handling control panel changes...');
        try {
            // Get all control values
            const filters = {
                chartType: document.getElementById('chartType')?.value || 'bar',
                xAxis: parseInt(document.getElementById('xAxis')?.value || '0'),
                yAxis: parseInt(document.getElementById('yAxis')?.value || '3'),
                aggregation: document.getElementById('aggregation')?.value || 'sum',
                category: document.getElementById('categoryFilter')?.value,
                date: document.getElementById('dateFilter')?.value,
                status: document.getElementById('statusFilter')?.value
            };

            console.log('Applied filters:', filters);

            // Reset filtered data
            filteredData = data.slice(1);

            // Apply category filter
            if (filters.category && filters.category !== 'all') {
                filteredData = filteredData.filter(row => row[0] === filters.category);
            }

            // Apply date filter
            if (filters.date && filters.date !== 'all') {
                const today = new Date();
                let startDate = new Date(0);

                switch (filters.date) {
                    case 'today':
                        startDate = new Date(today.setHours(0, 0, 0, 0));
                        break;
                    case 'week':
                        startDate = new Date(today.setDate(today.getDate() - 7));
                        break;
                    case 'month':
                        startDate = new Date(today.setMonth(today.getMonth() - 1));
                        break;
                    case 'year':
                        startDate = new Date(today.setFullYear(today.getFullYear() - 1));
                        break;
                }

                filteredData = filteredData.filter(row => {
                    const rowDate = new Date(row[2]);
                    return rowDate >= startDate;
                });
            }

            // Apply status filter if applicable
            if (filters.status && filters.status !== 'all') {
                filteredData = filteredData.filter(row => {
                    const status = row[row.length - 1]; // Assuming status is the last column
                    return status === filters.status;
                });
            }

            // Reset page to 1 when filters change
            currentPage = 1;

            // Update visualizations with new filtered data
            updateTable();
            updateCharts();

            console.log(`Data filtered: ${filteredData.length} records remaining`);
        } catch (error) {
            console.error('Error in handleControlChange:', error);
            const errorToast = document.getElementById('errorToast');
            const errorMessage = document.getElementById('errorMessage');
            if (errorToast && errorMessage) {
                errorMessage.textContent = 'Error applying changes: ' + error.message;
                new bootstrap.Toast(errorToast).show();
            }
        }
    }

    // Function to initialize filters
    function initializeFilters() {
        try {
            // Initialize control panel
            const xAxis = document.getElementById('xAxis');
            const yAxis = document.getElementById('yAxis');
            if (xAxis && yAxis) {
                headers.forEach((header, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = header;
                    xAxis.appendChild(option.cloneNode(true));
                    yAxis.appendChild(option);
                });
            }

            // Initialize category filter
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                const categories = [...new Set(data.slice(1).map(row => row[0]))];
                categoryFilter.innerHTML = `
                    <option value="all">All Categories</option>
                    ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                `;
            }

            // Add event listeners
            document.getElementById('xAxis')?.addEventListener('change', handleControlChange);
            document.getElementById('yAxis')?.addEventListener('change', handleControlChange);
            document.getElementById('chartType')?.addEventListener('change', handleControlChange);
            document.getElementById('aggregation')?.addEventListener('change', handleControlChange);
            document.getElementById('categoryFilter')?.addEventListener('change', handleControlChange);
            document.getElementById('dateFilter')?.addEventListener('change', handleControlChange);
            document.getElementById('statusFilter')?.addEventListener('change', handleControlChange);

            // Add event listeners for Apply/Clear buttons
            document.getElementById('applyChart')?.addEventListener('click', handleControlChange);
            document.getElementById('clearChart')?.addEventListener('click', () => {
                const chartType = document.getElementById('chartType');
                const xAxis = document.getElementById('xAxis');
                const yAxis = document.getElementById('yAxis');
                const aggregation = document.getElementById('aggregation');
                
                if (chartType) chartType.value = 'bar';
                if (xAxis && xAxis.options.length > 0) xAxis.selectedIndex = 0;
                if (yAxis && yAxis.options.length > 0) yAxis.selectedIndex = 3;
                if (aggregation) aggregation.value = 'sum';
                
                handleControlChange();
            });

            document.getElementById('applyFilters')?.addEventListener('click', handleControlChange);
            document.getElementById('clearFilters')?.addEventListener('click', () => {
                const dateFilter = document.getElementById('dateFilter');
                const categoryFilter = document.getElementById('categoryFilter');
                const statusFilter = document.getElementById('statusFilter');
                
                if (dateFilter) dateFilter.value = 'all';
                if (categoryFilter) categoryFilter.value = 'all';
                if (statusFilter) statusFilter.value = 'all';
                
                handleControlChange();
            });

            // Initialize pagination
            document.getElementById('prevPage')?.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    updateTable();
                }
            });

            document.getElementById('nextPage')?.addEventListener('click', () => {
                if ((currentPage * recordsPerPage) < filteredData.length) {
                    currentPage++;
                    updateTable();
                }
            });

        } catch (error) {
            console.error('Error initializing filters:', error);
        }
    }

    function initializeDashboard() {
        try {
            console.log('Initializing dashboard...');
            const storedData = localStorage.getItem('excelData');

            // Load data
            data = storedData ? JSON.parse(storedData) : generateSampleData();
            headers = data[0];
            filteredData = data.slice(1);

            // Show data source indicator
            if (!storedData) {
                const dataSource = document.getElementById('dataSource');
                if (dataSource) {
                    dataSource.innerHTML = `
                        <div class="alert alert-info alert-dismissible fade show" role="alert">
                            Using sample data. <a href="upload.html" class="alert-link">Upload your Excel file</a> to see your own data.
                            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                        </div>
                    `;
                }
            }

            // Initialize components
            destroyCharts();
            initializeFilters();
            updateTable();
            updateCharts();

            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }

    // Start initialization
    initializeDashboard();
});
