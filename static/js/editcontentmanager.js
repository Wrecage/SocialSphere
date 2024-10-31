document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("confirmation-modal");
    var modalErrorMessage = document.getElementById("modal-error-message");
    var deleteButtons = document.querySelectorAll("#delete-button");
    var closeButton = document.getElementsByClassName("close")[0];
    var cancelButton = document.getElementById("cancel-delete");
    var confirmDeleteBtn = document.getElementById("confirm-delete");
    var spinnerHTML = '<div class="spinner"></div>';
    var loadingContainer = document.querySelector(".loading-container");


    deleteButtons.forEach(function(button) {
        button.onclick = function() {
            modal.style.display = "block";
        }
    });

    if (closeButton) {
        closeButton.onclick = function() {
            modal.style.display = "none";
            modalErrorMessage.style.display = "none";
        }
    }

    if (cancelButton) {
        cancelButton.onclick = function() {
            modal.style.display = "none";
            modalErrorMessage.style.display = "none";
        }
    }

    if (modal) {
        modal.onclick = function(event) {
            if (event.target != this.querySelector('.modal-content') && !this.querySelector('.modal-content').contains(event.target)) {
                event.stopPropagation();
            }
        }
    }

    var confirmDeleteBtn = document.getElementById("confirm-delete");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.onclick = function(event) {
            var password = document.getElementById("confirm-password").value;
            if (password) {
                document.getElementById("password-input").value = password;

                // Show spinner
                confirmDeleteBtn.innerHTML = spinnerHTML;
                confirmDeleteBtn.disabled = true;

                var xhr = new XMLHttpRequest();
                xhr.open("POST", confirmDeleteBtn.closest("form").action, true);
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.onload = function() {
                    console.log("Raw Response: ", xhr.responseText);
                    confirmDeleteBtn.innerHTML = 'Yes';  // Restore button text
                    confirmDeleteBtn.disabled = false;  // Re-enable button
                    if (xhr.status === 200) {
                        try {
                            var response = JSON.parse(xhr.responseText);
                            if (response.success) {
                                window.location.href = response.redirect_url;
                            } else {
                                modalErrorMessage.innerHTML = response.error_message;
                                modalErrorMessage.style.display = "block";
                            }
                        } catch (e) {
                            modalErrorMessage.innerHTML = "Invalid JSON response.";
                            modalErrorMessage.style.display = "block";
                        }
                    } else {
                        modalErrorMessage.innerHTML = "An error occurred. Please try again.";
                        modalErrorMessage.style.display = "block";
                    }
                };
                xhr.send(new URLSearchParams(new FormData(confirmDeleteBtn.closest("form"))).toString());
            } else {
                modalErrorMessage.innerHTML = "Please enter your password.";
                modalErrorMessage.style.display = "block";
            }
        }
    }
});
