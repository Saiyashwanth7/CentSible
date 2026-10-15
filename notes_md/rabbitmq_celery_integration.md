# The problem we are dealing with

### 1. At registration:

When a new user regaister their profile, we would send a email confirming their profile/welcome email.
For sending the welcom email, we have to call an email sender function inside the register API, but sometimes email sender brokers might experience issues which leads to user registration failure, but the email_sender() function and user_registration() function are two different things and one's error must not break other function's process. This results a bad User experience. We need celery operations for this.

### 2. Monthly recurring expense email

User should recieve a monthly emails regarding his recurring expenses. These emails are not triggered by any function directly like the welcome email, this needs to be treated as it's own problem. For this, we will use RabbitMQ along with Celery Beat for monthly scheduled emails.

## Welcome email flow:

### Step 1 — Browser

User registration form submit chesthadu.

### Step 2 — FastAPI

User ni database lo save chesi, send_welcome_email.delay(...) call chesthundi.

### Step 3 — RabbitMQ ->This is just a place to store our enqueued celery oprations,this doesn't send mails

Email task message ni queue lo hold chesthundi.

### Step 4 — Celery worker

Queue nunchi task theeskoni email code run chesthundi.

### Step 5 — Brevo

Email provider email ni send cheyyadaniki process chesthundi.

##
