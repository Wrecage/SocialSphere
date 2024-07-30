document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("confirmation-modal");
    var btn = document.getElementById("delete-button");
    var span = document.getElementsByClassName("close")[0];
    var cancelBtn = document.getElementById("cancel-delete");
    var modalErrorMessage = document.getElementById("modal-error-message");
    var confirmDeleteBtn = document.getElementById("confirm-delete");
    var spinnerHTML = '<div class="spinner"></div>';

    // When the user clicks the button, open the modal
    btn.onclick = function() {
        modal.style.display = "block";
    }

    span.onclick = function() {
        modal.style.display = "none";
        modalErrorMessage.style.display = "none"; // Hide error message
    }
    cancelBtn.onclick = function() {
        modal.style.display = "none";
        modalErrorMessage.style.display = "none"; // Hide error message
    }

    modal.onclick = function(event) {
        if (event.target != this.querySelector('.modal-content') && !this.querySelector('.modal-content').contains(event.target)) {
            event.stopPropagation();
        }
    }

    // When the user clicks the Yes button
    confirmDeleteBtn.onclick = function(event) {
        var password = document.getElementById("confirm-password").value;
        if (password) {
            var input = document.createElement("input");
            input.type = "hidden";
            input.name = "confirm_password";
            input.value = password;
            document.getElementById("delete-form").appendChild(input);

            // Show spinner
            confirmDeleteBtn.innerHTML = spinnerHTML;
            confirmDeleteBtn.disabled = true;

            var xhr = new XMLHttpRequest();
            xhr.open("POST", document.getElementById("delete-form").action, true);
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
            xhr.send(new URLSearchParams(new FormData(document.getElementById("delete-form"))).toString());
        } else {
            modalErrorMessage.innerHTML = "Please enter your password.";
            modalErrorMessage.style.display = "block";
        }
    }
});
