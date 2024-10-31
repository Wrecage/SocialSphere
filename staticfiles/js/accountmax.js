function showModal(errorMessage) {
    // Check if the modal element already exists, if not, create it
    let modal = document.getElementById('modal-accountmax');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-accountmax';
        modal.classList.add('modal-accountmax-overlay'); // Adds background overlay
        modal.innerHTML = `
            <div class="modal-accountmax-content">
                <h4 class="modal-accountmax-header">Error</h4>
                <p id="modal-accountmax-message" class="modal-accountmax-message"></p>
                <button class="modal-accountmax-close">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Set the error message and display the modal
    document.getElementById('modal-accountmax-message').textContent = errorMessage;
    modal.style.display = 'block';

    // Close the modal when the close button is clicked
    document.querySelector('.modal-accountmax-close').addEventListener('click', function() {
        modal.style.display = 'none';
    });
}

// Automatically show modal if there's an error message in the Django context
document.addEventListener("DOMContentLoaded", function() {
    const errorMessageElement = document.getElementById('django-error-message');
    if (errorMessageElement && errorMessageElement.textContent) {
        showModal(errorMessageElement.textContent);
    }
});
