/**
 * Rental Actions Handler
 * Handles payment, cancellation, return and extension of rentals
 */

// Payment function
function payRental(rentalId, amount) {
    if (confirm(`Wilt u €${amount} betalen voor deze verhuur?`)) {
        fetch(`/customer/rentals/${rentalId}/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount: amount })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Betaling Gelukt!', `€${amount} is succesvol betaald`);
                reloadRentalsContent();
            } else {
                showToast('error', 'Betaling Mislukt!', data.message || 'Er is een fout opgetreden bij de betaling');
            }
        })
        .catch(error => {
            console.error('Payment error:', error);
            showToast('error', 'Betaling Mislukt!', 'Er is een fout opgetreden bij de betaling');
        });
    }
}

// Rental cancellation function
function cancelRental(rentalId, filmTitle) {
    if (confirm(`Weet je zeker dat je de verhuur van "${filmTitle}" wilt annuleren?`)) {
        fetch(`/customer/rentals/${rentalId}/cancel`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Geannuleerd!', data.message);
                reloadRentalsContent();
            } else {
                showToast('error', 'Fout!', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('error', 'Fout!', 'Er is een fout opgetreden bij het annuleren van de verhuur');
        });
    }
}

// Return rental function
function returnRental(rentalId, filmTitle) {
    if (confirm(`Wilt u "${filmTitle}" inleveren?`)) {
        fetch(`/customer/rentals/${rentalId}/return`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Ingeleverd!', `"${filmTitle}" is succesvol ingeleverd`);
                reloadRentalsContent();
            } else {
                showToast('error', 'Inleveren Mislukt!', data.message || 'Er is een fout opgetreden bij het inleveren');
            }
        })
        .catch(error => {
            console.error('Return error:', error);
            showToast('error', 'Inleveren Mislukt!', 'Er is een fout opgetreden bij het inleveren');
        });
    }
}

// Extend rental function
function extendRental(rentalId, filmTitle) {
    if (confirm(`Wilt u de verhuur van "${filmTitle}" verlengen?`)) {
        fetch(`/customer/rentals/${rentalId}/extend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('success', 'Verlengd!', `Verhuur van "${filmTitle}" is verlengd`);
                reloadRentalsContent();
            } else {
                showToast('error', 'Verlengen Mislukt!', data.message || 'Er is een fout opgetreden bij het verlengen');
            }
        })
        .catch(error => {
            console.error('Extend error:', error);
            showToast('error', 'Verlengen Mislukt!', 'Er is een fout opgetreden bij het verlengen');
        });
    }
}
