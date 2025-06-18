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
            if (chart) {
                try {
                    chart.destroy();
                } catch (error) {
                    console.warn('Error destroying chart:', error);
                }
            }
        });
        charts = {};
        
        // Clear all canvas contexts
        ['mainChart', 'pieChart', 'trendChart', 'comparisonChart', 'metricsChart', 
         'bubbleChart', 'radarChart', 'doughnutChart', 'stackedBarChart'].forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
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

            // Get unique values and sort data
            const uniqueCategories = [...new Set(filteredData.map(row => row[0]))].sort();
            const uniqueDates = [...new Set(filteredData.map(row => row[2]))].sort();
            const uniqueProducts = [...new Set(filteredData.map(row => row[1]))].sort();

            // Color generator
            const getColor = (index, alpha = 0.5) => 
                `hsla(${(360 / uniqueCategories.length) * index}, 70%, 50%, ${alpha})`;

            // Helper functions
            const aggregate = (data, method) => {
                if (!data || data.length === 0) return 0;
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

            // Update charts
            // 1. Main Chart
            const mainChartData = getAggregatedData(yAxisIndex);
            createChart('mainChart', {
                type: chartType,
                data: {
                    labels: uniqueCategories,
                    datasets: [{
                        label: `${headers[yAxisIndex]} by ${headers[xAxisIndex]}`,
                        data: uniqueCategories.map(cat => aggregate(mainChartData[cat], aggregation)),
                        backgroundColor: uniqueCategories.map((_, i) => getColor(i)),
                        borderColor: uniqueCategories.map((_, i) => getColor(i, 1)),
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

            // 2. Distribution (Pie Chart)
            const distributionData = getAggregatedData(5); // Revenue by default
            createChart('pieChart', {
                type: 'pie',
                data: {
                    labels: uniqueCategories,
                    datasets: [{
                        data: uniqueCategories.map(cat => aggregate(distributionData[cat], 'sum')),
                        backgroundColor: uniqueCategories.map((_, i) => getColor(i)),
                        borderColor: uniqueCategories.map((_, i) => getColor(i, 1)),
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Revenue Distribution by Category'
                        },
                        legend: {
                            position: 'right'
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            // 3. Trend Analysis (Line Chart)
            const dateData = uniqueDates.map(date => {
                const dateRecords = filteredData.filter(row => row[2] === date);
                return {
                    date,
                    revenue: aggregate(dateRecords.map(row => parseNumericValue(row[5])), 'sum'),
                    sales: aggregate(dateRecords.map(row => parseNumericValue(row[3])), 'sum')
                };
            });

            createChart('trendChart', {
                type: 'line',
                data: {
                    labels: uniqueDates,
                    datasets: [
                        {
                            label: 'Revenue',
                            data: dateData.map(d => d.revenue),
                            borderColor: getColor(0, 1),
                            backgroundColor: getColor(0, 0.1),
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Sales',
                            data: dateData.map(d => d.sales),
                            borderColor: getColor(1, 1),
                            backgroundColor: getColor(1, 0.1),
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Revenue and Sales Trend'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Value'
                            }
                        }
                    }
                }
            });

            // 4. Category Comparison
            const compareData = uniqueCategories.map(category => {
                const categoryRecords = filteredData.filter(row => row[0] === category);
                return {
                    category,
                    sales: aggregate(categoryRecords.map(row => parseNumericValue(row[3])), 'sum'),
                    units: aggregate(categoryRecords.map(row => parseNumericValue(row[4])), 'sum'),
                    revenue: aggregate(categoryRecords.map(row => parseNumericValue(row[5])), 'sum')
                };
            });

            createChart('comparisonChart', {
                type: 'bar',
                data: {
                    labels: uniqueCategories,
                    datasets: [
                        {
                            label: 'Sales',
                            data: compareData.map(d => d.sales),
                            backgroundColor: getColor(0, 0.6),
                            borderColor: getColor(0, 1),
                            borderWidth: 1
                        },
                        {
                            label: 'Units',
                            data: compareData.map(d => d.units),
                            backgroundColor: getColor(1, 0.6),
                            borderColor: getColor(1, 1),
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Category Performance Comparison'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Value'
                            }
                        }
                    }
                }
            });

            // 5. Performance Metrics
            createChart('metricsChart', {
                type: 'radar',
                data: {
                    labels: uniqueCategories,
                    datasets: [
                        {
                            label: 'Revenue',
                            data: compareData.map(d => d.revenue),
                            backgroundColor: getColor(0, 0.2),
                            borderColor: getColor(0, 1),
                            borderWidth: 2
                        },
                        {
                            label: 'Sales',
                            data: compareData.map(d => d.sales),
                            backgroundColor: getColor(1, 0.2),
                            borderColor: getColor(1, 1),
                            borderWidth: 2
                        },
                        {
                            label: 'Units',
                            data: compareData.map(d => d.units),
                            backgroundColor: getColor(2, 0.2),
                            borderColor: getColor(2, 1),
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    plugins: {
                        title: {
                            display: true,
                            text: 'Category Performance Metrics'
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true
                        }
                    }
                }
            });

            // Continue with the rest of the chart updates
            // 6. Sales-Units-Revenue Analysis (Bubble)
            const bubbleData = filteredData.map(row => ({
                x: parseNumericValue(row[3]), // Sales
                y: parseNumericValue(row[4]), // Units
                r: Math.sqrt(parseNumericValue(row[5]) / 1000), // Revenue (scaled)
                category: row[0]
            }));

            createChart('bubbleChart', {
                type: 'bubble',
                data: {
                    datasets: uniqueCategories.map((category, index) => ({
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

            // 7. Category Performance Radar
            const metrics = ['Sales', 'Units', 'Revenue'];
            const metricsData = uniqueCategories.reduce((acc, category) => {
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
                    labels: uniqueCategories,
                    datasets: metrics.map((metric, index) => ({
                        label: metric,
                        data: uniqueCategories.map(cat => metricsData[cat][metric]),
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

            // 8. Revenue Distribution (Doughnut)
            const revenueData = getAggregatedData(5);
            createChart('doughnutChart', {
                type: 'doughnut',
                data: {
                    labels: uniqueCategories,
                    datasets: [{
                        data: uniqueCategories.map(cat => aggregate(revenueData[cat], 'sum')),
                        backgroundColor: uniqueCategories.map((_, i) => getColor(i)),
                        borderColor: uniqueCategories.map((_, i) => getColor(i, 1)),
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

            // 9. Product Category Analysis (Stacked Bar)
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
                    datasets: uniqueCategories.map((category, index) => ({
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
        // Destroy existing charts first
        destroyCharts();
        
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

            // Apply status filter if applicable and status column exists
            if (filters.status && filters.status !== 'all' && data[0].length > 6) {
                filteredData = filteredData.filter(row => {
                    const status = row[row.length - 1];
                    return status === filters.status;
                });
            }

            // Reset page to 1 when filters change
            currentPage = 1;        // Update visualizations with new filtered data
        updateTable();
        
        // Update charts with a small delay to ensure DOM is ready
        setTimeout(() => {
            destroyCharts(); // Ensure all charts are properly cleaned up
            updateCharts();
        }, 100);

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

    // === Trend Analysis Axis Filters from Excel Headers ===
    function populateTrendAxisFilter() {
        const trendAxisFilter = document.getElementById('trendAxisFilter');
        if (!trendAxisFilter || !headers || headers.length === 0) return;
        trendAxisFilter.innerHTML = '';
        // X-axis: all columns
        headers.forEach((header, idx) => {
            const xOption = document.createElement('option');
            xOption.value = `x-${idx}`;
            xOption.text = `X: ${header}`;
            trendAxisFilter.appendChild(xOption);
        });
        // Y-axis: only numeric columns (skip 0,1,2 for likely non-numeric)
        headers.forEach((header, idx) => {
            if (idx > 2) {
                const yOption = document.createElement('option');
                yOption.value = `y-${idx}`;
                yOption.text = `Y: ${header}`;
                trendAxisFilter.appendChild(yOption);
            }
        });
        trendAxisFilter.value = 'x-2'; // Default X: Date
    }

    // Listen for changes
    document.getElementById('trendAxisFilter')?.addEventListener('change', updateTrendChartFromFilter);

    function updateTrendChartFromFilter() {
        const trendAxisFilter = document.getElementById('trendAxisFilter');
        if (!trendAxisFilter) return;
        const value = trendAxisFilter.value;
        let xIndex = 2, yIndex = 5; // Defaults: Date vs Revenue
        if (value.startsWith('x-')) xIndex = parseInt(value.split('-')[1]);
        if (value.startsWith('y-')) yIndex = parseInt(value.split('-')[1]);
        // Prepare data
        const xValues = [...new Set(filteredData.map(row => row[xIndex]))].sort();
        const chartData = xValues.map(xVal => {
            const rows = filteredData.filter(row => row[xIndex] === xVal);
            return {
                x: xVal,
                y: rows.reduce((sum, row) => sum + parseNumericValue(row[yIndex]), 0)
            };
        });
        createChart('trendChart', {
            type: 'line',
            data: {
                labels: chartData.map(d => d.x),
                datasets: [{
                    label: `${headers[yIndex]} by ${headers[xIndex]}`,
                    data: chartData.map(d => d.y),
                    borderColor: 'rgba(13,110,253,1)',
                    backgroundColor: 'rgba(13,110,253,0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} by ${headers[xIndex]}`
                    }
                },
                scales: {
                    x: { title: { display: true, text: headers[xIndex] } },
                    y: { beginAtZero: true, title: { display: true, text: headers[yIndex] } }
                }
            }
        });
    }

    // Call after data is loaded
    // In initializeDashboard or after headers/filteredData are set:
    setTimeout(() => {
        populateTrendAxisFilter();
        updateTrendChartFromFilter();
    }, 200);

    // === Trend Analysis Separate X & Y Axis Filters ===
    function populateTrendAxisFilters() {
        const xFilter = document.getElementById('trendXAxisFilter');
        const yFilter = document.getElementById('trendYAxisFilter');
        if (!xFilter || !yFilter || !headers || headers.length === 0) return;
        xFilter.innerHTML = '';
        yFilter.innerHTML = '';
        // X-axis: all columns
        headers.forEach((header, idx) => {
            const xOption = document.createElement('option');
            xOption.value = idx;
            xOption.text = header;
            xFilter.appendChild(xOption);
        });
        // Y-axis: only numeric columns (skip 0,1,2 for likely non-numeric)
        headers.forEach((header, idx) => {
            if (idx > 2) {
                const yOption = document.createElement('option');
                yOption.value = idx;
                yOption.text = header;
                yFilter.appendChild(yOption);
            }
        });
        xFilter.value = 2; // Default X: Date
        yFilter.value = 5; // Default Y: Revenue
    }

    document.getElementById('trendXAxisFilter')?.addEventListener('change', updateTrendChartFromFilters);
    document.getElementById('trendYAxisFilter')?.addEventListener('change', updateTrendChartFromFilters);

    function updateTrendChartFromFilters() {
        const xFilter = document.getElementById('trendXAxisFilter');
        const yFilter = document.getElementById('trendYAxisFilter');
        if (!xFilter || !yFilter) return;
        const xIndex = parseInt(xFilter.value);
        const yIndex = parseInt(yFilter.value);
        const xValues = [...new Set(filteredData.map(row => row[xIndex]))].sort();
        const chartData = xValues.map(xVal => {
            const rows = filteredData.filter(row => row[xIndex] === xVal);
            return {
                x: xVal,
                y: rows.reduce((sum, row) => sum + parseNumericValue(row[yIndex]), 0)
            };
        });
        createChart('trendChart', {
            type: 'line',
            data: {
                labels: chartData.map(d => d.x),
                datasets: [{
                    label: `${headers[yIndex]} by ${headers[xIndex]}`,
                    data: chartData.map(d => d.y),
                    borderColor: 'rgba(13,110,253,1)',
                    backgroundColor: 'rgba(13,110,253,0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} by ${headers[xIndex]}`
                    }
                },
                scales: {
                    x: { title: { display: true, text: headers[xIndex] } },
                    y: { beginAtZero: true, title: { display: true, text: headers[yIndex] } }
                }
            }
        });
    }

    // Call after data is loaded
    setTimeout(() => {
        populateTrendAxisFilters();
        updateTrendChartFromFilters();
    }, 200);

    // === Comparison Chart Separate X & Y Axis Filters ===
    function populateComparisonAxisFilters() {
        const xFilter = document.getElementById('comparisonXAxisFilter');
        const yFilter = document.getElementById('comparisonYAxisFilter');
        if (!xFilter || !yFilter || !headers || headers.length === 0) return;
        xFilter.innerHTML = '';
        yFilter.innerHTML = '';
        // X-axis: all columns
        headers.forEach((header, idx) => {
            const xOption = document.createElement('option');
            xOption.value = idx;
            xOption.text = header;
            xFilter.appendChild(xOption);
        });
        // Y-axis: only numeric columns (skip 0,1,2 for likely non-numeric)
        headers.forEach((header, idx) => {
            if (idx > 2) {
                const yOption = document.createElement('option');
                yOption.value = idx;
                yOption.text = header;
                yFilter.appendChild(yOption);
            }
        });
        xFilter.value = 0; // Default X: Category
        yFilter.value = 3; // Default Y: Sales
    }

    document.getElementById('comparisonXAxisFilter')?.addEventListener('change', updateComparisonChartFromFilters);
    document.getElementById('comparisonYAxisFilter')?.addEventListener('change', updateComparisonChartFromFilters);

    function updateComparisonChartFromFilters() {
        const xFilter = document.getElementById('comparisonXAxisFilter');
        const yFilter = document.getElementById('comparisonYAxisFilter');
        if (!xFilter || !yFilter) return;
        const xIndex = parseInt(xFilter.value);
        const yIndex = parseInt(yFilter.value);
        const xValues = [...new Set(filteredData.map(row => row[xIndex]))].sort();
        const chartData = xValues.map(xVal => {
            const rows = filteredData.filter(row => row[xIndex] === xVal);
            return {
                x: xVal,
                y: rows.reduce((sum, row) => sum + parseNumericValue(row[yIndex]), 0)
            };
        });
        createChart('comparisonChart', {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.x),
                datasets: [{
                    label: `${headers[yIndex]} by ${headers[xIndex]}`,
                    data: chartData.map(d => d.y),
                    backgroundColor: 'rgba(13,110,253,0.6)',
                    borderColor: 'rgba(13,110,253,1)',
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} by ${headers[xIndex]}`
                    }
                },
                scales: {
                    x: { title: { display: true, text: headers[xIndex] } },
                    y: { beginAtZero: true, title: { display: true, text: headers[yIndex] } }
                }
            }
        });
    }

    // Call after data is loaded
    setTimeout(() => {
        populateTrendAxisFilters();
        updateTrendChartFromFilters();
        populateComparisonAxisFilters();
        updateComparisonChartFromFilters();
    }, 200);

    // === Advanced Charts Shared X & Y Axis Filters ===
    function populateAdvancedAxisFilters() {
        const xFilter = document.getElementById('advancedXAxisFilter');
        const yFilter = document.getElementById('advancedYAxisFilter');
        if (!xFilter || !yFilter || !headers || headers.length === 0) return;
        xFilter.innerHTML = '';
        yFilter.innerHTML = '';
        headers.forEach((header, idx) => {
            const xOption = document.createElement('option');
            xOption.value = idx;
            xOption.text = header;
            xFilter.appendChild(xOption);
        });
        headers.forEach((header, idx) => {
            if (idx > 2) {
                const yOption = document.createElement('option');
                yOption.value = idx;
                yOption.text = header;
                yFilter.appendChild(yOption);
            }
        });
        xFilter.value = 0; // Default X: Category
        yFilter.value = 3; // Default Y: Sales
    }

    document.getElementById('advancedXAxisFilter')?.addEventListener('change', updateAdvancedChartsFromFilters);
    document.getElementById('advancedYAxisFilter')?.addEventListener('change', updateAdvancedChartsFromFilters);

    function updateAdvancedChartsFromFilters() {
        const xFilter = document.getElementById('advancedXAxisFilter');
        const yFilter = document.getElementById('advancedYAxisFilter');
        if (!xFilter || !yFilter) return;
        const xIndex = parseInt(xFilter.value);
        const yIndex = parseInt(yFilter.value);
        // --- Performance Metrics Chart ---
        const uniqueX = [...new Set(filteredData.map(row => row[xIndex]))].sort();
        const metricsData = uniqueX.map(xVal => {
            const rows = filteredData.filter(row => row[xIndex] === xVal);
            return rows.reduce((sum, row) => sum + parseNumericValue(row[yIndex]), 0);
        });
        createChart('metricsChart', {
            type: 'radar',
            data: {
                labels: uniqueX,
                datasets: [{
                    label: `${headers[yIndex]} by ${headers[xIndex]}`,
                    data: metricsData,
                    backgroundColor: 'rgba(13,110,253,0.2)',
                    borderColor: 'rgba(13,110,253,1)',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} by ${headers[xIndex]}`
                    }
                },
                scales: { r: { beginAtZero: true } }
            }
        });
        // --- Sales-Units-Revenue Analysis (Bubble) ---
        const bubbleData = filteredData.map(row => ({
            x: parseNumericValue(row[xIndex]),
            y: parseNumericValue(row[yIndex]),
            r: Math.sqrt(parseNumericValue(row[yIndex]) / 1000),
            category: row[xIndex]
        }));
        createChart('bubbleChart', {
            type: 'bubble',
            data: {
                datasets: uniqueX.map((xVal, index) => ({
                    label: xVal,
                    data: bubbleData.filter(item => item.category === xVal),
                    backgroundColor: `hsla(${(360 / uniqueX.length) * index}, 70%, 50%, 0.6)`,
                    borderColor: `hsla(${(360 / uniqueX.length) * index}, 70%, 50%, 1)`
                }))
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} vs ${headers[xIndex]} (bubble size)`
                    }
                },
                scales: {
                    x: { title: { display: true, text: headers[xIndex] } },
                    y: { title: { display: true, text: headers[yIndex] } }
                }
            }
        });
        // --- Category Performance Radar ---
        createChart('radarChart', {
            type: 'radar',
            data: {
                labels: uniqueX,
                datasets: [{
                    label: `${headers[yIndex]} by ${headers[xIndex]}`,
                    data: metricsData,
                    backgroundColor: 'rgba(13,110,253,0.2)',
                    borderColor: 'rgba(13,110,253,1)',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} by ${headers[xIndex]}`
                    }
                },
                scales: { r: { beginAtZero: true } }
            }
        });
        // --- Revenue Distribution (Doughnut) ---
        createChart('doughnutChart', {
            type: 'doughnut',
            data: {
                labels: uniqueX,
                datasets: [{
                    data: metricsData,
                    backgroundColor: uniqueX.map((_, i) => `hsla(${(360 / uniqueX.length) * i}, 70%, 50%, 0.6)`),
                    borderColor: uniqueX.map((_, i) => `hsla(${(360 / uniqueX.length) * i}, 70%, 50%, 1)`),
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} Distribution by ${headers[xIndex]}`
                    }
                }
            }
        });
        // --- Product Category Analysis (Stacked Bar) ---
        const products = [...new Set(filteredData.map(row => row[1]))];
        const productData = {};
        filteredData.forEach(row => {
            const product = row[1];
            const xVal = row[xIndex];
            const yVal = parseNumericValue(row[yIndex]);
            if (!productData[product]) productData[product] = {};
            if (!productData[product][xVal]) productData[product][xVal] = 0;
            productData[product][xVal] += yVal;
        });
        createChart('stackedBarChart', {
            type: 'bar',
            data: {
                labels: products,
                datasets: uniqueX.map((xVal, index) => ({
                    label: xVal,
                    data: products.map(product => productData[product]?.[xVal] || 0),
                    backgroundColor: `hsla(${(360 / uniqueX.length) * index}, 70%, 50%, 0.6)`,
                    borderColor: `hsla(${(360 / uniqueX.length) * index}, 70%, 50%, 1)`,
                    borderWidth: 1,
                    stack: 'stack0'
                }))
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} by Product and ${headers[xIndex]}`
                    }
                },
                scales: {
                    x: { stacked: true, title: { display: true, text: 'Products' } },
                    y: { stacked: true, beginAtZero: true, title: { display: true, text: headers[yIndex] } }
                }
            }
        });
    }

    // Call after data is loaded
    setTimeout(() => {
        populateTrendAxisFilters();
        updateTrendChartFromFilters();
        populateComparisonAxisFilters();
        updateComparisonChartFromFilters();
        populateAdvancedAxisFilters();
        updateAdvancedChartsFromFilters();
    }, 200);

    // === Individual X & Y Axis Filters for Advanced Charts ===
    function populateIndividualAdvancedAxisFilters() {
        const filterPairs = [
            { x: 'metricsXAxisFilter', y: 'metricsYAxisFilter' },
            { x: 'bubbleXAxisFilter', y: 'bubbleYAxisFilter' },
            { x: 'radarXAxisFilter', y: 'radarYAxisFilter' },
            { x: 'doughnutXAxisFilter', y: 'doughnutYAxisFilter' },
            { x: 'stackedBarXAxisFilter', y: 'stackedBarYAxisFilter' }
        ];
        filterPairs.forEach(({ x, y }) => {
            const xFilter = document.getElementById(x);
            const yFilter = document.getElementById(y);
            if (!xFilter || !yFilter || !headers || headers.length === 0) return;
            xFilter.innerHTML = '';
            yFilter.innerHTML = '';
            headers.forEach((header, idx) => {
                const xOption = document.createElement('option');
                xOption.value = idx;
                xOption.text = header;
                xFilter.appendChild(xOption);
            });
            headers.forEach((header, idx) => {
                if (idx > 2) {
                    const yOption = document.createElement('option');
                    yOption.value = idx;
                    yOption.text = header;
                    yFilter.appendChild(yOption);
                }
            });
            xFilter.value = 0;
            yFilter.value = 3;
        });
    }

    function addIndividualAdvancedAxisListeners() {
        const chartConfigs = [
            { x: 'metricsXAxisFilter', y: 'metricsYAxisFilter', update: updateMetricsChartFromFilters },
            { x: 'bubbleXAxisFilter', y: 'bubbleYAxisFilter', update: updateBubbleChartFromFilters },
            { x: 'radarXAxisFilter', y: 'radarYAxisFilter', update: updateRadarChartFromFilters },
            { x: 'doughnutXAxisFilter', y: 'doughnutYAxisFilter', update: updateDoughnutChartFromFilters },
            { x: 'stackedBarXAxisFilter', y: 'stackedBarYAxisFilter', update: updateStackedBarChartFromFilters }
        ];
        chartConfigs.forEach(({ x, y, update }) => {
            document.getElementById(x)?.addEventListener('change', update);
            document.getElementById(y)?.addEventListener('change', update);
        });
    }

    function updateMetricsChartFromFilters() {
        const xFilter = document.getElementById('metricsXAxisFilter');
        const yFilter = document.getElementById('metricsYAxisFilter');
        if (!xFilter || !yFilter) return;
        const xIndex = parseInt(xFilter.value);
        const yIndex = parseInt(yFilter.value);
        const uniqueX = [...new Set(filteredData.map(row => row[xIndex]))].sort();
        const metricsData = uniqueX.map(xVal => {
            const rows = filteredData.filter(row => row[xIndex] === xVal);
            return rows.reduce((sum, row) => sum + parseNumericValue(row[yIndex]), 0);
        });
        createChart('metricsChart', {
            type: 'radar',
            data: {
                labels: uniqueX,
                datasets: [{
                    label: `${headers[yIndex]} by ${headers[xIndex]}`,
                    data: metricsData,
                    backgroundColor: 'rgba(13,110,253,0.2)',
                    borderColor: 'rgba(13,110,253,1)',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} by ${headers[xIndex]}`
                    }
                },
                scales: { r: { beginAtZero: true } }
            }
        });
    }

    function updateBubbleChartFromFilters() {
        const xFilter = document.getElementById('bubbleXAxisFilter');
        const yFilter = document.getElementById('bubbleYAxisFilter');
        if (!xFilter || !yFilter) return;
        const xIndex = parseInt(xFilter.value);
        const yIndex = parseInt(yFilter.value);
        const uniqueX = [...new Set(filteredData.map(row => row[xIndex]))].sort();
        const bubbleData = filteredData.map(row => ({
            x: parseNumericValue(row[xIndex]),
            y: parseNumericValue(row[yIndex]),
            r: Math.sqrt(parseNumericValue(row[yIndex]) / 1000),
            category: row[xIndex]
        }));
        createChart('bubbleChart', {
            type: 'bubble',
            data: {
                datasets: uniqueX.map((xVal, index) => ({
                    label: xVal,
                    data: bubbleData.filter(item => item.category === xVal),
                    backgroundColor: `hsla(${(360 / uniqueX.length) * index}, 70%, 50%, 0.6)`,
                    borderColor: `hsla(${(360 / uniqueX.length) * index}, 70%, 50%, 1)`
                }))
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} vs ${headers[xIndex]} (bubble size)`
                    }
                },
                scales: {
                    x: { title: { display: true, text: headers[xIndex] } },
                    y: { title: { display: true, text: headers[yIndex] } }
                }
            }
        });
    }

    function updateRadarChartFromFilters() {
        const xFilter = document.getElementById('radarXAxisFilter');
        const yFilter = document.getElementById('radarYAxisFilter');
        if (!xFilter || !yFilter) return;
        const xIndex = parseInt(xFilter.value);
        const yIndex = parseInt(yFilter.value);
        const uniqueX = [...new Set(filteredData.map(row => row[xIndex]))].sort();
        const metricsData = uniqueX.map(xVal => {
            const rows = filteredData.filter(row => row[xIndex] === xVal);
            return rows.reduce((sum, row) => sum + parseNumericValue(row[yIndex]), 0);
        });
        createChart('radarChart', {
            type: 'radar',
            data: {
                labels: uniqueX,
                datasets: [{
                    label: `${headers[yIndex]} by ${headers[xIndex]}`,
                    data: metricsData,
                    backgroundColor: 'rgba(13,110,253,0.2)',
                    borderColor: 'rgba(13,110,253,1)',
                    borderWidth: 2
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} by ${headers[xIndex]}`
                    }
                },
                scales: { r: { beginAtZero: true } }
            }
        });
    }

    function updateDoughnutChartFromFilters() {
        const xFilter = document.getElementById('doughnutXAxisFilter');
        const yFilter = document.getElementById('doughnutYAxisFilter');
        if (!xFilter || !yFilter) return;
        const xIndex = parseInt(xFilter.value);
        const yIndex = parseInt(yFilter.value);
        const uniqueX = [...new Set(filteredData.map(row => row[xIndex]))].sort();
        const metricsData = uniqueX.map(xVal => {
            const rows = filteredData.filter(row => row[xIndex] === xVal);
            return rows.reduce((sum, row) => sum + parseNumericValue(row[yIndex]), 0);
        });
        createChart('doughnutChart', {
            type: 'doughnut',
            data: {
                labels: uniqueX,
                datasets: [{
                    data: metricsData,
                    backgroundColor: uniqueX.map((_, i) => `hsla(${(360 / uniqueX.length) * i}, 70%, 50%, 0.6)`),
                    borderColor: uniqueX.map((_, i) => `hsla(${(360 / uniqueX.length) * i}, 70%, 50%, 1)`),
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} Distribution by ${headers[xIndex]}`
                    }
                }
            }
        });
    }

    function updateStackedBarChartFromFilters() {
        const xFilter = document.getElementById('stackedBarXAxisFilter');
        const yFilter = document.getElementById('stackedBarYAxisFilter');
        if (!xFilter || !yFilter) return;
        const xIndex = parseInt(xFilter.value);
        const yIndex = parseInt(yFilter.value);
        const uniqueX = [...new Set(filteredData.map(row => row[xIndex]))].sort();
        const products = [...new Set(filteredData.map(row => row[1]))];
        const productData = {};
        filteredData.forEach(row => {
            const product = row[1];
            const xVal = row[xIndex];
            const yVal = parseNumericValue(row[yIndex]);
            if (!productData[product]) productData[product] = {};
            if (!productData[product][xVal]) productData[product][xVal] = 0;
            productData[product][xVal] += yVal;
        });
        createChart('stackedBarChart', {
            type: 'bar',
            data: {
                labels: products,
                datasets: uniqueX.map((xVal, index) => ({
                    label: xVal,
                    data: products.map(product => productData[product]?.[xVal] || 0),
                    backgroundColor: `hsla(${(360 / uniqueX.length) * index}, 70%, 50%, 0.6)`,
                    borderColor: `hsla(${(360 / uniqueX.length) * index}, 70%, 50%, 1)`,
                    borderWidth: 1,
                    stack: 'stack0'
                }))
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: `${headers[yIndex]} by Product and ${headers[xIndex]}`
                    }
                },
                scales: {
                    x: { stacked: true, title: { display: true, text: 'Products' } },
                    y: { stacked: true, beginAtZero: true, title: { display: true, text: headers[yIndex] } }
                }
            }
        });
    }

    // Call after data is loaded
    setTimeout(() => {
        populateTrendAxisFilters();
        updateTrendChartFromFilters();
        populateComparisonAxisFilters();
        updateComparisonChartFromFilters();
        populateIndividualAdvancedAxisFilters();
        addIndividualAdvancedAxisListeners();
        updateMetricsChartFromFilters();
        updateBubbleChartFromFilters();
        updateRadarChartFromFilters();
        updateDoughnutChartFromFilters();
        updateStackedBarChartFromFilters();
    }, 200);

    function initializeDashboard() {
        try {
            console.log('Initializing dashboard...');
            // Clear any existing charts first
            destroyCharts();
            
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
