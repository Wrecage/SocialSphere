// Function to initialize the Facebook Line Chart
var facebookLineChart = null;

function initializeFacebookLineChart(chartData) {
    var ctx = document.getElementById('facebookLineChart').getContext('2d');

    var facebookChartData = {
        labels: chartData.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],  // Weekly labels
        datasets: [
            {
                label: 'Total Reactions',
                data: chartData.reactions_data,  // Weekly reactions data
                borderColor: 'rgba(255, 99, 132, 1)',  // Red for reactions
                backgroundColor: 'rgba(255, 99, 132, 0.2)',  // Transparent red
                fill: false,
                tension: 0.4,
            },
            {
                label: 'Total Comments',
                data: chartData.comments_data,  // Weekly comments data
                borderColor: 'rgba(54, 162, 235, 1)',  // Blue for comments
                backgroundColor: 'rgba(54, 162, 235, 0.2)',  // Transparent blue
                fill: false,
                tension: 0.4,
            },
            {
                label: 'Total Shares',
                data: chartData.shares_data,  // Weekly shares data
                borderColor: 'rgba(75, 192, 192, 1)',  // Green for shares
                backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Transparent green
                fill: false,
                tension: 0.4,
            },
            {
                label: 'Total Page Views',
                data: chartData.page_views_data,  // Weekly page views data
                borderColor: 'rgba(153, 102, 255, 1)',  // Purple for page views
                backgroundColor: 'rgba(153, 102, 255, 0.2)',  // Transparent purple
                fill: false,
                tension: 0.4,
            }
        ]
    };

    var config = {
        type: 'line',
        data: facebookChartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'black'  // Set legend text color to black
                    },
                    position: 'top',
                },
                title: {
                    display: true,  // Enable title
                    text: 'Facebook Engagement Over Time (Weekly)',  // Title text
                    color: 'black',  // Title color
                    font: {
                        size: 20,  // Set font size
                        family: "'Poppins', sans-serif",  // Set font family
                        weight: 'bold',  // Font weight
                    },
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'black'  // Set x-axis ticks color to black
                    }
                },
                y: {
                    ticks: {
                        color: 'black',  // Set y-axis ticks color to black
                        beginAtZero: true
                    }
                }
            }
        }
    };

    if (facebookLineChart) {
        facebookLineChart.destroy();
    }

    // Create the chart
    facebookLineChart = new Chart(ctx, config);
}

// Fetch data from Django template and initialize chart
document.addEventListener('DOMContentLoaded', function() {
    var chartData = JSON.parse(document.getElementById('facebook-chart-data').textContent);  // Fetch the JSON from the <script> tag
    initializeFacebookLineChart(chartData);


    window.addEventListener('resize', function() {
        initializeFacebookLineChart(chartData);
    });
});
