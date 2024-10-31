document.addEventListener("DOMContentLoaded", function() {
    const logoutButton = document.querySelector(".profile-button");
    let isModalActive = false;  // Flag to track if modal is active

    logoutButton.addEventListener("click", function(event) {
        event.preventDefault(); 
        showLogoutConfirmation();
    });

    /**
     * Show the logout confirmation popup with an overlay.
     */
    function showLogoutConfirmation() {
        isModalActive = true; // Set flag when modal is active

        // Check if the confirmation popup already exists
        if (document.querySelector(".confirmation-popup")) {
            return;  // Do nothing if the popup already exists
        }

        // Create the modal overlay
        const modalOverlay = createModalOverlay();
        document.body.appendChild(modalOverlay);

        // Create the confirmation popup
        const confirmationPopup = createConfirmationPopup();
        document.body.appendChild(confirmationPopup);

        // Add event listeners to the buttons
        handleConfirmationButtons(confirmationPopup, modalOverlay);
    }

    /**
     * Create the modal overlay element.
     * @returns {HTMLElement} The overlay element.
     */
    function createModalOverlay() {
        const overlay = document.createElement("div");
        overlay.classList.add("modal-overlay");
        return overlay;
    }

    /**
     * Create the confirmation popup element.
     * @returns {HTMLElement} The confirmation popup element.
     */
    function createConfirmationPopup() {
        const confirmationPopup = document.createElement("div");
        confirmationPopup.classList.add("confirmation-popup");

        // Create the header
        const header = document.createElement("h2");
        header.textContent = "Logout Confirmation";
        confirmationPopup.appendChild(header);

        // Create the message
        const message = document.createElement("p");
        message.textContent = "Do you really want to log out?";
        confirmationPopup.appendChild(message);

        // Create the buttons
        const yesButton = document.createElement("button");
        yesButton.textContent = "Yes";
        yesButton.classList.add("yes-button");

        const noButton = document.createElement("button");
        noButton.textContent = "No";
        noButton.classList.add("no-button");

        confirmationPopup.appendChild(yesButton);
        confirmationPopup.appendChild(noButton);

        return confirmationPopup;
    }

    /**
     * Handle the click events for the confirmation buttons.
     * @param {HTMLElement} confirmationPopup The confirmation popup element.
     * @param {HTMLElement} modalOverlay The modal overlay element.
     */
    function handleConfirmationButtons(confirmationPopup, modalOverlay) {
        const yesButton = confirmationPopup.querySelector(".yes-button");
        const noButton = confirmationPopup.querySelector(".no-button");

        // Yes button click - perform the logout
        yesButton.addEventListener("click", function() {
            performLogout();
        });

        // No button click - remove the popup and the overlay
        noButton.addEventListener("click", function() {
            document.body.removeChild(confirmationPopup);
            document.body.removeChild(modalOverlay); // Remove the overlay
            isModalActive = false; // Reset the flag when modal is closed
        });
    }

    /**
     * Perform the logout action by sending a POST request.
     */
    function performLogout() {
        showLoadingAnimation();

        // Make the actual logout request using POST
        fetch(logoutButton.href, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': getCookie('csrftoken') // Ensure CSRF token is included
            },
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/events/content_login'; // Redirect to home or desired URL
            } else {
                alert("Logout failed. Please try again.");
                hideLoadingAnimation();
            }
        })
        .catch(error => {
            console.error('Logout error:', error);
            alert("Logout failed. Please check your internet connection and try again.");
            hideLoadingAnimation();
        });
    }

    /**
     * Show the loading animation during logout.
     */
    function showLoadingAnimation() {
        const loadingOverlay = document.createElement("div");
        loadingOverlay.classList.add("loading-overlay");

        const loadingSpinner = document.createElement("div");
        loadingSpinner.classList.add("loading-spinner");

        loadingOverlay.appendChild(loadingSpinner);
        document.body.appendChild(loadingOverlay);
    }

    /**
     * Hide the loading animation after logout.
     */
    function hideLoadingAnimation() {
        const loadingOverlay = document.querySelector(".loading-overlay");
        if (loadingOverlay) {
            document.body.removeChild(loadingOverlay);
        }
    }

    /**
     * Get the CSRF token from the cookie.
     * @param {string} name The name of the cookie.
     * @returns {string|null} The CSRF token value or null if not found.
     */
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});
