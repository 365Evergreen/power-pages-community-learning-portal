import { Router } from 'express';
import { dataverseFetch } from '../dataverseClient.js';

const router = Router();

/**
 * POST /api/register
 *
 * Creates a new Contact record in Dataverse for open self-service registration.
 * Power Pages will link this Contact to the user's auth account on first sign-in
 * (matched by email address).
 *
 * Body: { firstName, lastName, email }
 */
router.post('/', async (req, res) => {
  const { firstName, lastName, email, phone, addressLine1, addressLine2, suburb, state, postcode } = req.body;

  // Basic validation
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'firstName, lastName and email are required.' });
  }

  const emailLower = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLower)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  try {
    // Check for duplicate email
    const checkPath = `/contacts?$filter=emailaddress1 eq '${emailLower}'&$select=contactid&$top=1`;
    const checkRes = await dataverseFetch(checkPath);
    if (checkRes.ok) {
      const checkData = await checkRes.json();
      if (checkData.value?.length > 0) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }
    }

    // Create Contact record
    const createRes = await dataverseFetch('/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
      },
      body: JSON.stringify({
        firstname:                 firstName.trim(),
        lastname:                  lastName.trim(),
        emailaddress1:             emailLower,
        mobilephone:               phone        || undefined,
        address1_line1:            addressLine1 || undefined,
        address1_line2:            addressLine2 || undefined,
        address1_city:             suburb       || undefined,
        address1_stateorprovince:  state        || undefined,
        address1_postalcode:       postcode     || undefined,
        address1_country:          'Australia',
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('[register] Dataverse error:', createRes.status, errText);
      return res.status(502).json({ error: 'Registration failed. Please try again later.' });
    }

    const contact = await createRes.json();
    return res.status(201).json({
      message: 'Registration successful.',
      contactId: contact.contactid,
    });

  } catch (err) {
    console.error('[register] Unexpected error:', err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

export default router;
