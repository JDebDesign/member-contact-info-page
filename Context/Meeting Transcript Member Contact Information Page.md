# Sample Meeting Transcript: Member Contact Information Page

Nov 9, 2026 · @Jacques Debeuneure

A fictional meeting transcript for Hands-on Activity 01. Participants turn it into a requirements summary, sample records, stories, a flow, and a Figma frame. All names and details are invented.

## Meeting details

| Item | Detail |
| --- | --- |
| Meeting | Member portal: Contact Information page kickoff |
| Length | 26 minutes, lightly edited |
| Format | Video call, recorded and auto-transcribed |
| Goal | Agree what the new Contact Information page must do before design starts |

## Attendees

| Speaker | Role |
| --- | --- |
| Priya Nair | Product manager |
| Marcus Webb | UX designer |
| Elena Ruiz | Engineering lead |
| Tom Okafor | Business analyst |
| Dana Whitfield | Privacy and compliance |
| Sam Lindqvist | Accessibility specialist |

## Transcript, part 1

**\[00:00\] Priya:** Okay, let's get started. Thanks everyone. Today is about the Contact Information page in the member portal. Right now members can only change their phone number or address by calling us, and that is driving a lot of calls. I want us to leave with a shared picture of what the page needs to do.

**\[00:42\] Tom:** Some numbers to ground this. Last quarter about 18 percent of all member service calls were address or phone changes. The average call runs six minutes. Most of those members said they would have done it online if they could.

**\[01:15\] Priya:** That is the case for building it. Marcus, what do you see as the core experience?

**\[01:24\] Marcus:** I would keep it small. One page, three sections: phone, email, and mailing address. Each section shows what we have on file, with an Edit button. Edit turns the section into a form, so people only change one thing at a time and never see a giant form.

**\[02:05\] Elena:** Does each section save on its own, or is there one Save at the bottom?

**\[02:11\] Marcus:** Each section saves on its own. If someone only wants to update their phone, they should not have to touch the address.

**\[02:22\] Elena:** Good, that also keeps the API calls simple. One call per section.

**\[02:34\] Tom:** On the data side, a member can have more than one phone. Mobile and home, mainly. Do we show both?

**\[02:44\] Priya:** Yes. Show up to two phone numbers, each with a type label, and let the member mark one as preferred. Preferred is the one we use for appointment reminders.

**\[03:10\] Marcus:** So the phone section needs a type dropdown and a preferred checkbox. I will also add a note that texts may be sent to a mobile number.

**\[03:27\] Dana:** Careful with that. If we send texts, we need explicit consent, and it has to be recorded. A note is not consent. There should be a separate checkbox that is unchecked by default, with the consent wording next to it.

**\[03:52\] Priya:** Agreed. Dana, can you send the exact wording?

**\[03:57\] Dana:** I will have it to you by Friday. It also needs to say how to opt out.

**\[04:20\] Tom:** What about email? One address only?

**\[04:25\] Priya:** One primary email for now. We can add a secondary later if members ask for it.

**\[04:38\] Elena:** When someone changes their email, do we verify it?

**\[04:44\] Dana:** Yes, we should. Send a six digit code to the new address, and do not change the email on file until the code is entered. Otherwise a typo could lock a member out of account notices.

**\[05:14\] Marcus:** So the email flow has two steps. Enter the new address, then enter the code. I will design both states.

**\[05:30\] Elena:** Codes should expire. Ten minutes works for us.

**\[05:36\] Priya:** Fine. Ten minutes, and a Resend link that waits 30 seconds between uses.

**\[06:02\] Tom:** Now the mailing address. Members have a home address and sometimes a separate mailing address, for example a PO box. Do we support both?

**\[06:15\] Priya:** Yes. Home address is required. Mailing address is optional, and there is a checkbox that says the mailing address is the same as home.

**\[06:38\] Elena:** We will validate addresses against the postal service lookup. If it finds a close match, we show a suggestion and the member picks the suggested one or keeps what they typed.

**\[07:01\] Marcus:** I like that. A banner above the form, two choices, no scary red text.

**\[07:12\] Dana:** One more thing on address. If the home address moves to a different state, the plan options may change. We need a warning before they save.

**\[07:30\] Priya:** Good catch. When the state changes, show a message that coverage options may change and a care team member will follow up. They can still save.

## Transcript, part 2

**\[09:48\] Sam:** Can I add accessibility requirements before we get further? Every field needs a visible label, not just placeholder text. Errors must be announced to screen readers and tied to the field they belong to. And the Edit button needs to say which section it edits, so "Edit phone" and not just "Edit".

**\[10:20\] Marcus:** Understood. I will name the buttons that way. Should error messages appear next to the field or at the top?

**\[10:30\] Sam:** Both. A short summary at the top of the section with links to each problem, and a specific message under each field. Also, do not rely on color alone. Use an icon and text along with the red.

**\[11:02\] Elena:** For validation, phone numbers need ten digits. We accept dashes, spaces and parentheses and strip them before saving. Email must look like an email. Address lines cannot be empty, and ZIP must be five digits or nine with a dash.

**\[11:41\] Tom:** What should the error messages say? I would like them plain, not technical.

**\[11:49\] Priya:** Something like "Enter a 10 digit phone number" and "Enter a valid email address, like name@example.com". Tell people what to do, not what they did wrong.

**\[12:30\] Dana:** On privacy. We should mask what is on file until the member asks to see it. For phone, show the last four digits. For email, show the first letter and the domain.

**\[12:52\] Marcus:** Is that too much friction? Members are already signed in.

**\[12:58\] Dana:** Signed in is not the same as alone at the screen. Masking protects members on shared computers. A "Show" link is one click.

**\[13:20\] Priya:** Fine, mask by default with a Show link. Also, any change should send a confirmation message to the old email or phone, in case the account was taken over.

**\[14:05\] Elena:** We should also log every change with who, when, and what the old and new values were. Compliance will ask for that.

**\[14:15\] Dana:** They will. Keep the log for seven years.

**\[15:40\] Tom:** What happens after a successful save?

**\[15:47\] Marcus:** The section goes back to read mode with a green confirmation line, "Phone number updated", and it stays for a few seconds. Focus moves to that message so screen reader users hear it.

**\[16:30\] Elena:** What if the save fails because the service is down?

**\[16:36\] Marcus:** The form stays open, nothing is lost, and we show "We could not save your changes. Try again in a few minutes." with a Try again button.

**\[17:20\] Priya:** What about members who are not the primary account holder? Dependents under 18, for example.

**\[17:32\] Dana:** Dependents cannot edit their own contact information. Only the primary holder can. For dependents, hide the Edit buttons and show a note that the account holder manages these details.

**\[18:10\] Tom:** And members who share an address with a spouse on the same plan?

**\[18:18\] Priya:** Out of scope for this release. Each member edits their own record. We will note it as a follow-up.

**\[19:30\] Elena:** Mobile. The portal is about 60 percent mobile traffic, so this has to work on a phone first.

**\[19:40\] Marcus:** Agreed. Sections stack vertically, buttons are full width on small screens, and the phone field opens the numeric keypad.

**\[20:15\] Sam:** Touch targets should be at least 44 pixels high. And the form must work with the keyboard only, in a logical order.

**\[24:10\] Priya:** Let me summarize what we decided. One page with three sections: phone, email, address. Each section saves on its own. Phone supports two numbers, a type, a preferred flag, and a separate text consent checkbox. Email changes need a six digit code that expires in ten minutes. Address supports home and mailing, with postal lookup and a state change warning. Everything masked by default, every change logged, and confirmations sent to the old contact. Dependents are read only. Shared household editing is a follow-up.

**\[25:30\] Tom:** I will write that up as a requirements summary and a set of sample member records for testing.

**\[25:42\] Marcus:** I will turn it into user stories and a flow, then start a first frame.

**\[26:00\] Priya:** Perfect. Let's reconvene next Tuesday to review.

**\[26:08\] Everyone:** Thanks. \[Recording ends\]

## Decisions and action items

| Owner | Action | Due |
| --- | --- | --- |
| Tom | Write the requirements summary and sample member records | Next Monday |
| Marcus | Draft user stories, a flow diagram, and the first design frame | Next Monday |
| Dana | Send the text consent wording and the opt out language | This Friday |
| Elena | Confirm the postal lookup service and the change log retention setup | Next Tuesday |
| Sam | Review the first frame against the accessibility notes above | Next Tuesday |
| Priya | Schedule the review and log shared household editing as a follow-up | This week |
