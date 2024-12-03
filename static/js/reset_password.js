document.addEventListener('DOMContentLoaded', function () {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const successModal = document.getElementById('successModal');
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    const errorMessage = document.getElementById('errorMessage');

    resetPasswordForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(resetPasswordForm);
        fetch(window.location.href, {  // POST request to the current URL
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Show success modal
                successModal.style.display = 'block';
                closeSuccessModal.addEventListener('click', function () {
                    successModal.style.display = 'none';
                    window.location.href = '/events/content_login/';  // Redirect to login page after success
                });
            } else {
                // Show error message
                errorMessage.textContent = data.message;
            }
        })
        .catch(error => console.error('Error:', error));
    });
});

