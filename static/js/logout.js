

document.addEventListener("DOMContentLoaded", function() {
  const logoutButton = document.querySelector(".profile-button");

  logoutButton.addEventListener("click", function(event) {
      event.preventDefault(); 

      // Create the confirmation popup
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

      // Append the popup to the body
      document.body.appendChild(confirmationPopup);

      // Add event listeners to the buttons
      yesButton.addEventListener("click", function() {
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
      });

      noButton.addEventListener("click", function() {
          document.body.removeChild(confirmationPopup);
      });
  });

  function showLoadingAnimation() {
      const loadingOverlay = document.createElement("div");
      loadingOverlay.classList.add("loading-overlay");

      const loadingSpinner = document.createElement("div");
      loadingSpinner.classList.add("loading-spinner");

      loadingOverlay.appendChild(loadingSpinner);
      document.body.appendChild(loadingOverlay);
  }

  function hideLoadingAnimation() {
      const loadingOverlay = document.querySelector(".loading-overlay");
      if (loadingOverlay) {
          document.body.removeChild(loadingOverlay);
      }
  }

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