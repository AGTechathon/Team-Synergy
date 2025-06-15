// WhatsApp messaging utility
// This uses WhatsApp Business API or third-party services

class WhatsAppService {
  constructor() {
    // You can use services like:
    // - WhatsApp Business API (official)
    // - CallMeBot API (free)
    // - Ultramsg API
    // - WhatsMate API
    
    // Using CallMeBot API as it's free and doesn't require Twilio
    this.apiUrl = 'https://api.callmebot.com/whatsapp.php';
  }

  // Format phone number for WhatsApp (remove + and spaces)
  formatPhoneNumber(phone) {
    return phone.replace(/[\s\-\+\(\)]/g, '');
  }

  // Send WhatsApp message using CallMeBot API
  async sendMessage(phoneNumber, message) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // CallMeBot requires the user to first send a message to their bot
      // to get an API key. For demo purposes, we'll use a mock response
      
      const params = new URLSearchParams({
        phone: formattedPhone,
        text: message,
        apikey: 'YOUR_CALLMEBOT_API_KEY' // Users need to get this from CallMeBot
      });

      const response = await fetch(`${this.apiUrl}?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status}`);
      }

      return { success: true, message: 'WhatsApp message sent successfully' };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Alternative method using WhatsApp Web URL (opens in browser)
  generateWhatsAppWebUrl(phoneNumber, message) {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  // Bulk send to multiple contacts
  async sendBulkMessages(contacts, message) {
    const results = [];
    
    for (const contact of contacts) {
      const result = await this.sendMessage(contact.phone || contact.contact, message);
      results.push({
        contact: contact.name || contact.contact,
        phone: contact.phone || contact.contact,
        ...result
      });
      
      // Add delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  // Generate WhatsApp links for manual sending
  generateBulkWhatsAppLinks(contacts, message) {
    return contacts.map(contact => ({
      name: contact.name || 'Unknown',
      phone: contact.phone || contact.contact,
      whatsappUrl: this.generateWhatsAppWebUrl(contact.phone || contact.contact, message)
    }));
  }
}

export default WhatsAppService;
