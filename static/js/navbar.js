document.addEventListener('DOMContentLoaded', function () {
    const progressBar = document.getElementById('progress-bar');
    let width = 0;

    // Simulated loading progress data
    let loadingProgressData = {
        totalSteps: 100, // Total percentage for full loading
        currentStep: 0
    };

    // Helper function to update progress data
    function updateLoadingData(percentage) {
        loadingProgressData.currentStep = percentage;
        sessionStorage.setItem('loadingProgress', JSON.stringify(loadingProgressData)); // Store in session storage
    }

    // Function to start the loading process
    function startLoading() {
        progressBar.style.width = '0';
        progressBar.style.display = 'block';

        const interval = setInterval(function () {
            if (width >= 90) {
                clearInterval(interval); // Stop at 90%, leave the last bit for actual completion
            } else {
                width = loadingProgressData.currentStep; // Update based on current progress
                progressBar.style.width = width + '%'; // Update progress bar width
            }
        }, 200);  // Adjust this interval for smoother/faster progress
    }

    // Function to complete the loading process
    function completeLoading() {
        progressBar.style.width = '100%';
        setTimeout(function () {
            progressBar.style.display = 'none';  // Hide the bar after a brief pause
        }, 500);
    }

    // Handle both page refresh and initial loading
    function startLoadingOnRefresh() {
        updateLoadingData(0); // Reset progress to 0
        startLoading(); // Trigger loading on page refresh or navigation away
    }

    // Trigger loading on page refresh (when the page starts loading)
    startLoadingOnRefresh();

    // Fetch progress data (simulate or load real data from the server)
    function fetchLoadingData() {
        // Simulate loading progress
        let interval = setInterval(function () {
            let progress = Math.min(loadingProgressData.currentStep + 10, 90); // Increase progress by 10 until 90%
            updateLoadingData(progress); // Store the new progress
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 300); // Adjust interval speed here

        // You can replace this simulation with real fetch data like below:
        /*
        fetch('/api/loading-progress')
            .then(response => response.json())
            .then(data => {
                updateLoadingData(data.percentage); // Update with server-side data
            })
            .catch(error => console.error('Error fetching loading progress:', error));
        */
    }

    // Simulate progress when clicking on navigation links
    document.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            updateLoadingData(0); // Reset progress when navigating
            startLoading();
            fetchLoadingData(); // Simulate or fetch loading data
        });
    });

    // Complete the progress when the page has fully loaded
    window.addEventListener('load', function () {
        completeLoading(); // Finish the progress bar once the page is fully loaded
    });
});
