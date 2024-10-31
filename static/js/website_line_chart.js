// Function to initialize the Line Chart for Website Analytics
var websiteLineChart = null;

function initializeWebsiteLineChart(chartData) {
    var ctx = document.getElementById('websiteLineChart').getContext('2d');

    // Define the color scheme
    var yellowGoldColor = 'rgba(255, 215, 0, 1)';  // Yellow-gold for likes
    var blackColor = 'rgba(0, 0, 0, 1)';           // Black for comments
    var blueColor = 'rgba(54, 162, 235, 1)';       // Blue for visitors
    var greenColor = 'rgba(75, 192, 192, 1)';      // Green for clicks
    var darkGreyTransparent = 'rgba(105, 105, 105, 0.4)';  // Transparent dark grey

    // Use dynamic data from Django's context
    var websiteAnalyticsData = {
        labels: chartData.labels,  // Monthly labels
        datasets: [
            {
                label: 'Visitors',
                data: chartData.visitors,  // Monthly visitors data
                borderColor: blueColor,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',  // Transparent blue
                fill: false,
                tension: 0.4,
                pointBackgroundColor: blueColor,
                pointBorderColor: blackColor,
            },
            {
                label: 'Clicks',
                data: chartData.clicks,  // Monthly clicks data
                borderColor: greenColor,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Transparent green
                fill: false,
                tension: 0.4,
                pointBackgroundColor: greenColor,
                pointBorderColor: blackColor,
            },
            {
                label: 'Likes',
                data: chartData.likes,  // Monthly likes data
                borderColor: yellowGoldColor,
                backgroundColor: 'rgba(255, 215, 0, 0.2)',  // Transparent yellow-gold
                fill: false,
                tension: 0.4,
                pointBackgroundColor: yellowGoldColor,
                pointBorderColor: blackColor,
            },
            {
                label: 'Comments',
                data: chartData.comments,  // Monthly comments data
                borderColor: blackColor,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',  // Transparent black
                fill: false,
                tension: 0.4,
                pointBackgroundColor: blackColor,
                pointBorderColor: yellowGoldColor,
            }
        ]
    };

    // Configuration options
    var config = {
        type: 'line',
        data: websiteAnalyticsData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: blackColor  // Set legend text color to black
                    },
                    position: 'top',
                },
                title: {
                    display: true,  // Enable title
                    text: 'Website Engagement Trends (Monthly Overview)',  // Title text
                    color: blackColor,  // Title color
                    font: {
                        size: 20,  // Set font size
                        family: "'Poppins', sans-serif",  // Set font family
                        weight: 'bold',  // Font weight
                    },
                    padding: {
                        top: 10,
                        bottom: 20  // Padding around the title
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: blackColor  // Set x-axis ticks color to black
                    }
                },
                y: {
                    ticks: {
                        color: blackColor,  // Set y-axis ticks color to black
                        beginAtZero: true
                    }
                }
            },
            layout: {
                padding: 10  // Adjust layout padding
            }
        }
    };

    // Create the chart
    if (websiteLineChart) {
        websiteLineChart.destroy();
    }

    // Create the chart
    websiteLineChart = new Chart(ctx, config);
}

// Fetch data from Django template and initialize chart
// Function to fetch and initialize the Website Analytics chart
document.addEventListener('DOMContentLoaded', function() {
    var chartData = JSON.parse(document.getElementById('website-chart-data').textContent);  // Fetch the data with the correct key
    initializeWebsiteLineChart(chartData);

    window.addEventListener('resize', function() {
        initializeWebsiteLineChart(chartData);
    });
});
