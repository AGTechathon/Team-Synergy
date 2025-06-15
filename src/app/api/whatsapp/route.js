import { NextResponse } from "next/server";
import WhatsAppService from "../../../../lib/whatsapp";

const whatsappService = new WhatsAppService();

export async function POST(req) {
  try {
    const { contacts, message, method = 'api' } = await req.json();

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { message: "No contacts provided" },
        { status: 400 }
      );
    }

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    let result;

    if (method === 'links') {
      // Generate WhatsApp Web links for manual sending
      result = whatsappService.generateBulkWhatsAppLinks(contacts, message);
      
      return NextResponse.json({
        message: "WhatsApp links generated successfully",
        method: 'links',
        links: result,
        totalContacts: contacts.length
      });
    } else {
      // Send via API (requires setup)
      result = await whatsappService.sendBulkMessages(contacts, message);
      
      const successCount = result.filter(r => r.success).length;
      const failCount = result.length - successCount;
      
      return NextResponse.json({
        message: "WhatsApp messages processed",
        method: 'api',
        results: result,
        totalContacts: contacts.length,
        successfulSends: successCount,
        failedSends: failCount
      });
    }
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json(
      { message: "Failed to process WhatsApp request", error: error.message },
      { status: 500 }
    );
  }
}
