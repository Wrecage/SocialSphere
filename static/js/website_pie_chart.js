// Function to initialize the Website Analytics Pie Chart
var websitePieChart = null;

function initializeWebsitePieChart(chartData) {
    var ctx = document.getElementById('websitePieChart').getContext('2d');

    var websitePieChartData = {
        labels: ['Visitors', 'Clicks', 'Comments', 'Likes'],
        datasets: [{
            data: [chartData.visitors, chartData.clicks, chartData.comments, chartData.likes],
            backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 205, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'],
            borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 205, 86, 1)', 'rgba(75, 192, 192, 1)'],
            borderWidth: 1
        }]
    };

    var config = {
        type: 'pie',
        data: websitePieChartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'black'  // Set legend text color to black
                    }
                },
                title: {
                    display: true,
                    text: 'Proportional Distribution of Website Engagement',
                    color: 'black',
                    font: {
                        size: 18,
                        family: "'Poppins', sans-serif",
                        weight: 'bold'
                    }
                }
            }
        }
    };

    if (websitePieChart) {
        websitePieChart.destroy();
    }

    // Create the chart
    websitePieChart = new Chart(ctx, config);
}

// Fetch data from Django template and initialize chart
document.addEventListener('DOMContentLoaded', function() {
    var chartData = JSON.parse(document.getElementById('website-pie-chart-data').textContent);
    initializeWebsitePieChart(chartData);


    window.addEventListener('resize', function() {
        initializeWebsitePieChart(chartData);
    });
});
