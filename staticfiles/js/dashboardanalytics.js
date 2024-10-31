function setupAnalyticsDropdown(dropdownId, websiteAnalyticsId, facebookAnalyticsId) {
    var dropdown = document.getElementById(dropdownId);
    if (dropdown) {
        dropdown.addEventListener('change', function() {
            var selectedValue = this.value;
            var websiteAnalytics = document.getElementById(websiteAnalyticsId);
            var facebookAnalytics = document.getElementById(facebookAnalyticsId);

            if (selectedValue === 'facebook') {
                if (websiteAnalytics) websiteAnalytics.style.display = 'none';
                if (facebookAnalytics) facebookAnalytics.style.display = 'block';
            } else {
                if (websiteAnalytics) websiteAnalytics.style.display = 'block';
                if (facebookAnalytics) facebookAnalytics.style.display = 'none';
            }
        });
    }
}

// Initialize the dropdown when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the analytics dropdown for the specified IDs
    setupAnalyticsDropdown('analyticsDropdown', 'website-analytics', 'facebook-analytics');
});