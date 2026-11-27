// exportBookingsPdf.js — builds the PDF of the bookings table and downloads it.
// Exports ALL rows of the current filter (not only the visible page).
import { formatDateTime, formatId, PAYMENT_LABELS, STATUS_LABELS } from "./bookingFormat";

const GOLD = [172, 143, 64];

// jspdf is loaded only when Export is clicked, so the rest of the site stays light
export async function exportBookingsPdf(rows, { title = "Booking Management", filterLabel = "All Booking" } = {}) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date();

  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(30, 26, 20);
  doc.text(`Athar - ${title}`, 40, 46);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(120, 110, 95);
  doc.text(`Filter: ${filterLabel}   |   Total: ${rows.length}   |   Generated: ${formatDateTime(now)} ${now.getFullYear()}`, 40, 64);

  const count = (s) => rows.filter((r) => r.status === s).length;
  doc.text(`Confirmed: ${count("confirmed")}   Pending: ${count("pending")}   Cancelled: ${count("cancelled")}`, 40, 79);

  autoTable(doc, {
    startY: 94,
    head: [["ID", "Visitor", "Date & Time", "Type", "Payment", "Status"]],
    body: rows.map((r) => [formatId(r.id), r.visitor, formatDateTime(r.date), r.type, PAYMENT_LABELS[r.paymentMethod] || "-", STATUS_LABELS[r.status]]),
    styles: { font: "helvetica", fontSize: 10, cellPadding: 6, textColor: [52, 53, 58] },
    headStyles: { fillColor: GOLD, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 246, 238] },
    margin: { left: 40, right: 40 },
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 5) {
        const s = String(d.cell.raw).toLowerCase();
        d.cell.styles.fontStyle = "bold";
        d.cell.styles.textColor = s === "confirmed" ? [28, 122, 82] : s === "pending" ? [183, 121, 31] : [211, 47, 47];
      }
    },
    didDrawPage: () => {
      doc.setFontSize(9).setTextColor(150);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageW - 40, doc.internal.pageSize.getHeight() - 20, { align: "right" });
    },
  });

  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  doc.save(`athar-bookings-${stamp}.pdf`);
}