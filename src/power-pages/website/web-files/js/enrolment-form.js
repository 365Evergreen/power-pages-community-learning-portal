/**
 * Community Learning Hub – Enrolment Form JavaScript
 * Handles client-side validation and AJAX form submission for anonymous enrolment.
 * Targets: Power Pages (anonymous access), Dataverse Web API via portal endpoints.
 */
(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     Constants
     ----------------------------------------------------------------------- */
  var FORM_ID = 'enrollmentForm';
  var STATUS_ID = 'formStatusMessage';
  var SUBMIT_BTN_ID = 'enrollSubmitBtn';
  var API_ENDPOINT = '/api/enrollment';

  /* -------------------------------------------------------------------------
     Helpers
     ----------------------------------------------------------------------- */
  function getEl(id) {
    return document.getElementById(id);
  }

  function setError(inputId, errorId, message) {
    var input = getEl(inputId);
    var errorEl = getEl(errorId);
    if (!input || !errorEl) return;
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = message;
  }

  function clearError(inputId, errorId) {
    var input = getEl(inputId);
    var errorEl = getEl(errorId);
    if (!input || !errorEl) return;
    input.removeAttribute('aria-invalid');
    errorEl.textContent = '';
  }

  function showStatus(message, type) {
    var el = getEl(STATUS_ID);
    if (!el) return;
    el.textContent = message;
    el.className = 'clh-form__status clh-form__status--' + type;
    el.hidden = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideStatus() {
    var el = getEl(STATUS_ID);
    if (!el) return;
    el.hidden = true;
    el.className = 'clh-form__status';
    el.textContent = '';
  }

  function setSubmitLoading(isLoading) {
    var btn = getEl(SUBMIT_BTN_ID);
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Submitting…' : btn.dataset.originalText;
  }

  /* -------------------------------------------------------------------------
     Validation
     ----------------------------------------------------------------------- */
  function validateEmail(email) {
    // Basic RFC-compliant email pattern
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function validateForm(formData) {
    var valid = true;

    clearError('participantName', 'participantNameError');
    clearError('participantEmail', 'participantEmailError');

    var name = (formData.get('participantName') || '').trim();
    if (name.length === 0) {
      setError('participantName', 'participantNameError', 'Please enter your full name.');
      valid = false;
    } else if (name.length > 200) {
      setError('participantName', 'participantNameError', 'Name must be 200 characters or fewer.');
      valid = false;
    }

    var email = (formData.get('participantEmail') || '').trim();
    if (email.length === 0) {
      setError('participantEmail', 'participantEmailError', 'Please enter your email address.');
      valid = false;
    } else if (!validateEmail(email)) {
      setError('participantEmail', 'participantEmailError', 'Please enter a valid email address.');
      valid = false;
    }

    return valid;
  }

  /* -------------------------------------------------------------------------
     Form submission
     ----------------------------------------------------------------------- */
  function handleSubmit(event) {
    event.preventDefault();
    hideStatus();

    var form = event.target;
    var formData = new FormData(form);

    if (!validateForm(formData)) {
      // Move focus to the first error field
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var btn = getEl(SUBMIT_BTN_ID);
    if (btn && !btn.dataset.originalText) {
      btn.dataset.originalText = btn.textContent;
    }
    setSubmitLoading(true);

    var payload = {
      workshopId: formData.get('workshopId'),
      isWaitlist: formData.get('isWaitlist') === 'true',
      participantName: (formData.get('participantName') || '').trim(),
      participantEmail: (formData.get('participantEmail') || '').trim(),
      participantPhone: (formData.get('participantPhone') || '').trim(),
      accessibilityRequirements: (formData.get('accessibilityRequirements') || '').trim(),
      additionalNotes: (formData.get('additionalNotes') || '').trim()
    };

    var csrfToken = formData.get('__RequestVerificationToken');

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        '__RequestVerificationToken': csrfToken || ''
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().catch(function () {
            return { message: 'An unexpected error occurred. Please try again.' };
          }).then(function (err) {
            throw new Error(err.message || 'Submission failed.');
          });
        }
        return response.json();
      })
      .then(function (data) {
        setSubmitLoading(false);

        // Replace form with success message
        form.style.display = 'none';
        showStatus(
          data.message ||
          'Thank you! Your enrolment has been submitted. Please check your email for a confirmation.',
          'success'
        );

        // Scroll to top of section
        var section = document.querySelector('.clh-enroll-form-section');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      })
      .catch(function (err) {
        setSubmitLoading(false);
        showStatus(
          err.message || 'Something went wrong. Please try again or contact us for help.',
          'error'
        );
      });
  }

  /* -------------------------------------------------------------------------
     Inline validation on blur
     ----------------------------------------------------------------------- */
  function setupInlineValidation() {
    var nameInput = getEl('participantName');
    var emailInput = getEl('participantEmail');

    if (nameInput) {
      nameInput.addEventListener('blur', function () {
        var val = this.value.trim();
        if (val.length === 0) {
          setError('participantName', 'participantNameError', 'Please enter your full name.');
        } else {
          clearError('participantName', 'participantNameError');
        }
      });
    }

    if (emailInput) {
      emailInput.addEventListener('blur', function () {
        var val = this.value.trim();
        if (val.length === 0) {
          setError('participantEmail', 'participantEmailError', 'Please enter your email address.');
        } else if (!validateEmail(val)) {
          setError('participantEmail', 'participantEmailError', 'Please enter a valid email address.');
        } else {
          clearError('participantEmail', 'participantEmailError');
        }
      });
    }
  }

  /* -------------------------------------------------------------------------
     Init
     ----------------------------------------------------------------------- */
  function init() {
    var form = getEl(FORM_ID);
    if (!form) return; // Not on the enrolment page

    form.addEventListener('submit', handleSubmit);
    setupInlineValidation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
