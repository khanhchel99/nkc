# Email Integration Setup

This document explains how to set up the email functionality for the NKC admin dashboard.

## Current Setup (Basic Email)

The system is currently configured to send emails using basic SMTP authentication with Gmail. The configuration is in `.env.local`:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=khanhnguyen1999pro@gmail.com
EMAIL_PASS=ndrt rjoa cayb rngg
EMAIL_FROM=khanhnguyen1999pro@gmail.com
```

## Features

### Email Templates
The system includes three pre-built email templates:

1. **Inquiry Acknowledgment** - Automatically thanks customers for their inquiry
2. **Quote Ready** - Notifies customers when their quote is ready
3. **Follow Up** - For following up on inquiries

### Email Composer
- Template-based email composition
- HTML and plain text support
- Customer information auto-population
- Email threading support
- Rich text preview

### Admin Dashboard Integration
- Send emails directly from inquiry details
- Quick email button on each inquiry
- Professional email templates with company branding

## How to Use

1. **Access Admin Dashboard**: Navigate to `/admin/inquiries`
2. **View Inquiry**: Click "View Details" on any inquiry
3. **Compose Email**: Click "Reply via Email" button
4. **Select Template**: Choose from available templates
5. **Customize**: Edit subject and content as needed
6. **Send**: Click "Send Email" to deliver

## Advanced Setup (OAuth2)

For enhanced features like email threading and better deliverability, you can set up Gmail OAuth2:

### 1. Create Google Cloud Project
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing one
- Enable Gmail API

### 2. Create OAuth2 Credentials
- Go to Credentials section
- Create OAuth2 Client ID
- Add authorized redirect URI: `https://developers.google.com/oauthplayground`

### 3. Get Refresh Token
- Go to [OAuth2 Playground](https://developers.google.com/oauthplayground)
- Select Gmail API v1 and required scopes
- Authorize and get refresh token

### 4. Update Environment Variables
Add these to your `.env.local`:

```
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
```

### 5. Switch to OAuth2
Uncomment the OAuth2 code in `/src/app/api/send-email/route.ts` and comment out the basic SMTP code.

## Email Threading

The system automatically adds email threading headers to organize conversations:
- `In-Reply-To`: Links emails to original inquiry
- `References`: Maintains conversation thread

## Security Notes

- Use app-specific passwords for Gmail SMTP
- Store sensitive credentials in environment variables
- Consider using OAuth2 for production deployments
- Implement rate limiting for email sending

## Troubleshooting

### Common Issues

1. **"Invalid credentials"**: Check email/password in `.env.local`
2. **"Less secure app access"**: Enable in Gmail settings or use app password
3. **"Connection timeout"**: Check firewall/network settings
4. **"Daily limit exceeded"**: Gmail has daily sending limits

### Testing

Test email functionality using:
- Local development environment
- Valid recipient email addresses
- Check spam folders for delivered emails

## Customization

### Email Templates
Edit templates in `/src/lib/email-templates.ts`:
- Add new templates
- Modify existing content
- Update company branding

### Styling
Templates use inline CSS for better email client compatibility:
- Colors match NKC brand (#895D35)
- Responsive design for mobile devices
- Professional layout with company information

## Support

For technical support with email integration:
1. Check server logs for error messages
2. Verify environment variables
3. Test with simple email first
4. Contact system administrator if issues persist
