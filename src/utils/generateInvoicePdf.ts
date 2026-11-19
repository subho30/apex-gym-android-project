import { InvoiceItem, MemberProfile } from '../types';

export function downloadInvoicePdf(invoice: InvoiceItem, member: MemberProfile) {
  const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${invoice.id} - Apex Gym</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fff; color: #111; margin: 0; padding: 40px; }
    .invoice-card { max-width: 740px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #09090b; padding-bottom: 20px; }
    .brand-logo { display: inline-block; background: #a3e635; color: #09090b; font-weight: 900; font-size: 24px; padding: 10px 18px; border-radius: 12px; margin-bottom: 8px; }
    .badge-paid { background: #dcfce7; color: #15803d; border: 1px solid #86efac; font-weight: 800; text-transform: uppercase; padding: 6px 16px; border-radius: 8px; font-size: 13px; letter-spacing: 1px; }
    .grid-2 { display: flex; justify-content: space-between; margin-top: 28px; }
    .text-sm { font-size: 13px; color: #4b5563; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin-top: 28px; }
    .table th { background: #f9fafb; text-align: left; padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb; color: #6b7280; }
    .table td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    .total-section { margin-top: 20px; display: flex; justify-content: flex-end; }
    .total-box { width: 280px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .grand-total { border-top: 2px solid #09090b; padding-top: 10px; font-weight: 900; font-size: 16px; color: #09090b; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 11px; color: #9ca3af; text-align: center; }
    @media print { body { padding: 0; } .invoice-card { border: none; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand-logo">APEX GYM</div>
        <p style="margin: 0; font-weight: 800; font-size: 16px;">Apex Strength & Conditioning Pvt Ltd</p>
        <p class="text-sm" style="margin: 4px 0 0 0;">
          14/B Park Street, Camac Street Crossing, Kolkata 700016<br />
          <strong>GSTIN:</strong> 19AAACA9999Z1Z5 • <strong>State Code:</strong> 19 (WB)
        </p>
      </div>
      <div style="text-align: right;">
        <span class="badge-paid">● PAID / TAX INVOICE</span>
        <p style="margin: 12px 0 0 0; font-family: monospace; font-weight: 800; font-size: 14px;">${invoice.id}</p>
        <p class="text-sm" style="margin: 2px 0 0 0;">Date: ${invoice.date}</p>
      </div>
    </div>

    <div class="grid-2">
      <div>
        <p style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #9ca3af; margin: 0 0 6px 0;">Billed To (Member Details)</p>
        <p style="margin: 0; font-weight: 800; font-size: 15px;">${member.name}</p>
        <p class="text-sm" style="margin: 4px 0 0 0;">
          <strong>Member ID:</strong> ${member.memberId}<br />
          <strong>Mobile:</strong> ${member.mobile}<br />
          <strong>Membership Tier:</strong> ${member.tier}<br />
          <strong>Home Club:</strong> ${member.homeClub || 'Park Street Flagship'}
        </p>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #9ca3af; margin: 0 0 6px 0;">Payment Breakdown</p>
        <p class="text-sm" style="margin: 0;">
          <strong>Payment Mode:</strong> Razorpay Gateway / UPI<br />
          <strong>Card / Account:</strong> Visa •••• ${member.cardLast4 || '4829'}<br />
          <strong>Status:</strong> Completed & Verified
        </p>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>SAC Code</th>
          <th>Period</th>
          <th style="text-align: right;">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${invoice.desc}</strong><br /><span style="font-size: 11px; color: #6b7280;">Includes 24/7 Gate Access, Locker, Steam & All Group Classes</span></td>
          <td>999723</td>
          <td>1 Month / Year</td>
          <td style="text-align: right; font-weight: 700;">${invoice.amount}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-box">
        <div class="total-row">
          <span style="color: #6b7280;">Subtotal (Taxable Value):</span>
          <span>${invoice.amount}</span>
        </div>
        <div class="total-row">
          <span style="color: #6b7280;">CGST (9%):</span>
          <span>Included</span>
        </div>
        <div class="total-row">
          <span style="color: #6b7280;">SGST (9%):</span>
          <span>Included</span>
        </div>
        <div class="total-row grand-total">
          <span>Total Paid:</span>
          <span style="color: #15803d;">${invoice.amount}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      This is a digitally generated Tax Invoice and does not require a physical signature.<br />
      Thank you for training with Apex Gym! For tax inquiries, reach finance@apexgym.in
    </div>
  </div>
</body>
</html>
  `;

  // Open in new tab and trigger native print / save as PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}
