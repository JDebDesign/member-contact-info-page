# Member Contact Information Page — Jira-Style Stories

## MCI-101 — Manage phone numbers and text consent

**User story**  
As a primary account holder, I want to update my phone numbers and choose a preferred number so that appointment reminders use the right phone.

**Acceptance criteria**

1. **View and edit**
   - Given I can manage my own contact information, when I open the Phone section, then I can see up to two saved numbers with their type labels and a preferred-number indicator.
   - When I choose **Edit phone**, then only the phone section enters edit mode and can be saved independently of email and address.
   - Given the displayed record belongs to a dependent under 18, when the page loads, then Edit actions are hidden and a note says the account holder manages these details.
2. **Validate and save**
   - Given I enter a phone number containing digits, spaces, dashes, or parentheses, when I save, then formatting characters are stripped and exactly ten digits are required.
   - If the number is invalid, then the page shows “Enter a 10 digit phone number” in an inline field message and a linked section error summary.
   - When the save succeeds, then the section returns to read mode, displays “Phone number updated,” and moves focus to that confirmation.
   - If the save fails, then my entered values remain in the open form and I can try again.
3. **Preference, consent, and privacy**
   - When I mark a number preferred, then it becomes the number used for appointment reminders and no more than one number is preferred.
   - When I choose to receive text messages, then I must explicitly check a separate consent checkbox that is unchecked by default; the approved consent and opt-out wording is shown and the consent is recorded.
   - By default, saved numbers are masked except for the last four digits; a Show control reveals the number.
4. **Audit and accessibility**
   - After a change, a confirmation is sent to the old contact channel and an audit entry records who changed the value, when, and the old and new values; the entry is retained for seven years.
   - Fields have visible labels, errors are associated with fields and announced to screen readers, and errors use text and an icon as well as color.
   - The flow works with a keyboard in logical order, touch targets are at least 44 pixels high, and phone entry opens a numeric keypad on mobile.

## MCI-102 — Change and verify primary email

**User story**  
As a primary account holder, I want to change my primary email address and verify it before it replaces the saved address so that I continue receiving account notices.

**Acceptance criteria**

1. **View and edit**
   - Given I can manage my own contact information, when I open the Email section, then the saved address is masked to its first character and domain by default, with a Show control.
   - When I choose **Edit email**, then only the email section enters edit mode and can be saved independently.
   - Given the displayed record belongs to a dependent under 18, when the page loads, then Edit actions are hidden and a note says the account holder manages these details.
2. **Verification**
   - Given I enter a syntactically valid email address, when I continue, then a six-digit verification code is sent to that new address and the existing address remains on file.
   - Given I enter an invalid email address, when I submit it, then I see “Enter a valid email address, like name@example.com” both inline and in a linked section error summary.
   - Given I enter the correct, unexpired six-digit code, when I submit it, then the new address replaces the old one.
   - Given the code is more than ten minutes old, when I submit it, then it is rejected and the existing address remains unchanged.
   - Given fewer than 30 seconds have passed since the last code was sent, when I request another, then resend is unavailable; after the cooldown, I can request a new code.
3. **Save outcomes and audit**
   - When the verified change succeeds, then the section returns to read mode, displays an email-updated confirmation, and moves focus to that message.
   - If saving fails, then the form and entered values remain available and I can try again.
   - After a change, a confirmation is sent to the old contact channel and an audit entry records who changed the value, when, and the old and new values; the entry is retained for seven years.
4. **Accessibility**
   - Fields have visible labels, errors are associated with fields and announced to screen readers, and errors use text and an icon as well as color.
   - The flow works with a keyboard in logical order and touch targets are at least 44 pixels high.

## MCI-103 — Manage home and mailing addresses

**User story**  
As a primary account holder, I want to update my home and optional mailing addresses so that my mail and coverage information stay current.

**Acceptance criteria**

1. **View and edit**
   - Given I can manage my own contact information, when I open the Mailing address section, then I can view and edit a required home address and an optional mailing address.
   - When I indicate that my mailing address is the same as home, then the separate mailing-address fields are not required.
   - When I choose **Edit mailing address**, then only the address section enters edit mode and can be saved independently.
   - Given the displayed record belongs to a dependent under 18, when the page loads, then Edit actions are hidden and a note says the account holder manages these details.
2. **Validate and confirm address**
   - Given I submit an address, when required address lines are empty or the ZIP code is not five digits or nine digits with a dash, then the form identifies the affected fields with plain-language inline messages and a linked section error summary.
   - When the postal lookup returns a close match, then I can choose either the suggested address or the address I entered.
   - Given I change the home-address state, when I save, then a warning says coverage options may change and a care-team member will follow up; I can still proceed with the save.
3. **Save outcomes and audit**
   - When the save succeeds, then the section returns to read mode, displays an address-updated confirmation, and moves focus to that message.
   - If saving fails, then the form and entered values remain available and I can try again.
   - After a change, a confirmation is sent to the old contact channel and an audit entry records who changed the value, when, and the old and new values; the entry is retained for seven years.
4. **Privacy, accessibility, and responsive behavior**
   - Fields have visible labels, errors are associated with fields and announced to screen readers, and errors use text and an icon as well as color.
   - The flow works with a keyboard in logical order and touch targets are at least 44 pixels high.
   - On small screens, sections stack vertically and buttons are full width.
