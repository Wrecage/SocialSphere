function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    var loginForm = document.querySelector('form');
    loginForm.addEventListener('submit', function (event) {
        showLoading();
    });
});
