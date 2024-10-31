document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("confirmation-modal");
    var btn = document.getElementById("delete-button");
    var span = document.getElementsByClassName("close")[0];
    var cancelBtn = document.getElementById("cancel-delete");
    var modalErrorMessage = document.getElementById("modal-error-message");
    var confirmDeleteSection = document.getElementById("confirm-delete-section"); // For confirmation content
    var confirmDeleteBtn = document.getElementById("confirm-delete");
    var checkboxes = document.querySelectorAll('input[type="checkbox"][name="selected_users"]');
    var spinnerHTML = '<div class="spinner"></div>';

    // Check if any checkbox is selected
    function isAnyCheckboxSelected() {
        return Array.from(checkboxes).some(checkbox => checkbox.checked);
    }

    // When the user clicks the delete button
    btn.onclick = function() {
        if (isAnyCheckboxSelected()) {
            modalErrorMessage.style.display = "none"; // Hide error message if any checkbox is selected
            confirmDeleteSection.style.display = "block"; // Show the confirmation section
            modal.style.display = "block";  // Show the modal
        } else {
            modalErrorMessage.innerHTML = "Please select at least one user to delete."; // Set error message
            modalErrorMessage.style.display = "block"; // Display the error message
            confirmDeleteSection.style.display = "none"; // Hide the confirmation section
            modal.style.display = "block";  // Show modal with error message
        }
    }

    // Close modal when 'X' is clicked
    span.onclick = function() {
        modal.style.display = "none";
        modalErrorMessage.style.display = "none"; // Hide error message
        confirmDeleteSection.style.display = "none"; // Hide confirmation section
    }

    // Close modal when 'No' is clicked
    cancelBtn.onclick = function() {
        modal.style.display = "none";
        modalErrorMessage.style.display = "none"; // Hide error message
        confirmDeleteSection.style.display = "none"; // Hide confirmation section
    }

    // Prevent modal from closing if clicked inside the content
    modal.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            modalErrorMessage.style.display = "none"; // Hide error message
            confirmDeleteSection.style.display = "none"; // Hide confirmation section
        }
    }

    // Handle delete confirmation
    confirmDeleteBtn.onclick = function(event) {
        var password = document.getElementById("confirm-password").value;
        if (password) {
            var input = document.createElement("input");
            input.type = "hidden";
            input.name = "confirm_password";
            input.value = password;
            document.getElementById("delete-form").appendChild(input);

            // Show spinner and disable button
            confirmDeleteBtn.innerHTML = spinnerHTML;
            confirmDeleteBtn.disabled = true;

            var xhr = new XMLHttpRequest();
            xhr.open("POST", document.getElementById("delete-form").action, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.onload = function() {
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
            xhr.send(new URLSearchParams(new FormData(document.getElementById("delete-form"))).toString());
        } else {
            modalErrorMessage.innerHTML = "Please enter your password."; // Show password error
            modalErrorMessage.style.display = "block"; // Display password error
        }
    }
});
