// Function to initialize the Facebook Analytics Bar Chart
var facebookBarChart = null;

function initializeFacebookBarChart(chartData) {
    var ctx = document.getElementById('facebookBarChart').getContext('2d');

    var facebookBarChartData = {
        labels: chartData.labels || ['Week 1', 'Week 2', 'Week 3', 'Week 4'],  // Weekly labels
        datasets: [
            {
                label: 'Reactions',
                data: chartData.reactions_data,  // Weekly reactions data
                backgroundColor: 'rgba(255, 99, 132, 0.6)',  // Red
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            },
            {
                label: 'Comments',
                data: chartData.comments_data,  // Weekly comments data
                backgroundColor: 'rgba(54, 162, 235, 0.6)',  // Blue
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            },
            {
                label: 'Shares',
                data: chartData.shares_data,  // Weekly shares data
                backgroundColor: 'rgba(75, 192, 192, 0.6)',  // Green
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Page Views',
                data: chartData.page_views_data,  // Weekly page views data
                backgroundColor: 'rgba(255, 205, 86, 0.6)',  // Yellow
                borderColor: 'rgba(255, 205, 86, 1)',
                borderWidth: 1
            }
        ]
    };

    var config = {
        type: 'bar',
        data: facebookBarChartData,
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: {
                        color: 'black'  // Set x-axis ticks color to black
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'black'  // Set y-axis ticks color to black
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
                    text: 'Facebook Interaction Distribution by Week',
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

    if (facebookBarChart) {
        facebookBarChart.destroy();
    }

    // Create the chart
    facebookBarChart = new Chart(ctx, config);
}

// Fetch data from Django template and initialize chart
document.addEventListener('DOMContentLoaded', function() {
    var chartData = JSON.parse(document.getElementById('facebook-bar-chart-data').textContent);  // Fetch the JSON from the <script> tag
    initializeFacebookBarChart(chartData);


    window.addEventListener('resize', function() {
        initializeFacebookBarChart(chartData);
    });
});
