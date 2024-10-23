// Function to initialize the Website Analytics Bar Chart
var websiteBarChart = null;

function initializeWebsiteBarChart(chartData) {
    var ctx = document.getElementById('websiteBarChart').getContext('2d');

    var websiteBarChartData = {
        labels: chartData.labels,  // Monthly labels
        datasets: [
            {
                label: 'Visitors',
                data: chartData.visitors,  // Monthly visitors data
                backgroundColor: 'rgba(54, 162, 235, 0.6)',  // Blue
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: 'Clicks',
                data: chartData.clicks,  // Monthly clicks data
                backgroundColor: 'rgba(75, 192, 192, 0.6)',  // Green
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Comments',
                data: chartData.comments,  // Monthly comments data
                backgroundColor: 'rgba(255, 159, 64, 0.6)',  // Orange
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            },
            {
                label: 'Likes',
                data: chartData.likes,  // Monthly likes data
                backgroundColor: 'rgba(255, 205, 86, 0.6)',  // Yellow
                borderColor: 'rgba(255, 205, 86, 1)',
                borderWidth: 1
            }
        ]
    };

    var config = {
        type: 'bar',
        data: websiteBarChartData,
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: true,  // Stack bars on the x-axis
                    ticks: {
                        color: 'black'  // Set x-axis ticks color to black
                    }
                },
                y: {
                    stacked: true,  // Stack bars on the y-axis
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
                    text: 'Website Interaction Distribution by Month',  // Title text
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

    if (websiteBarChart) {
        websiteBarChart.destroy();
    }

    // Create the chart
    websiteBarChart = new Chart(ctx, config);

    
}

// Fetch data from Django template and initialize chart
document.addEventListener('DOMContentLoaded', function() {
    var chartData = JSON.parse(document.getElementById('website-bar-chart-data').textContent);  // Fetch the JSON from the <script> tag
    initializeWebsiteBarChart(chartData);

    window.addEventListener('resize', function() {
        initializeWebsiteBarChart(chartData);
    });
});
