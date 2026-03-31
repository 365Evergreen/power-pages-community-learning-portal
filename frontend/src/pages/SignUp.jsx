import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './SignUp.css'

const SIGN_IN_URL = '/_services/auth/login'

const AU_STATES = [
  { value: 'ACT', label: 'ACT — Australian Capital Territory' },
  { value: 'NSW', label: 'NSW — New South Wales' },
  { value: 'NT',  label: 'NT — Northern Territory' },
  { value: 'QLD', label: 'QLD — Queensland' },
  { value: 'SA',  label: 'SA — South Australia' },
  { value: 'TAS', label: 'TAS — Tasmania' },
  { value: 'VIC', label: 'VIC — Victoria' },
  { value: 'WA',  label: 'WA — Western Australia' },
]

const initialFields = {
  firstName:    '',
  lastName:     '',
  email:        '',
  phone:        '',
  addressLine1: '',
  addressLine2: '',
  suburb:       '',
  state:        '',
  postcode:     '',
}

const initialErrors = Object.fromEntries(Object.keys(initialFields).map(k => [k, '']))

// Strip spaces, dashes, parentheses for digit-only validation
const digitsOnly = str => str.replace(/[\s\-().+]/g, '')

function validate(fields) {
  const errors = { ...initialErrors }

  if (!fields.firstName.trim())  errors.firstName = 'First name is required.'
  if (!fields.lastName.trim())   errors.lastName  = 'Last name is required.'

  if (!fields.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!fields.phone.trim()) {
    errors.phone = 'Phone number is required.'
  } else {
    const digits = digitsOnly(fields.phone)
    if (!/^0[2-9]\d{8}$/.test(digits)) {
      errors.phone = 'Enter a valid Australian phone number (e.g. 0412 345 678).'
    }
  }

  if (!fields.addressLine1.trim()) errors.addressLine1 = 'Street address is required.'
  if (!fields.suburb.trim())       errors.suburb       = 'Suburb is required.'
  if (!fields.state)               errors.state        = 'Please select a state or territory.'

  if (!fields.postcode.trim()) {
    errors.postcode = 'Postcode is required.'
  } else if (!/^\d{4}$/.test(fields.postcode.trim())) {
    errors.postcode = 'Postcode must be 4 digits.'
  }

  return errors
}

export default function SignUp() {
  const [fields,      setFields]      = useState(initialFields)
  const [fieldErrors, setFieldErrors] = useState(initialErrors)
  const [submitError, setSubmitError] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [success,     setSuccess]     = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')

    const errors = validate(fields)
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors)
      // Scroll to first error
      const firstErrorEl = document.querySelector('[aria-invalid="true"]')
      firstErrorEl?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:    fields.firstName.trim(),
          lastName:     fields.lastName.trim(),
          email:        fields.email.trim().toLowerCase(),
          phone:        digitsOnly(fields.phone),
          addressLine1: fields.addressLine1.trim(),
          addressLine2: fields.addressLine2.trim(),
          suburb:       fields.suburb.trim(),
          state:        fields.state,
          postcode:     fields.postcode.trim(),
          country:      'Australia',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error || 'Registration failed. Please try again.')
        return
      }

      setSuccess(true)
    } catch {
      setSubmitError('Unable to reach the server. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const f = fields
  const e = fieldErrors

  return (
    <main className="signup">
      <div className="signup__card">
        <div className="signup__logo">
          <span className="signup__logo-icon" aria-hidden="true">🎓</span>
          <span className="signup__logo-text">Community Learning</span>
        </div>

        {success ? (
          <SuccessState email={f.email} />
        ) : (
          <>
            <h1 className="signup__title">Create your account</h1>
            <p className="signup__subtitle">Join the community — it only takes a moment.</p>

            <form className="signup__form" onSubmit={handleSubmit} noValidate>

              {/* ── Personal details ── */}
              <p className="signup__section-label">Personal details</p>

              <div className="signup__row">
                <Field label="First name" name="firstName" type="text"
                  autoComplete="given-name"  value={f.firstName} error={e.firstName} onChange={handleChange} />
                <Field label="Last name"  name="lastName"  type="text"
                  autoComplete="family-name" value={f.lastName}  error={e.lastName}  onChange={handleChange} />
              </div>

              <Field label="Email address" name="email" type="email"
                autoComplete="email" value={f.email} error={e.email} onChange={handleChange} />

              <Field label="Phone number" name="phone" type="tel"
                autoComplete="tel" value={f.phone} error={e.phone} onChange={handleChange}
                hint="Australian mobile or landline — e.g. 0412 345 678" />

              {/* ── Address ── */}
              <p className="signup__section-label">Address</p>

              <Field label="Street address" name="addressLine1" type="text"
                autoComplete="address-line1" value={f.addressLine1} error={e.addressLine1} onChange={handleChange} />

              <Field label="Apartment, unit, suite (optional)" name="addressLine2" type="text"
                autoComplete="address-line2" value={f.addressLine2} error={e.addressLine2} onChange={handleChange} />

              <Field label="Suburb" name="suburb" type="text"
                autoComplete="address-level2" value={f.suburb} error={e.suburb} onChange={handleChange} />

              <div className="signup__row signup__row--3-1">
                <SelectField label="State / Territory" name="state"
                  autoComplete="address-level1" value={f.state} error={e.state} onChange={handleChange}
                  options={AU_STATES} placeholder="Select state…" />
                <Field label="Postcode" name="postcode" type="text"
                  autoComplete="postal-code" inputMode="numeric" maxLength={4}
                  value={f.postcode} error={e.postcode} onChange={handleChange} />
              </div>

              {submitError && (
                <div className="signup__alert signup__alert--error" role="alert">
                  <span className="signup__alert-icon" aria-hidden="true">⚠️</span>
                  {submitError}
                </div>
              )}

              <button type="submit" className="signup__submit" disabled={submitting}>
                {submitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="signup__footer">
              Already have an account?{' '}
              <a href={SIGN_IN_URL}>Sign in</a>
            </p>
          </>
        )}
      </div>
    </main>
  )
}

function Field({ label, name, type, autoComplete, inputMode, maxLength, value, error, onChange, hint }) {
  const id = `signup-${name}`
  return (
    <div className="signup__field">
      <label className="signup__label" htmlFor={id}>{label}</label>
      {hint && <span className="signup__hint">{hint}</span>}
      <input
        id={id}
        className={`signup__input${error ? ' signup__input--error' : ''}`}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="signup__field-error" role="alert">{error}</p>
      )}
    </div>
  )
}

function SelectField({ label, name, autoComplete, value, error, onChange, options, placeholder }) {
  const id = `signup-${name}`
  return (
    <div className="signup__field">
      <label className="signup__label" htmlFor={id}>{label}</label>
      <select
        id={id}
        className={`signup__input signup__select${error ? ' signup__input--error' : ''}`}
        name={name}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(({ value: v, label: l }) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="signup__field-error" role="alert">{error}</p>
      )}
    </div>
  )
}

function SuccessState({ email }) {
  return (
    <div className="signup__success">
      <span className="signup__success-icon" aria-hidden="true">🎉</span>
      <h2>You're registered!</h2>
      <p>
        Your account has been created for <strong>{email}</strong>.
        Sign in to access the Community Learning portal.
      </p>
      <a href={SIGN_IN_URL} className="signup__signin-btn">Sign in now</a>
      <Link to="/" style={{ fontSize: '0.875rem', color: '#666', marginTop: 4 }}>
        Return to home
      </Link>
    </div>
  )
}

