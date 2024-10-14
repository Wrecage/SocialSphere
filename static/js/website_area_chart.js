// Function to initialize the Website Analytics Stacked Area Chart
var websiteAreaChart = null;

function initializeWebsiteStackedAreaChart(chartData) {
    var ctx = document.getElementById('websiteAreaChart').getContext('2d');

    var websiteAreaChartData = {
        labels: chartData.labels,  // Monthly labels
        datasets: [
            {
                label: 'Visitors',
                data: chartData.visitors,  // Monthly visitors data
                backgroundColor: 'rgba(54, 162, 235, 0.6)',  // Blue
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Clicks',
                data: chartData.clicks,  // Monthly clicks data
                backgroundColor: 'rgba(75, 192, 192, 0.6)',  // Green
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Comments',
                data: chartData.comments,  // Monthly comments data
                backgroundColor: 'rgba(255, 159, 64, 0.6)',  // Orange
                borderColor: 'rgba(255, 159, 64, 1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Likes',
                data: chartData.likes,  // Monthly likes data
                backgroundColor: 'rgba(255, 205, 86, 0.6)',  // Yellow
                borderColor: 'rgba(255, 205, 86, 1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    var config = {
        type: 'line',  // Area chart is a line chart with 'fill' option enabled
        data: websiteAreaChartData,
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: {
                        color: 'black'  // Set x-axis ticks color to black
                    }
                },
                y: {
                    stacked: true,  // Stack areas on the y-axis
                    ticks: {
                        color: 'black',  // Set y-axis ticks color to black
                        beginAtZero: true
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'black'  // Set legend text color to black
                    }
                },
                title: {
                    display: true,
                    text: 'Website Engagement Composition',
                    color: 'black',
                    font: {
                        size: 20,
                        family: "'Poppins', sans-serif",
                        weight: 'bold'
                    }
                }
            }
        }
    };

    if (websiteAreaChart) {
        websiteAreaChart.destroy();
    }


    // Create the chart
    websiteAreaChart = new Chart(ctx, config);
}

// Fetch data from Django template and initialize chart
document.addEventListener('DOMContentLoaded', function() {
    var chartData = JSON.parse(document.getElementById('website-area-chart-data').textContent);  // Fetch the JSON from the <script> tag
    initializeWebsiteStackedAreaChart(chartData);


    window.addEventListener('resize', function() {
        initializeWebsiteStackedAreaChart(chartData);
    });
});
