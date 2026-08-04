export function verificationEmail(name: string, verifyUrl: string) {
    return {
        subject: "Vwirfy your email",
        html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Welcome, ${name}!</h2>
            <p>Confirm your email address to finish setting up your account.</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
              Verify Email
            </a>
            <p style="color:#666;font-size:12px;margin-top:20px;">If you didn't create this account, you can ignore this email.</p>
        </div>
      `,
    };
}

export function shareNotificationEmail(fileName: string, shareUrl: string) {
    return {
        subject: `A file was shared with you: ${fileName}`,
        html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>${fileName}</h2>
            <p>Someone shared a file with you.</p>
            <a href="${shareUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
              View File
            </a>
        </div>
        `,
    };
}

export function expiryReminderEmail(fileName: string, shareUrl: string, hoursLeft: Number) {
    return {
        subject: `Your share link "${fileName} expires soon.`,
        html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Expiring soon</h2>
            <p>Your share link for <strong>${fileName}</strong> expires in about ${hoursLeft} hours.</p>
            <a href="${shareUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
              View Link
            </a>
        </div>
        `,
    }
}