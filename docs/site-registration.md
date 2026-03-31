
# **Instructions: Configuring User Registration for External Users in Power Pages**

**Document Purpose**  
This guide walks you through configuring **user registration (sign-up)** for external audiences on a Power Pages website. External users can register using:

- **Local accounts** (username + password stored in Dataverse – not recommended for production)
- **External identity providers** (recommended): Microsoft Entra External ID, Azure AD B2C, Google, Microsoft Account, LinkedIn, or custom OpenID Connect providers

Power Pages stores authenticated user information as **Contact records** in Dataverse. Registration creates or links these records automatically.

**When to Use This Guide**  
- Public-facing websites where external customers, partners, or citizens need to create accounts.
- Scenarios requiring self-service sign-up (open registration) or controlled onboarding (invitations).

**Prerequisites**  
- Access to the Power Pages **design studio** for the target site.
- Power Platform Administrator or System Administrator rights (for advanced settings and web roles).
- Optional: Microsoft Entra admin access if using Entra External ID or similar providers.
- The site should be set to **Public** visibility (not Private) for external users.

---

## **Step 1: Enable Site Authentication**

1. Go to **[Power Pages](https://make.powerpages.microsoft.com)** and open your site in the **design studio**.
2. In the left navigation, select the **Security** workspace.
3. Under **Manage**, click **Identity providers**.
4. Ensure **Local sign in** is configured (you can disable it later if using only external providers).
5. Enable desired **external identity providers**:
   - Click **Configure** next to the provider (e.g., Microsoft Entra External ID, Google, etc.).
   - Follow the provider-specific setup (you may need to switch to the Microsoft Entra admin center or the provider’s portal to get Client ID, Secret, Authority, etc.).
   - Return to Power Pages and complete the configuration.

**Tip**: Microsoft strongly recommends using **external identity providers** (especially **Microsoft Entra External ID**) instead of local username/password accounts for better security and user experience.

---

## **Step 2: Configure General Authentication & Registration Settings**

In the **Security** workspace, go to **Authentication settings** (or edit via **Site settings** in the Portal Management app).

Key settings you should review and configure:

| Setting | Recommended Value for External Users | Description |
|---------|--------------------------------------|-----------|
| **Authentication/Registration/Enabled** | **True** | Enables all forms of user registration. |
| **Authentication/Registration/OpenRegistrationEnabled** | **True** (for self-service) or **False** (controlled access) | Turns the public sign-up form on or off. Set to **True** to allow anyone to register. |
| **Authentication/Registration/ExternalLoginEnabled** | **True** | Allows sign-up and sign-in with external identity providers. |
| **Authentication/Registration/RequireUniqueEmail** | **True** | Prevents duplicate email addresses during sign-up. |
| **Authentication/Registration/InvitationEnabled** | **True** (optional) | Enables invitation code redemption for controlled registration. |
| **CaptchaEnabled** | **True** (if open registration is enabled) | Helps prevent spam/bot registrations. |

You can edit these directly in the design studio under **Security > Authentication**, or via the **Portal Management app > Site Settings**.

---

## **Step 3: Choose Your Registration Approach**

### **Option A: Open Self-Service Registration (Recommended for public sites)**

- Set **OpenRegistrationEnabled** = **True**.
- Users can visit the sign-in page, click **Sign up**, and create an account using:
  - Local credentials (username/password), or
  - An external identity provider (e.g., “Sign in with Microsoft” or Google).
- A new **Contact** record is automatically created in Dataverse upon successful registration.

### **Option B: Invitation-Based Registration (More Secure / Controlled)**

1. Create **Contact** records in Dataverse (manually or via import/Power Automate).
2. Use the **Portal Management app** → **Security > Contacts** → select a contact → **Create Invitation**.
3. Send the invitation link to the user via email.
4. The user clicks the link, registers (or signs in with external provider), and redeems the invitation.
5. This approach works well when you want to pre-approve users.

### **Option C: Hybrid Approach**

- Keep **OpenRegistrationEnabled** = **False**.
- Use invitations for known users.
- Or combine with external providers for seamless sign-in.

---

## **Step 4: Assign Web Roles and Permissions**

After registration, new users start with minimal permissions.

1. In the **Security** workspace, go to **Web roles**.
2. Create or use an existing web role (e.g., “Authenticated Users”, “Customer”, “Partner”).
3. Assign the web role to new users automatically:
   - You can set a **default web role** for newly registered users in some configurations.
   - Or use **Table permissions** + **Row-level security** based on the Contact record.
4. Grant appropriate **Table permissions** (Read, Create, Write, etc.) to the web role for relevant Dataverse tables.

**Best Practice**: Follow the **principle of least privilege**. Start with read-only access and expand as needed.

---

## **Step 5: Customize the Sign-In and Sign-Up Pages (Optional but Recommended)**

- In the design studio, edit the **Sign-in** and **Sign-up** pages.
- Add branding, instructions, privacy policy links, and terms of use.
- Enable **email confirmation** if required (via site settings: `Authentication/Registration/ResetPasswordRequiresConfirmedEmail`).
- Add CAPTCHA or other anti-spam measures.

---

## **Step 6: Test the Configuration**

1. Open your site in an incognito/private browser (as an anonymous user).
2. Navigate to the sign-in page.
3. Test both **Sign up** (if open registration is enabled) and **Sign in** flows.
4. Verify that a new **Contact** record is created in Dataverse.
5. Check that the user receives the correct **Web role** and can access the intended pages/content.
6. Test external identity provider sign-up if configured.

---

## **Security & Governance Best Practices**

- Disable **Local sign in** in production if using external providers only.
- Enable **Governance Controls** in the **Power Platform admin center** → **Resources > Power Pages Sites** to restrict allowed identity providers across the tenant.
- Always require **email confirmation** for password resets and registrations.
- Monitor sign-ins and registrations via Dataverse or Microsoft Entra sign-in logs.
- Use **invitations** instead of fully open registration for sensitive sites.
- Consider **Microsoft Entra External ID** for a modern, secure, and scalable external user experience.

---

## **Troubleshooting Tips**

- **Sign-up form not visible** — Check that `OpenRegistrationEnabled` is set to True and the site is published.
- **External provider button missing** — Ensure **ExternalLoginEnabled** = True and the provider is correctly configured.
- **Users cannot register** — Verify the site visibility is **Public**, not Private.
- **Duplicate email errors** — Confirm `RequireUniqueEmail` setting.
- **Contact record not created** — Check web roles and table permissions.

---

## **Additional Resources**

- [Local authentication, registration, and other settings](https://learn.microsoft.com/en-us/power-pages/security/authentication/set-authentication-identity)
- [Provide access to external audiences](https://learn.microsoft.com/en-us/power-pages/security/external-access)
- [Set up Microsoft Entra External ID with Power Pages](https://learn.microsoft.com/en-us/power-pages/security/authentication/entra-external-id)
- [Invite contacts to register](https://learn.microsoft.com/en-us/power-pages/security/invite-contacts)

---

**Would you like me to customize this document further?** For example:

- Add detailed steps for configuring **Microsoft Entra External ID** specifically
- Include screenshots placeholders or a version focused on invitation-only registration
- Add a section on migrating existing users or using Power Automate for auto-provisioning
- Tailor it for a specific scenario (e.g., customer portal, partner portal, public form site)

Just let me know your requirements!