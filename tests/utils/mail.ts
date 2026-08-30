export async function getConfirmationLinkFromInbucket(email: string): Promise<string> {
    const searchUrl = `http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`;
    let messages = [];
    
    console.log(`Polling Mailpit for email: ${email}`);
    
    // Poll for 30 seconds
    for (let i = 0; i < 30; i++) {
        try {
            const response = await fetch(searchUrl);
            if (response.ok) {
                const data = await response.json();
                messages = data.messages || [];
                if (messages.length > 0) {
                    console.log(`Found email after ${i} seconds`);
                    break;
                }
            } else {
                console.log(`Mailpit search failed with status ${response.status}`);
            }
        } catch (e) {
            console.log(`Fetch error: ${(e as Error).message}`);
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
    
    // Improved regex that doesn't capture trailing parentheses or quotes
    const urlRegex = /(https?:\/\/[^\s\)"']+)/g;
    const urls = body.match(urlRegex);
    
    if (!urls || urls.length === 0) {
        console.error("Body:", body);
        throw new Error("No confirmation link found in email body");
    }
    
    let url = urls[0];
    console.log(`Extracted confirmation link: ${url}`);
    
    // Depending on local setup, we may need to replace the Supabase API base 
    // with the one Next.js will proxy, but standard Supabase redirects correctly.
    return url;
}
