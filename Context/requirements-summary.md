# Member Contact Information Page — Requirements Summary

## Purpose

Let members manage their own contact details online, reducing calls to member services. Last quarter, address and phone changes accounted for about 18% of service calls, averaging six minutes each.

## Scope and access

- Provide one Contact Information page with separate **Phone**, **Email**, and **Mailing address** sections.
- Each section has its own clearly named Edit action and saves independently. A member can update one section without changing the others.
- Members edit their own records. Dependents under 18 cannot edit contact details: hide their Edit actions and explain that the account holder manages the details.
- Shared-household editing is out of scope; each member edits their own record.

## Functional requirements

### Phone

- Display and edit up to two phone numbers, each with a type (for example, mobile or home).
- Allow the member to designate a preferred number; this is used for appointment reminders.
- Accept digits, spaces, dashes, and parentheses; normalize the number before saving and require ten digits.
- Provide a separate, unchecked-by-default text-message consent checkbox. A general note is not consent. Record the member's explicit consent.
- Use compliance-approved consent and opt-out wording. The wording is pending from Dana.

### Email

- Support one primary email address.
- Validate the email format.
- Do not replace the email on file until the member enters a six-digit verification code sent to the new address.
- Codes expire after ten minutes. Resending is available after a 30-second cooldown.

### Mailing address

- Require a home address; allow an optional mailing address and a control indicating that mailing address is the same as home.
- Validate the address with the postal-service lookup. If it returns a close match, let the member choose the suggestion or keep the address they entered.
- If the home-address state changes, show a pre-save warning that coverage options may change and a care-team member will follow up. The member can still save.
- Require non-empty address lines and a ZIP code of five digits or nine digits with a dash.

## Privacy, notifications, and audit

- Mask saved phone numbers to their last four digits and saved email addresses to their first character and domain by default. Provide a one-click Show control.
- Send a change confirmation to the old email address or phone number when contact details change.
- Log each change with who made it, when it occurred, and the old and new values. Retain the log for seven years.

## Validation, errors, and success states

- Use plain-language validation messages, including “Enter a 10 digit phone number” and “Enter a valid email address, like name@example.com”.
- For validation errors, show a section-level summary with links to the affected fields and a specific message under each field.
- Associate errors with their fields and announce them to screen readers. Do not rely on color alone; pair color with an icon and text.
- After a successful save, return the section to read mode, show a brief confirmation (for example, “Phone number updated”), and move focus to that message.
- If saving fails, keep the form open with entered values intact. Explain that the change could not be saved and offer a Try again action.

## Accessibility and responsive behavior

- Design mobile-first; stack sections vertically and use full-width buttons on small screens.
- Open the numeric keypad for phone-number entry.
- Give every field a visible label; placeholders alone are insufficient.
- Ensure keyboard-only operation in a logical order and touch targets at least 44 pixels high.
- Name Edit actions by section (for example, “Edit phone”).

## Open items and follow-ups

- **Dana:** provide exact text-message consent and opt-out wording (due Friday).
- **Elena:** confirm the postal lookup service and change-log retention setup (due next Tuesday).
- **Priya:** record shared-household editing as a follow-up (this week).
- Clarify which unchanged channel receives a confirmation when both a member's email and phone are being changed, and how delivery failures are handled.
- Confirm how a member may opt in or opt out of texting after the initial phone save, and whether consent can be revoked on this page.
