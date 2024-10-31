// Function to initialize the Facebook Analytics Stacked Area Chart
var facebookAreaChart = null;

function initializeFacebookStackedAreaChart(chartData) {
    var ctx = document.getElementById('facebookAreaChart').getContext('2d');

    var facebookAreaChartData = {
        labels: chartData.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],  // Weekly labels
        datasets: [
            {
                label: 'Reactions',
                data: chartData.reactions_data,  // Weekly reactions data
                backgroundColor: 'rgba(255, 99, 132, 0.6)',  // Red
                borderColor: 'rgba(255, 99, 132, 1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Comments',
                data: chartData.comments_data,  // Weekly comments data
                backgroundColor: 'rgba(54, 162, 235, 0.6)',  // Blue
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Shares',
                data: chartData.shares_data,  // Weekly shares data
                backgroundColor: 'rgba(75, 192, 192, 0.6)',  // Green
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Page Views',
                data: chartData.page_views_data,  // Weekly page views data
                backgroundColor: 'rgba(255, 205, 86, 0.6)',  // Yellow
                borderColor: 'rgba(255, 205, 86, 1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    var config = {
        type: 'line',  // Area chart is a line chart with 'fill' option enabled
        data: facebookAreaChartData,
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
                    text: 'Facebook Engagement Composition',
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

    if (facebookAreaChart) {
        facebookAreaChart.destroy();
    }

    // Create the chart
    facebookAreaChart = new Chart(ctx, config);
}


// Fetch data from Django template and initialize chart
document.addEventListener('DOMContentLoaded', function() {
    var chartData = JSON.parse(document.getElementById('facebook-area-chart-data').textContent);  // Fetch the JSON from the <script> tag
    initializeFacebookStackedAreaChart(chartData);

    window.addEventListener('resize', function() {
        initializeFacebookStackedAreaChart(chartData);
    });
});
