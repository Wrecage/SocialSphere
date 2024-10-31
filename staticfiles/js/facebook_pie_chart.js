// Function to initialize the Facebook Analytics Pie Chart
var facebookPieChart = null;

function initializeFacebookPieChart(chartData) {
    var ctx = document.getElementById('facebookPieChart').getContext('2d');

    var facebookPieChartData = {
        labels: ['Reactions', 'Comments', 'Shares', 'Page Views'],
        datasets: [{
            data: [chartData.reactions, chartData.comments, chartData.shares, chartData.page_views],
            backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 205, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'],
            borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 205, 86, 1)', 'rgba(75, 192, 192, 1)'],
            borderWidth: 1
        }]
    };

    var config = {
        type: 'pie',
        data: facebookPieChartData,
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
                    text: 'Proportional Distribution of Facebook Engagement',
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

    if (facebookPieChart) {
        facebookPieChart.destroy();
    }

    // Create the chart
    facebookPieChart = new Chart(ctx, config);
}

// Fetch data from Django template and initialize chart
document.addEventListener('DOMContentLoaded', function() {
    var chartData = JSON.parse(document.getElementById('facebook-pie-chart-data').textContent);
    initializeFacebookPieChart(chartData);


    window.addEventListener('resize', function() {
        initializeFacebookPieChart(chartData);
    });
});
