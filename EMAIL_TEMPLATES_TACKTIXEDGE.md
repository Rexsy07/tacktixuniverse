# TacktixEdge - Supabase Email Templates

These are the professional HTML email templates for TacktixEdge authentication system. Copy and paste each template into your Supabase Dashboard → Authentication → Email Templates.

## 1. Confirm Signup Email Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to TacktixEdge</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin-bottom: 10px;">Welcome to TacktixEdge</h1>
        <p style="font-size: 16px; color: #666;">Your competitive gaming platform</p>
    </div>

    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">Confirm Your Account</h2>
        
        <p>Thank you for joining TacktixEdge! To complete your registration and start competing, please confirm your email address.</p>
        
        <div style="text-align: center; margin: 25px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
               Confirm Account
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
            If the button does not work, copy this link: {{ .ConfirmationURL }}
        </p>
    </div>

    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
        <p>Best regards,<br>The TacktixEdge Team</p>
        <p style="font-size: 12px;">
            This email was sent because you created an account on TacktixEdge. 
            If you did not create an account, please ignore this email.
        </p>
    </div>

</body>
</html>
```

## 2. Magic Link Email Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TacktixEdge Magic Link</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin-bottom: 10px;">TacktixEdge</h1>
        <p style="font-size: 16px; color: #666;">Your competitive gaming platform</p>
    </div>

    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">🚀 Your Magic Link</h2>
        
        <p>You requested a magic link to sign in to your TacktixEdge account. Click the button below to log in instantly - no password required!</p>
        
        <div style="text-align: center; margin: 25px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
               🔗 Sign In with Magic Link
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
            If the button does not work, copy this link: {{ .ConfirmationURL }}
        </p>
        
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
            ⚠️ This magic link will expire in 1 hour for security reasons.
        </p>
    </div>

    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
        <p>Best regards,<br>The TacktixEdge Team</p>
        <p style="font-size: 12px;">
            This magic link was requested from your TacktixEdge account. 
            If you did not request this, please ignore this email.
        </p>
    </div>

</body>
</html>
```

## 3. Reset Password Email Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your TacktixEdge Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin-bottom: 10px;">TacktixEdge</h1>
        <p style="font-size: 16px; color: #666;">Your competitive gaming platform</p>
    </div>

    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">🔒 Reset Your Password</h2>
        
        <p>We received a request to reset your TacktixEdge account password. Click the button below to create a new secure password.</p>
        
        <div style="text-align: center; margin: 25px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
               Reset Password
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
            If the button does not work, copy this link: {{ .ConfirmationURL }}
        </p>
        
        <p style="font-size: 12px; color: #999; margin-top: 20px;">
            ⚠️ This password reset link will expire in 1 hour for security reasons.
        </p>
    </div>

    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
        <p>Best regards,<br>The TacktixEdge Team</p>
        <p style="font-size: 12px;">
            This password reset was requested for your TacktixEdge account. 
            If you did not request this, please ignore this email or contact support.
        </p>
    </div>

</body>
</html>
```

## 4. Change Email Address Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Email Change - TacktixEdge</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin-bottom: 10px;">TacktixEdge</h1>
        <p style="font-size: 16px; color: #666;">Your competitive gaming platform</p>
    </div>

    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">📧 Confirm Email Change</h2>
        
        <p>We received a request to update your email address on TacktixEdge.</p>
        
        <div style="background: #fff; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #4f46e5;">
            <p style="margin: 0;"><strong>From:</strong> {{ .Email }}</p>
            <p style="margin: 0;"><strong>To:</strong> {{ .NewEmail }}</p>
        </div>
        
        <p>Click the button below to confirm this change:</p>
        
        <div style="text-align: center; margin: 25px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
               Confirm Email Change
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
            If the button does not work, copy this link: {{ .ConfirmationURL }}
        </p>
    </div>

    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
        <p>Best regards,<br>The TacktixEdge Team</p>
        <p style="font-size: 12px;">
            This email change was requested for your TacktixEdge account. 
            If you did not request this change, please ignore this email or contact support immediately.
        </p>
    </div>

</body>
</html>
```

## 5. Invite User Email Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to TacktixEdge</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin-bottom: 10px;">TacktixEdge</h1>
        <p style="font-size: 16px; color: #666;">Your competitive gaming platform</p>
    </div>

    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">🎮 You've Been Invited!</h2>
        
        <p>Congratulations! You've been invited to join <strong>TacktixEdge</strong>, the ultimate competitive gaming platform where skill meets strategy.</p>
        
        <div style="background: #fff; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0; font-weight: bold; color: #10b981;">What awaits you:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Competitive tournaments and matches</li>
                <li>Real-time leaderboards</li>
                <li>Connect with fellow gamers</li>
                <li>Earn rewards and recognition</li>
            </ul>
        </div>
        
        <p>Click the button below to accept your invitation and create your account:</p>
        
        <div style="text-align: center; margin: 25px 0;">
            <a href="{{ .ConfirmationURL }}" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
               🚀 Accept Invitation
            </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
            If the button does not work, copy this link: {{ .ConfirmationURL }}
        </p>
        
        <p style="text-align: center; margin-top: 20px;">
            <a href="https://Rexsy07.github.io/tacktixuniverse" style="color: #4f46e5; text-decoration: none;">
                🌐 Visit TacktixEdge
            </a>
        </p>
    </div>

    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
        <p>Best regards,<br>The TacktixEdge Team</p>
        <p style="font-size: 12px;">
            This invitation was sent to you because someone believes you'd be a great addition to our gaming community. 
            If you're not interested, you can safely ignore this email.
        </p>
    </div>

</body>
</html>
```

## 6. Reauthentication Email Template (Spam-Filter Optimized)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Verification Code - TacktixEdge</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4f46e5; margin-bottom: 10px;">TacktixEdge</h1>
        <p style="font-size: 16px; color: #666;">Your competitive gaming platform</p>
    </div>

    <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">Account Verification Code</h2>
        
        <p>Hello! You've requested access to a protected area of your TacktixEdge account. Please use the verification code below to proceed:</p>
        
        <div style="text-align: center; margin: 25px 0;">
            <div style="background: #fff; border: 2px solid #4f46e5; padding: 20px; border-radius: 8px; display: inline-block;">
                <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #4f46e5; letter-spacing: 6px;">{{ .Token }}</span>
            </div>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">
            Copy this code into the verification form on TacktixEdge
        </p>
        
        <div style="background: #e0f2fe; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #0369a1;">
            <p style="margin: 0; font-size: 14px;">
                <strong>Important:</strong> This verification code is valid for 10 minutes only. Keep this code private and never share it with others.
            </p>
        </div>

        <p style="font-size: 13px; color: #888; margin-top: 20px;">
            Having trouble? Visit our help center or contact our support team through your TacktixEdge account dashboard.
        </p>
    </div>

    <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #666;">
        <p>Thank you for using TacktixEdge!</p>
        <p style="margin-top: 10px;">The TacktixEdge Support Team</p>
        <p style="font-size: 12px; color: #999; margin-top: 15px;">
            This message was sent to you because you are registered with TacktixEdge. 
            This verification code was requested from your account dashboard.
        </p>
    </div>

</body>
</html>
```

---

## 📋 Implementation Instructions

1. **Copy each template above** and paste it into the corresponding email template in your Supabase Dashboard
2. **Go to:** Supabase Dashboard → Authentication → Email Templates  
3. **Update each template** (Confirm signup, Invite user, Magic Link, etc.)
4. **Save** each template after updating

## 🎨 Design Features

- ✅ **Professional HTML structure** with proper DOCTYPE
- ✅ **Consistent TacktixEdge branding** throughout
- ✅ **Mobile-responsive** design
- ✅ **Color-coded buttons** for different actions
- ✅ **Security warnings** where appropriate
- ✅ **Fallback links** for email clients that don't support buttons
- ✅ **Professional footer** with team signature

These templates will work perfectly with your authentication system and provide a professional experience for your TacktixEdge users! 🎮