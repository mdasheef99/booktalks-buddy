# Page snapshot

```yaml
- button "Back to login page":
  - img
- heading "Create an Account" [level=3]
- paragraph: Join BookConnect to connect with other book lovers
- text: Email
- textbox "Email"
- text: Username *
- textbox "Username *"
- text: Password
- textbox "Password"
- button:
  - img
- paragraph: Password must be at least 6 characters long
- button "Create Account" [disabled]
- text: Already have an account?
- link "Sign In":
  - /url: /login
- region "Notifications alt+T"
```