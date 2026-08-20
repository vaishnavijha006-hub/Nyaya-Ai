export async function getConfirmationLinkFromInbucket(email: string): Promise<string> {
    const searchUrl = `http://127.0.0.1:54324/api/v1/search?query=to:${email}`;
    let messages = [];
    
    // Poll for 10 seconds
    for (let i = 0; i < 10; i++) {
        const response = await fetch(searchUrl);
        if (response.ok) {
            const data = await response.json();
            messages = data.messages || [];
            if (messages.length > 0) break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (messages.length === 0) {
        throw new Error(`Timeout: No emails found in Mailpit for ${email}`);
    }
    
    const messageId = messages[0].ID;
    const messageUrl = `http://127.0.0.1:54324/api/v1/message/${messageId}`;
    
    const messageResponse = await fetch(messageUrl);
    const messageData = await messageResponse.json();
    const body = messageData.Text || "";
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = body.match(urlRegex);
    
    if (!urls || urls.length === 0) {
        throw new Error("No confirmation link found in email");
    }
    
    // Extract the confirmation URL and rewrite the base URL to localhost:3000
    let url = urls[0];
    return url;
}
